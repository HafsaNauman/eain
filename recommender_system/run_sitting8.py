"""
run_sitting8.py
EAIN Recommender — Sitting 8: CFGAN Training
Run from:  recommender_system/
Usage:     python run_sitting8.py
Outputs:
  checkpoints/cfgan_G.pth
  checkpoints/cfgan_D.pth
  plots/cfgan_losses.png
  data/eain_augmented_vectors.npy
"""

import sys, json, ast, time
import numpy as np
import pandas as pd
import torch
import torch.nn.functional as F
from torch.utils.data import DataLoader
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from recommender.cfgan    import build_cfgan, build_indicator_vector, mask_interaction, wgan_gradient_penalty
from recommender.dataset  import build_interaction_matrix, InteractionDataset

# ── Paths ───────────────────────────────────────────────────────
DATA        = Path("data")
RESULTS     = Path("results")
PLOTS       = Path("plots")
CKPT        = Path("checkpoints") / "cfgan"
for p in [RESULTS, PLOTS, CKPT]:
    p.mkdir(parents=True, exist_ok=True)

# ── Load config ─────────────────────────────────────────────────
with open("configs/cfgan_config.json") as f:
    cfg = json.load(f)

N_EPOCHS   = cfg["n_epochs"]
BATCH_SIZE = cfg["batch_size"]
SAVE_EVERY = cfg["save_every"]
USE_WGANGP = cfg["use_wgan_gp"]
LAMBDA_GP  = cfg["lambda_gp"]

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Device: {device}")
print(f"Mode:   {'WGAN-GP' if USE_WGANGP else 'BCE'}")

# ── Load data ────────────────────────────────────────────────────
print("\nLoading interactions...")
df_train  = pd.read_csv(DATA / "train.csv")
df_items  = pd.read_csv(DATA / "eain_items.csv")
df_items["tags"] = df_items["tags"].apply(ast.literal_eval)

all_item_ids = sorted(df_items["listing_id"].tolist())
N_ITEMS      = len(all_item_ids)
item_idx     = {iid: i for i, iid in enumerate(all_item_ids)}

# Build interaction matrix
matrix, train_user_ids = build_interaction_matrix(df_train, all_item_ids)
dataset    = InteractionDataset(matrix)
dataloader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=True, drop_last=False)

print(f"  Users in matrix:  {matrix.shape[0]}")
print(f"  Items:            {matrix.shape[1]}")
print(f"  Matrix density:   {(matrix > 0).mean():.4f}")
print(f"  Batches/epoch:    {len(dataloader)}")

# ── Build model ─────────────────────────────────────────────────
G, D, trainer = build_cfgan(cfg, N_ITEMS, device)
print(f"\nGenerator params:     {sum(p.numel() for p in G.parameters()):,}")
print(f"Discriminator params: {sum(p.numel() for p in D.parameters()):,}")

# ── Training ────────────────────────────────────────────────────
print(f"\nTraining for {N_EPOCHS} epochs...")
print("-" * 55)

loss_D_history, loss_G_history = [], []
start = time.time()

for epoch in range(1, N_EPOCHS + 1):
    epoch_loss_D, epoch_loss_G, n_batches = 0.0, 0.0, 0

    for r_u in dataloader:
        r_u = r_u.to(device)
        B   = r_u.size(0)

        e_u = build_indicator_vector(r_u)
        c_u = mask_interaction(r_u, e_u)

        if not USE_WGANGP:
            # ── Standard BCE training ──────────────────────────
            losses = trainer.train_step(r_u)
            epoch_loss_D += losses["loss_D"]
            epoch_loss_G += losses["loss_G"]

        else:
            # ── WGAN-GP training ──────────────────────────────
            # -- Discriminator (critic) step --
            trainer.opt_D.zero_grad()
            z      = G.sample_noise(B, device)
            r_fake = G(z, c_u).detach()
            gp     = wgan_gradient_penalty(D, c_u, r_fake, c_u, device, LAMBDA_GP)
            loss_d = D(r_fake, c_u).mean() - D(c_u, c_u).mean() + gp
            loss_d.backward()
            trainer.opt_D.step()

            # -- Generator step --
            trainer.opt_G.zero_grad()
            z      = G.sample_noise(B, device)
            r_fake = G(z, c_u)
            loss_g_adv = -D(r_fake, c_u).mean()
            loss_g_rec = F.mse_loss(r_fake * e_u, r_u * e_u)
            loss_g = loss_g_adv + loss_g_rec
            loss_g.backward()
            trainer.opt_G.step()

            epoch_loss_D += loss_d.item()
            epoch_loss_G += loss_g.item()

        n_batches += 1

    avg_D = epoch_loss_D / n_batches
    avg_G = epoch_loss_G / n_batches
    loss_D_history.append(avg_D)
    loss_G_history.append(avg_G)

    # ── Instability check ──────────────────────────────────────
    if epoch >= 50 and not USE_WGANGP:
        if avg_D < 0.05 or avg_G > 5.0:
            print(f"\n⚠️  INSTABILITY DETECTED at epoch {epoch}")
            print(f"   loss_D={avg_D:.4f}  loss_G={avg_G:.4f}")
            print("   → Set \"use_wgan_gp\": true in configs/cfgan_config.json")
            print("   → Re-run this script\n")

    # ── Print every 10 epochs ──────────────────────────────────
    if epoch % 10 == 0 or epoch == 1:
        elapsed = time.time() - start
        print(f"  Epoch {epoch:>3}/{N_EPOCHS}  "
              f"loss_D={avg_D:.4f}  loss_G={avg_G:.4f}  "
              f"[{elapsed:.0f}s]")

    # ── Save checkpoint every SAVE_EVERY epochs ───────────────
    if epoch % SAVE_EVERY == 0:
        torch.save(G.state_dict(), CKPT / f"cfgan_G_ep{epoch}.pth")
        torch.save(D.state_dict(), CKPT / f"cfgan_D_ep{epoch}.pth")

