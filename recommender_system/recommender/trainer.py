"""
recommender/trainer.py
EAIN Recommender — Sitting 11 Training Logic
Trains ColdStartRecommender with BPR + AugmentedBPR loss.
"""

import random, time
import numpy as np
import torch
import torch.nn.functional as F
from collections import defaultdict
from torch.utils.data import Dataset, DataLoader


# ── Dataset ───────────────────────────────────────────────────────
class WarmInteractionDataset(Dataset):
    """
    Generates (user, pos_item, neg_item) triples from train.csv.
    Negative items are sampled uniformly from unseen items.
    """

    def __init__(self, df_train, user2idx, item2idx, n_items, neg_samples=4):
        self.all_items   = list(range(n_items))
        self.neg_samples = neg_samples
        self.pairs       = []

        for _, row in df_train.iterrows():
            uid = user2idx.get(row["user_id"])
            iid = item2idx.get(str(row["listing_id"]))
            if uid is None or iid is None:
                continue
            self.pairs.append((uid, iid, float(row.get("event_weight", 1.0))))

        self.user_seen = defaultdict(set)
        for uid, iid, _ in self.pairs:
            self.user_seen[uid].add(iid)

    def __len__(self):
        return len(self.pairs) * self.neg_samples

    def __getitem__(self, idx):
        uid, pos_iid, weight = self.pairs[idx // self.neg_samples]
        seen = self.user_seen[uid]
        neg  = random.choice(self.all_items)
        while neg in seen:
            neg = random.choice(self.all_items)
        return uid, pos_iid, neg, weight


# ── Loss helpers ──────────────────────────────────────────────────
def bpr_loss_weighted(pos_scores, neg_scores, weights):
    return -(weights * F.logsigmoid(pos_scores - neg_scores)).mean()


def aug_bpr_loss(pref_scores, other_scores, confidences):
    return -(confidences * F.logsigmoid(pref_scores - other_scores)).mean()


# ── LLM pair sampler ──────────────────────────────────────────────
def sample_llm_batch(llm_pairs, batch_size=64, device="cpu"):
    if not llm_pairs:
        return None
    batch = random.sample(llm_pairs, min(batch_size, len(llm_pairs)))
    pref  = torch.tensor([b["pref"]  for b in batch], dtype=torch.long,  device=device)
    other = torch.tensor([b["other"] for b in batch], dtype=torch.long,  device=device)
    conf  = torch.tensor([b["conf"]  for b in batch], dtype=torch.float32, device=device)
    return pref, other, conf


# ── Main trainer ──────────────────────────────────────────────────
def train(model, df_train, user2idx, item2idx, all_item_ids,
          item_content_tensor, llm_pairs, cfg, device):
    """
    Full training loop for ColdStartRecommender.

    Returns: history list of per-epoch loss dicts.
    """
    n_items = len(all_item_ids)
    dataset = WarmInteractionDataset(
        df_train, user2idx, item2idx, n_items, cfg["neg_samples"])
    loader  = DataLoader(dataset, batch_size=cfg["batch_size"],
                         shuffle=True, num_workers=0)

    optimiser = torch.optim.AdamW(
        model.parameters(), lr=cfg["lr"], weight_decay=cfg["weight_decay"])
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
        optimiser, T_max=cfg["n_epochs"], eta_min=1e-5)

    item_content_dev = item_content_tensor.to(device)
    history = []
    t0      = time.time()

    for epoch in range(1, cfg["n_epochs"] + 1):
        model.train()
        epoch_bpr = epoch_aug = 0.0
        n_batches = 0

        for uid, pos_iid, neg_iid, weight in loader:
            uid     = uid.to(device)
            pos_iid = pos_iid.to(device)
            neg_iid = neg_iid.to(device)
            weight  = weight.to(device)

            c_pos = item_content_dev[pos_iid]
            c_neg = item_content_dev[neg_iid]

            pos_s, neg_s = model(uid, pos_iid, neg_iid, c_pos, c_neg)
            l_bpr = bpr_loss_weighted(pos_s, neg_s, weight)

            # LLM pairwise augmentation
            l_aug = torch.tensor(0.0, device=device)
            llm_batch = sample_llm_batch(llm_pairs, batch_size=64, device=device)
            if llm_batch is not None:
                pref_idx, other_idx, conf = llm_batch
                c_pref  = item_content_dev[pref_idx]
                c_other = item_content_dev[other_idx]
                pref_vecs  = model.get_item_vec(pref_idx,  c_pref)
                other_vecs = model.get_item_vec(other_idx, c_other)
                u_mean     = model.user_emb.weight.mean(0, keepdim=True)
                pref_s     = (u_mean * pref_vecs).sum(-1)
                other_s    = (u_mean * other_vecs).sum(-1)
                l_aug      = aug_bpr_loss(pref_s, other_s, conf)

            loss = l_bpr + cfg["lambda_aug"] * l_aug
            optimiser.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimiser.step()

            epoch_bpr += l_bpr.item()
            epoch_aug += l_aug.item() if isinstance(l_aug, torch.Tensor) else 0.0
            n_batches += 1

        scheduler.step()
        avg_bpr = epoch_bpr / max(n_batches, 1)
        avg_aug = epoch_aug / max(n_batches, 1)
        avg_tot = avg_bpr + cfg["lambda_aug"] * avg_aug
        history.append({"epoch": epoch, "loss": avg_tot,
                        "loss_bpr": avg_bpr, "loss_aug": avg_aug})

        if epoch % 10 == 0 or epoch == 1:
            print(f"  Epoch {epoch:>3}/{cfg['n_epochs']}  "
                  f"loss={avg_tot:.4f}  bpr={avg_bpr:.4f}  "
                  f"aug={avg_aug:.4f}  [{int(time.time()-t0)}s]")

    return history
