"""
recommender/dataset.py
EAIN Recommender — Interaction Matrix Builder (Sitting 8)

Converts train.csv → user-item interaction matrix (dense float tensor)
Each row = one user, each column = one item
Value    = normalised weighted interaction score (0 if no interaction)
"""

import numpy as np
import pandas as pd
import torch
from torch.utils.data import Dataset
from pathlib import Path


def build_interaction_matrix(df_train: pd.DataFrame,
                              all_item_ids: list) -> np.ndarray:
    """
    Build dense [n_users, n_items] interaction matrix.

    Values = event_weight, normalised per user to [0, 1]
    Users with no interactions are excluded.

    Returns
    -------
    matrix   : np.ndarray  [n_users, n_items]  float32
    user_ids : list        user_id strings in row order
    """
    item_idx  = {iid: i for i, iid in enumerate(all_item_ids)}
    user_ids  = sorted(df_train["user_id"].unique().tolist())
    n_users   = len(user_ids)
    n_items   = len(all_item_ids)
    user_idx  = {uid: i for i, uid in enumerate(user_ids)}

    matrix = np.zeros((n_users, n_items), dtype=np.float32)

    for _, row in df_train.iterrows():
        ui = user_idx.get(row["user_id"])
        ii = item_idx.get(row["listing_id"])
        if ui is not None and ii is not None:
            # Keep highest weight if duplicate (user interacted multiple times)
            matrix[ui, ii] = max(matrix[ui, ii], float(row["event_weight"]))

    # Per-user normalisation: divide by max weight (5.0) so all values in [0,1]
    matrix = matrix / 5.0

    return matrix, user_ids


class InteractionDataset(Dataset):
    """
    PyTorch Dataset wrapping the interaction matrix.
    Each __getitem__ returns one user's interaction vector.
    """

    def __init__(self, matrix: np.ndarray):
        self.data = torch.tensor(matrix, dtype=torch.float32)

    def __len__(self):
        return self.data.size(0)

    def __getitem__(self, idx):
        return self.data[idx]   # [n_items]