# ── Save final checkpoints ──────────────────────────────────────
torch.save(G.state_dict(), CKPT / "cfgan_G.pth")
torch.save(D.state_dict(), CKPT / "cfgan_D.pth")
print(f"\n✅ Checkpoints saved to {CKPT}/")

# ── Plot loss curves ────────────────────────────────────────────
print("Generating loss plot...")
sns.set_style("whitegrid")
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))

epochs_x = list(range(1, N_EPOCHS + 1))

ax1.plot(epochs_x, loss_D_history, color="#6366f1", linewidth=1.5, label="Discriminator")
ax1.set_title("Discriminator Loss", fontsize=12)
ax1.set_xlabel("Epoch"); ax1.set_ylabel("Loss")
ax1.axhline(y=0.693, color="gray", linestyle="--", alpha=0.5, label="log(2) baseline")
ax1.legend()

ax2.plot(epochs_x, loss_G_history, color="#22c55e", linewidth=1.5, label="Generator")
ax2.set_title("Generator Loss", fontsize=12)
ax2.set_xlabel("Epoch"); ax2.set_ylabel("Loss")
ax2.legend()

fig.suptitle(f"CFGAN Training Loss Curves — {N_EPOCHS} Epochs ({'WGAN-GP' if USE_WGANGP else 'BCE'})",
             fontsize=13, fontweight="bold")
plt.tight_layout()
plt.savefig(PLOTS / "cfgan_losses.png", dpi=150)
plt.close()
print(f"✅ Loss plot saved to plots/cfgan_losses.png")

# ── Generate augmented vectors ──────────────────────────────────
print("\nGenerating augmented interaction vectors...")
G.eval()
all_vectors = torch.tensor(matrix, dtype=torch.float32).to(device)
e_u_all     = build_indicator_vector(all_vectors)
c_u_all     = mask_interaction(all_vectors, e_u_all)

aug_vectors = []
with torch.no_grad():
    # Generate 3 augmented vectors per user
    for _ in range(3):
        z     = G.sample_noise(all_vectors.size(0), device)
        r_hat = G(z, c_u_all)
        aug_vectors.append(r_hat.cpu().numpy())

augmented = np.vstack(aug_vectors)   # [n_users * 3, n_items]
np.save(DATA / "eain_augmented_vectors.npy", augmented)
print(f"✅ Saved {augmented.shape[0]} augmented vectors → data/eain_augmented_vectors.npy")
print(f"   Shape: {augmented.shape}  (users*3 × items)")

# ── Coherence check ─────────────────────────────────────────────
print("\nCoherence check — top recommended items per archetype sample:")
df_test_sample = pd.read_csv(DATA / "test.csv")
sample_users   = df_test_sample["user_id"].unique()[:5]
user_row_idx   = {uid: i for i, uid in enumerate(train_user_ids)}

G.eval()
print(f"{'User':<10} {'Top-3 items (generated)':<35} {'Top-3 items (real train)'}")
print("-" * 80)
with torch.no_grad():
    for uid in sample_users:
        if uid not in user_row_idx:
            print(f"  {uid:<10} (cold user — no train history)")
            continue
        idx   = user_row_idx[uid]
        c_u_s = c_u_all[idx:idx+1]
        z_s   = G.sample_noise(1, device)
        r_hat = G(z_s, c_u_s).squeeze().cpu().numpy()

        top3_gen  = [all_item_ids[i] for i in np.argsort(-r_hat)[:3]]
        top3_real = df_train[df_train["user_id"]==uid]\
                    .sort_values("event_weight", ascending=False)["listing_id"].tolist()[:3]
        print(f"  {uid:<10} generated={top3_gen}  real={top3_real}")

# ── Final summary ───────────────────────────────────────────────
print("\n" + "=" * 60)
print("SITTING 8 SUCCESS CHECK")
print("=" * 60)
checks = {
    "cfgan_G.pth saved":              (CKPT/"cfgan_G.pth").exists(),
    "cfgan_D.pth saved":              (CKPT/"cfgan_D.pth").exists(),
    "cfgan_losses.png saved":         (PLOTS/"cfgan_losses.png").exists(),
    "eain_augmented_vectors.npy saved":(DATA/"eain_augmented_vectors.npy").exists(),
    "Augmented vectors non-trivial":  bool(augmented.mean() > 0.01),
    "Final loss_D in range [0.1,0.9]":bool(0.01 < loss_D_history[-1] < 1.5),
    "Final loss_G in range [0.1,5.0]":bool(0.01 < loss_G_history[-1] < 5.0),
}
all_pass = True
for name, passed in checks.items():
    print(f"  {'✅' if passed else '❌'}  {name}")
    if not passed: all_pass = False

print(f"\n  Final epoch:  loss_D={loss_D_history[-1]:.4f}  loss_G={loss_G_history[-1]:.4f}")
print(f"  Augmented vectors mean: {augmented.mean():.4f}  std: {augmented.std():.4f}")
print(f"  Training time: {time.time()-start:.0f}s")

if all_pass:
    print("\n✅ ALL CHECKS PASSED — Sitting 8 complete")
    print("   Next: Sitting 9 — Pairwise Prompt Design")
else:
    print("\n❌ SOME CHECKS FAILED — see above")
print("=" * 60)
