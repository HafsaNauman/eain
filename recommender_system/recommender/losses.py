"""
recommender/losses.py
EAIN Recommender — Sitting 10
AugmentedBPRLoss: standard BPR + weighted pairwise LLM signal
"""

import torch
import torch.nn as nn
import torch.nn.functional as F


class BPRLoss(nn.Module):
    """
    Standard Bayesian Personalised Ranking loss.
    Maximises the score gap between a positive and negative item.

    L_BPR = -log(σ(s_pos - s_neg))
    """

    def forward(self, pos_scores: torch.Tensor,
                neg_scores: torch.Tensor) -> torch.Tensor:
        """
        pos_scores : [B]  model score for positive item
        neg_scores : [B]  model score for negative item
        """
        return -F.logsigmoid(pos_scores - neg_scores).mean()


class AugmentedBPRLoss(nn.Module):
    """
    BPR loss augmented with LLM-generated pairwise preference signal.

    L_total = L_BPR(warm interactions)
            + λ_aug * L_LLM(pairwise labels)

    The LLM loss treats each (archetype, item_A, item_B, preferred) tuple
    as a soft BPR signal — if the LLM says A is preferred, we push
    score(A) > score(B) weighted by the LLM confidence.

    Args:
        lambda_aug : weight for LLM signal (default 0.3)
        margin     : minimum score gap to enforce (default 0.0)
    """

    def __init__(self, lambda_aug: float = 0.3, margin: float = 0.0):
        super().__init__()
        self.lambda_aug = lambda_aug
        self.margin     = margin
        self.bpr        = BPRLoss()

    def forward(
        self,
        pos_scores:   torch.Tensor,          # [B] warm positive item scores
        neg_scores:   torch.Tensor,          # [B] warm negative item scores
        llm_pref_scores:  torch.Tensor,      # [N] LLM-preferred item scores
        llm_other_scores: torch.Tensor,      # [N] LLM-non-preferred item scores
        llm_confidences:  torch.Tensor,      # [N] confidence weights 0–1
    ) -> dict:
        """
        Returns dict with total loss and component losses for logging.
        """
        # Standard BPR on warm interactions
        loss_bpr = self.bpr(pos_scores, neg_scores)

        # LLM pairwise loss — confidence-weighted soft BPR
        if llm_pref_scores.numel() > 0:
            gap      = llm_pref_scores - llm_other_scores - self.margin
            loss_llm = -(llm_confidences * F.logsigmoid(gap)).mean()
        else:
            loss_llm = torch.tensor(0.0, device=pos_scores.device)

        loss_total = loss_bpr + self.lambda_aug * loss_llm

        return {
            "loss":     loss_total,
            "loss_bpr": loss_bpr.detach(),
            "loss_llm": loss_llm.detach(),
        }


class PairwiseDataset(torch.utils.data.Dataset):
    """
    Dataset wrapper for LLM pairwise pairs loaded from
    data/eain_augmented_pairs.json.

    Each item returns:
        pref_item_id   : str  (the LLM-preferred item)
        other_item_id  : str  (the less-preferred item)
        confidence     : float
        archetype_id   : str
    """

    def __init__(self, pairs: list):
        self.pairs = [
            {
                "pref_item":  p["item_a"] if p["preferred"] == "A" else p["item_b"],
                "other_item": p["item_b"] if p["preferred"] == "A" else p["item_a"],
                "confidence": float(p.get("confidence", 0.7)),
                "archetype":  p.get("archetype_id", ""),
            }
            for p in pairs
        ]

    def __len__(self):
        return len(self.pairs)

    def __getitem__(self, idx):
        return self.pairs[idx]


def load_augmented_pairs(path: str = "data/eain_augmented_pairs.json",
                         min_confidence: float = 0.60) -> "PairwiseDataset":
    """Load and filter pairwise pairs above confidence threshold."""
    import json
    with open(path) as f:
        pairs = json.load(f)
    filtered = [p for p in pairs if float(p.get("confidence", 0)) >= min_confidence]
    print(f"Loaded {len(pairs)} pairs → {len(filtered)} above conf≥{min_confidence}")
    return PairwiseDataset(filtered)
