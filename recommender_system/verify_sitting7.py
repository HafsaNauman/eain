"""
verify_sitting7.py
EAIN Recommender — Sitting 7 Success Check
Run from: recommender_system/
Usage:    python verify_sitting7.py
Success:  All checks print ✅ and dummy forward pass completes.
"""
import sys, json
import torch
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from recommender.cfgan import (
    CFGANGenerator, CFGANDiscriminator, CFGANTrainer,
    build_cfgan, build_indicator_vector, mask_interaction,
    wgan_gradient_penalty
)

print("=" * 60)
print("SITTING 7 — CFGAN ARCHITECTURE VERIFICATION")
print("=" * 60)

# Load config
with open("configs/cfgan_config.json") as f:
    cfg = json.load(f)

N_ITEMS  = cfg["n_items"]      # 80
B        = 8                   # small batch for test
device   = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"\nDevice: {device}")
print(f"n_items: {N_ITEMS}  |  batch_size: {B}\n")

checks = {}

# ── CHECK 1: Generator instantiates ──────────────────────────────
try:
    G = CFGANGenerator(n_items=N_ITEMS, noise_dim=cfg["noise_dim"],
                       hidden_dims=cfg["g_hidden_dims"], dropout=cfg["dropout"])
    checks["CFGANGenerator instantiates"] = True
    params_G = sum(p.numel() for p in G.parameters())
    print(f"✅ CFGANGenerator — {params_G:,} parameters")
except Exception as e:
    checks["CFGANGenerator instantiates"] = False
    print(f"❌ CFGANGenerator failed: {e}")

# ── CHECK 2: Discriminator instantiates ──────────────────────────
try:
    D = CFGANDiscriminator(n_items=N_ITEMS,
                           hidden_dims=cfg["d_hidden_dims"], dropout=cfg["dropout"])
    checks["CFGANDiscriminator instantiates"] = True
    params_D = sum(p.numel() for p in D.parameters())
    print(f"✅ CFGANDiscriminator — {params_D:,} parameters")
except Exception as e:
    checks["CFGANDiscriminator instantiates"] = False
    print(f"❌ CFGANDiscriminator failed: {e}")

# ── CHECK 3: Generator forward pass ──────────────────────────────
try:
    G.to(device)
    z   = G.sample_noise(B, device)                 # [B, 64]
    c_u = torch.rand(B, N_ITEMS, device=device)     # [B, 80]
    r_fake = G(z, c_u)
    assert r_fake.shape == (B, N_ITEMS), f"Wrong shape: {r_fake.shape}"
    assert r_fake.min() >= 0 and r_fake.max() <= 1, "Output not in [0,1]"
    checks["Generator forward pass"] = True
    print(f"✅ Generator forward pass — output shape {tuple(r_fake.shape)}, "
          f"range [{r_fake.min():.3f}, {r_fake.max():.3f}]")
except Exception as e:
    checks["Generator forward pass"] = False
    print(f"❌ Generator forward pass failed: {e}")

# ── CHECK 4: Discriminator forward pass ──────────────────────────
try:
    D.to(device)
    r_real = torch.rand(B, N_ITEMS, device=device)
    logits = D(r_real, c_u)
    assert logits.shape == (B, 1), f"Wrong shape: {logits.shape}"
    checks["Discriminator forward pass"] = True
    print(f"✅ Discriminator forward pass — output shape {tuple(logits.shape)}")
except Exception as e:
    checks["Discriminator forward pass"] = False
    print(f"❌ Discriminator forward pass failed: {e}")

# ── CHECK 5: Indicator vector (masking) ──────────────────────────
try:
    r_u = torch.tensor([
        [0.0, 0.5, 0.0, 2.0, 0.0],
        [1.0, 0.0, 3.0, 0.0, 0.0],
    ])
    e_u   = build_indicator_vector(r_u)
    c_u_s = mask_interaction(r_u, e_u)
    assert e_u.shape == r_u.shape
    assert e_u[0, 0].item() == 0.0   # no interaction
    assert e_u[0, 1].item() == 1.0   # interacted
    assert c_u_s[0, 0].item() == 0.0 # masked out
    assert c_u_s[0, 1].item() == 0.5 # kept
    checks["Indicator masking (e_u)"] = True
    print(f"✅ Indicator masking e_u — shape {tuple(e_u.shape)}, values correct")
    print(f"   e_u[0] = {e_u[0].tolist()}  (1 where interaction exists)")
except Exception as e:
    checks["Indicator masking (e_u)"] = False
    print(f"❌ Indicator masking failed: {e}")

# ── CHECK 6: BCE training step ───────────────────────────────────
try:
    G2, D2, trainer = build_cfgan(cfg, N_ITEMS, device)
    r_batch = torch.rand(B, N_ITEMS)
    losses  = trainer.train_step(r_batch)
    assert "loss_D" in losses and "loss_G" in losses
    assert losses["loss_D"] > 0 and losses["loss_G"] > 0
    checks["BCE training step"] = True
    print(f"✅ Training step — loss_D={losses['loss_D']:.4f}  "
          f"loss_G={losses['loss_G']:.4f}")
except Exception as e:
    checks["BCE training step"] = False
    print(f"❌ Training step failed: {e}")

# ── CHECK 7: WGAN-GP skeleton ────────────────────────────────────
try:
    r_real = torch.rand(B, N_ITEMS, device=device)
    r_fake = torch.rand(B, N_ITEMS, device=device)
    c_u2   = torch.rand(B, N_ITEMS, device=device)
    gp = wgan_gradient_penalty(D2, r_real, r_fake, c_u2, device)
    assert gp.item() >= 0
    checks["WGAN-GP skeleton"] = True
    print(f"✅ WGAN-GP gradient penalty — value={gp.item():.4f}")
except Exception as e:
    checks["WGAN-GP skeleton"] = False
    print(f"❌ WGAN-GP failed: {e}")

# ── CHECK 8: build_cfgan factory ────────────────────────────────
try:
    G3, D3, tr3 = build_cfgan(cfg, N_ITEMS, device)
    checks["build_cfgan factory"] = True
    print(f"✅ build_cfgan factory — G + D + Trainer created from config")
except Exception as e:
    checks["build_cfgan factory"] = False
    print(f"❌ build_cfgan factory failed: {e}")

# ── SUMMARY ──────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("SITTING 7 RESULTS")
print("=" * 60)
all_pass = all(checks.values())
for name, passed in checks.items():
    print(f"  {'✅' if passed else '❌'}  {name}")

print(f"\n  Generator params:     {params_G:,}")
print(f"  Discriminator params: {params_D:,}")
print(f"  Total params:         {params_G + params_D:,}")

if all_pass:
    print("\n✅ ALL CHECKS PASSED — Sitting 7 complete")
    print("   Next: Sitting 8 — CFGAN Training")
else:
    print("\n❌ SOME CHECKS FAILED — review above")
print("=" * 60)
