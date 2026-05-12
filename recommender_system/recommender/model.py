"""
recommender/model.py
EAIN Recommender — ColdStartRecommender
Sitting 11: Combined collaborative + content model with cold-start support.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F


class ColdStartRecommender(nn.Module):
    """
    Collaborative recommender with cold-start support via content projection.

    Architecture:
        UserEmbedding  [n_users, embed_dim]
        ItemEmbedding  [n_items, embed_dim]   -- warm collaborative signal
        ContentHead    content_dim → embed_dim -- cold-start signal
        FinalItemVec   = α * item_emb + (1-α) * content_proj(content)
        Score          = dot(user_vec, item_vec) + user_bias + item_bias
    """

    def __init__(self, n_users: int, n_items: int, content_dim: int,
                 embed_dim: int = 64, dropout: float = 0.2):
        super().__init__()
        self.embed_dim = embed_dim

        self.user_emb  = nn.Embedding(n_users, embed_dim, padding_idx=0)
        self.item_emb  = nn.Embedding(n_items, embed_dim, padding_idx=0)
        self.user_bias = nn.Embedding(n_users, 1, padding_idx=0)
        self.item_bias = nn.Embedding(n_items, 1, padding_idx=0)

        self.content_proj = nn.Sequential(
            nn.Linear(content_dim, 256),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(256, embed_dim),
        )

        # Learnable blend: α=1 → pure collaborative, α=0 → pure content
        self.alpha = nn.Parameter(torch.tensor(0.7))
        self._init_weights()

    def _init_weights(self):
        nn.init.xavier_uniform_(self.user_emb.weight)
        nn.init.xavier_uniform_(self.item_emb.weight)
        for layer in self.content_proj:
            if isinstance(layer, nn.Linear):
                nn.init.xavier_uniform_(layer.weight)

    def get_item_vec(self, item_idx: torch.Tensor,
                     content_feats: torch.Tensor) -> torch.Tensor:
        """Blend collaborative + content for item representation."""
        alpha   = torch.sigmoid(self.alpha)
        collab  = self.item_emb(item_idx)
        content = self.content_proj(content_feats)
        return alpha * collab + (1 - alpha) * content

    def forward(self, user_idx, pos_item_idx, neg_item_idx,
                content_pos, content_neg):
        """BPR forward: returns (pos_scores, neg_scores)."""
        u      = self.user_emb(user_idx)
        u_bias = self.user_bias(user_idx).squeeze(-1)

        i_pos  = self.get_item_vec(pos_item_idx, content_pos)
        i_neg  = self.get_item_vec(neg_item_idx, content_neg)
        b_pos  = self.item_bias(pos_item_idx).squeeze(-1)
        b_neg  = self.item_bias(neg_item_idx).squeeze(-1)

        s_pos  = (u * i_pos).sum(-1) + u_bias + b_pos
        s_neg  = (u * i_neg).sum(-1) + u_bias + b_neg
        return s_pos, s_neg

    def score_all_items(self, user_idx: int,
                        item_content_tensor: torch.Tensor) -> torch.Tensor:
        """Score all n_items for a single user. Returns [n_items]."""
        u     = self.user_emb.weight[user_idx].unsqueeze(0)   # [1, D]
        u_b   = self.user_bias.weight[user_idx]               # [1, 1]
        alpha = torch.sigmoid(self.alpha)

        all_collab  = self.item_emb.weight                              # [n_items, D]
        all_content = self.content_proj(item_content_tensor)            # [n_items, D]
        all_items   = alpha * all_collab + (1 - alpha) * all_content   # [n_items, D]

        scores = (u * all_items).sum(-1)                               # [n_items]
        scores = scores + u_b.squeeze() + self.item_bias.weight.squeeze(-1)
        return scores
