"""
Backward-compatible entry point for chest MedMNIST training.

Delegates to `train_medmnist_efficientnet.py --modality chest`.

Run:
  cd backend && python scripts/train_medmnist_chest_efficientnet.py [--epochs 3] [--batch-size 64]
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

if __name__ == "__main__":
    root = Path(__file__).resolve().parent
    script = root / "train_medmnist_efficientnet.py"
    cmd = [sys.executable, str(script), "--modality", "chest", *sys.argv[1:]]
    raise SystemExit(subprocess.call(cmd))
