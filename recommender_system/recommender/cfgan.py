"""
recommender/cfgan.py
EAIN Recommender — CFGAN Architecture (Sitting 7)

Based on: CFGAN — A Performance-Oriented GAN-Based Collaborative Filtering System
          Chae et al., CIKM 2019

Architecture:
  Generator     : z + c_u  →  r̂_u  (fake interaction vector)
  Discriminator : r_u + c_u →  P(real)
  Masking       : indicator vector e_u focuses loss on interacted items
  Loss          : BCE (default) | WGAN-GP (fallback)
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Optional


# ─────────────────────────────────────────────────────────────────
#  Utility: build MLP block
# ─────────────────────────────────────────────────────────────────
def _mlp_block(in_dim: int, out_dim: int,
               dropout: float = 0.2,
               activation: str = "relu") -> nn.Sequential:
    act = {"relu": nn.ReLU(), "tanh": nn.Tanh(),
           "leaky": nn.LeakyReLU(0.2), "sigmoid": nn.Sigmoid()}
    return nn.Sequential(
        nn.Linear(in_dim, out_dim),
        nn.BatchNorm1d(out_dim),
        act[activation],
        nn.Dropout(dropout),
    )


# ─────────────────────────────────────────────────────────────────
#  Generator  G(z, c_u)  →  r̂_u
# ─────────────────────────────────────────────────────────────────
class CFGANGenerator(nn.Module):
    """
    Generates a fake user interaction vector r̂_u of shape [n_items].

    Input:
        z   : noise vector  [batch, noise_dim]
        c_u : condition     [batch, n_items]   (user's real interaction vector,
                                                normalised & masked)
    Output:
        r̂_u : fake interactions [batch, n_items]  ∈ (0, 1)  via Sigmoid
    """

    def __init__(self,
                 n_items:    int,
                 noise_dim:  int   = 64,
                 hidden_dims: list = [256, 128],
                 dropout:    float = 0.2):
        super().__init__()
        self.noise_dim  = noise_dim
        self.n_items    = n_items

        # Input = noise + condition vector
        in_dim = noise_dim + n_items
        layers = []
        for h in hidden_dims:
            layers.append(_mlp_block(in_dim, h, dropout=dropout, activation="relu"))
            in_dim = h

        # Output layer — Sigmoid squashes to (0,1) so it mimics interaction probabilities
        layers.append(nn.Linear(in_dim, n_items))
        layers.append(nn.Sigmoid())

        self.net = nn.Sequential(*layers)

    def forward(self, z: torch.Tensor, c_u: torch.Tensor) -> torch.Tensor:
        """
        z   : [B, noise_dim]
        c_u : [B, n_items]
        returns r̂_u : [B, n_items]
        """
        x = torch.cat([z, c_u], dim=1)   # [B, noise_dim + n_items]
        return self.net(x)               # [B, n_items]

    def sample_noise(self, batch_size: int,
                     device: torch.device) -> torch.Tensor:
        """Sample standard Gaussian noise."""
        return torch.randn(batch_size, self.noise_dim, device=device)


# ─────────────────────────────────────────────────────────────────
#  Discriminator  D(r_u, c_u)  →  P(real)
# ─────────────────────────────────────────────────────────────────
class CFGANDiscriminator(nn.Module):
    """
    Classifies whether an interaction vector is real or generated.

    Input:
        r_u : interaction vector  [batch, n_items]  (real OR fake)
        c_u : condition           [batch, n_items]
    Output:
        logits : [batch, 1]   (sigmoid applied outside for BCE or raw for WGAN-GP)
    """

    def __init__(self,
                 n_items:     int,
                 hidden_dims: list  = [256, 128],
                 dropout:     float = 0.3):
        super().__init__()

        in_dim = n_items * 2     # r_u concatenated with c_u
        layers = []
        for h in hidden_dims:
            layers.append(_mlp_block(in_dim, h, dropout=dropout, activation="leaky"))
            in_dim = h

        # No BN on final layer (standard GAN practice)
        layers.append(nn.Linear(in_dim, 1))
        self.net = nn.Sequential(*layers)

    def forward(self, r_u: torch.Tensor,
                c_u: torch.Tensor) -> torch.Tensor:
        """
        r_u : [B, n_items]
        c_u : [B, n_items]
        returns logits : [B, 1]
        """
        x = torch.cat([r_u, c_u], dim=1)   # [B, n_items * 2]
        return self.net(x)                  # [B, 1]


# ─────────────────────────────────────────────────────────────────
#  Indicator Masking  e_u
# ─────────────────────────────────────────────────────────────────
def build_indicator_vector(interaction_vector: torch.Tensor,
                           threshold: float = 0.0) -> torch.Tensor:
    """
    Build binary indicator vector e_u from a user interaction vector.

    e_u[i] = 1 if user interacted with item i (rating > threshold)
    e_u[i] = 0 otherwise

    This mask is used so the Generator ONLY needs to fool the
    Discriminator on items the user actually touched — not all 80 items.

    Args:
        interaction_vector : [B, n_items]  (raw weighted interactions)
        threshold          : float, default 0 (any interaction counts)
    Returns:
        e_u : [B, n_items]  binary float tensor
    """
    return (interaction_vector > threshold).float()


def mask_interaction(r_u: torch.Tensor,
                     e_u: torch.Tensor) -> torch.Tensor:
    """
    Apply indicator mask: zero out non-interacted items.
    r_u_masked = r_u * e_u

    Used to condition the Generator and Discriminator on only
    the items the user actually engaged with.
    """
    return r_u * e_u


# ─────────────────────────────────────────────────────────────────
#  BCE Training Loop
# ─────────────────────────────────────────────────────────────────
class CFGANTrainer:
    """
    ⚠️  TRAINING INSTABILITY?
    If after epoch 50 either:
      - loss_D < 0.1  (Discriminator too strong, Generator can't learn)
      - loss_G > 5.0  (Generator loss exploding)
      - Generated values all collapse near 0 or 1
    → Open configs/cfgan_config.json
    → Set "use_wgan_gp": true
    → Re-run training from scratch (or from last checkpoint)
    → No other code changes needed.

    Handles the adversarial training loop for CFGAN.

    Steps per batch:
      1. Train Discriminator — distinguish real vs fake interactions
      2. Train Generator     — fool the Discriminator
      3. Apply masking       — focus loss on interacted items only
    """

    def __init__(self,
                 generator:     CFGANGenerator,
                 discriminator: CFGANDiscriminator,
                 device:        torch.device,
                 lr_g:          float = 1e-3,
                 lr_d:          float = 1e-3,
                 beta1:         float = 0.5,
                 beta2:         float = 0.999,
                 lambda_reg:    float = 1e-4):
        self.G   = generator.to(device)
        self.D   = discriminator.to(device)
        self.dev = device

        self.opt_G = torch.optim.Adam(
            self.G.parameters(), lr=lr_g, betas=(beta1, beta2))
        self.opt_D = torch.optim.Adam(
            self.D.parameters(), lr=lr_d, betas=(beta1, beta2))

        self.bce        = nn.BCEWithLogitsLoss()
        self.lambda_reg = lambda_reg  # L2 regularisation on G output

    # ── single training step ──────────────────────────────────────
    def train_step(self,
                   r_u:   torch.Tensor,
                   alpha: float = 0.5) -> dict:
        """
        One training step on a batch of user interaction vectors.

        Args:
            r_u   : [B, n_items]  real interaction vectors (normalised)
            alpha : masking ratio — fraction of items to mask in condition

        Returns:
            dict with loss_D (float) and loss_G (float)
        """
        B = r_u.size(0)
        r_u = r_u.to(self.dev)

        # ── build indicator mask & condition ─────────────────────
        e_u   = build_indicator_vector(r_u)          # [B, n_items]
        c_u   = mask_interaction(r_u, e_u)            # condition for G and D

        # real / fake labels with label smoothing
        real_labels = torch.ones(B, 1, device=self.dev) * 0.9
        fake_labels = torch.zeros(B, 1, device=self.dev)

        # ══ Step 1: Train Discriminator ═══════════════════════════
        self.opt_D.zero_grad()

        # Real loss
        d_real   = self.D(c_u, c_u)                  # D sees real interactions
        loss_d_r = self.bce(d_real, real_labels)

        # Fake loss
        z        = self.G.sample_noise(B, self.dev)
        r_fake   = self.G(z, c_u).detach()            # detach so G is not updated
        d_fake   = self.D(r_fake, c_u)
        loss_d_f = self.bce(d_fake, fake_labels)

        loss_D = (loss_d_r + loss_d_f) * 0.5
        loss_D.backward()
        self.opt_D.step()

        # ══ Step 2: Train Generator ════════════════════════════════
        self.opt_G.zero_grad()

        z      = self.G.sample_noise(B, self.dev)
        r_fake = self.G(z, c_u)                       # generate fresh fakes
        d_fake = self.D(r_fake, c_u)

        # G wants D to output 1 (real) for its fakes
        loss_g_adv = self.bce(d_fake, real_labels)

        # Masked reconstruction: G should match real interactions on interacted items
        loss_g_rec = F.mse_loss(r_fake * e_u, r_u * e_u)

        # L2 regularisation on generated values
        loss_g_reg = self.lambda_reg * torch.mean(r_fake ** 2)

        loss_G = loss_g_adv + loss_g_rec + loss_g_reg
        loss_G.backward()
        self.opt_G.step()

        return {"loss_D": loss_D.item(), "loss_G": loss_G.item()}

    # ── generate augmented interactions ──────────────────────────
    def generate(self,
                 c_u: torch.Tensor,
                 n_samples: int = 1) -> torch.Tensor:
        """
        Generate n_samples fake interaction vectors per user.

        Args:
            c_u      : [B, n_items]  condition (masked real interactions)
            n_samples: how many fake vectors to generate per user

        Returns:
            r_fake : [B * n_samples, n_items]
        """
        self.G.eval()
        results = []
        with torch.no_grad():
            for _ in range(n_samples):
                z      = self.G.sample_noise(c_u.size(0), self.dev)
                r_fake = self.G(z, c_u.to(self.dev))
                results.append(r_fake)
        self.G.train()
        return torch.cat(results, dim=0)


# ─────────────────────────────────────────────────────────────────
#  WGAN-GP Fallback Skeleton
# ─────────────────────────────────────────────────────────────────
def wgan_gradient_penalty(discriminator: CFGANDiscriminator,
                           real: torch.Tensor,
                           fake: torch.Tensor,
                           c_u:  torch.Tensor,
                           device: torch.device,
                           lambda_gp: float = 10.0) -> torch.Tensor:
    """
    Gradient penalty for WGAN-GP (Gulrajani et al., 2017).

    Use this instead of BCE when training is unstable (mode collapse,
    loss not converging after 50+ epochs).

    Replace CFGANTrainer.train_step loss with:
        gp      = wgan_gradient_penalty(D, r_real, r_fake, c_u, device)
        loss_D  = D(r_fake, c_u).mean() - D(r_real, c_u).mean() + gp
        loss_G  = -D(r_fake, c_u).mean()

    NOTE: Remove Sigmoid from Discriminator output when using WGAN-GP.
    """
    B    = real.size(0)
    eps  = torch.rand(B, 1, device=device).expand_as(real)
    interp     = (eps * real + (1 - eps) * fake).requires_grad_(True)
    d_interp   = discriminator(interp, c_u)

    grads = torch.autograd.grad(
        outputs=d_interp, inputs=interp,
        grad_outputs=torch.ones_like(d_interp),
        create_graph=True, retain_graph=True)[0]

    gp = lambda_gp * ((grads.norm(2, dim=1) - 1) ** 2).mean()
    return gp


# ─────────────────────────────────────────────────────────────────
#  Factory function — build from config dict
# ─────────────────────────────────────────────────────────────────
def build_cfgan(config: dict, n_items: int, device: torch.device):
    """
    Instantiate G, D, and Trainer from config dict.
    config = load from configs/cfgan_config.json
    """
    G = CFGANGenerator(
        n_items     = n_items,
        noise_dim   = config["noise_dim"],
        hidden_dims = config["g_hidden_dims"],
        dropout     = config["dropout"],
    )
    D = CFGANDiscriminator(
        n_items     = n_items,
        hidden_dims = config["d_hidden_dims"],
        dropout     = config["dropout"],
    )
    trainer = CFGANTrainer(
        generator     = G,
        discriminator = D,
        device        = device,
        lr_g          = config["lr_g"],
        lr_d          = config["lr_d"],
        beta1         = config["beta1"],
        beta2         = config["beta2"],
        lambda_reg    = config["lambda_reg"],
    )
    return G, D, trainer
