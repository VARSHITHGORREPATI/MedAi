"""
Train EfficientNet-B0 on MedMNIST subsets (skin / chest / eye / brain UI slots).

- skin  -> DermaMNIST (7-class, single-label)
- chest -> ChestMNIST (14-class multi-label)
- eye   -> OCTMNIST (4-class)
- brain -> OrganSMNIST (11-class abdominal CT organs; not intracranial MRI — see models/medmnist_labels.py)

Run:
  cd backend && python scripts/train_medmnist_efficientnet.py --modality skin [--epochs 5] [--batch-size 64]

Requires: pip install medmnist torch torchvision timm
"""

from __future__ import annotations

import argparse
import importlib
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np
import timm
import torch
import torch.nn as nn
from PIL import Image
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms

from models.medmnist_labels import (
    CHEST_DISPLAY_CLASSES,
    CHEST_MNIST_LABEL_KEYS,
    DERMA_DISPLAY_CLASSES,
    MEDMNIST_DATASET_ID,
    MEDMNIST_TASK_NAME,
    OCT_DISPLAY_CLASSES,
    ORGAN_S_DISPLAY_CLASSES,
)


def _get_medmnist_class(name: str):
    mod = importlib.import_module("medmnist")
    return getattr(mod, name)


class MedMNISTEfficientNetDataset(Dataset):
    """Resize MedMNIST 28x28 RGB to `image_size` for EfficientNet."""

    def __init__(
        self,
        dataset_cls,
        split: str,
        *,
        image_size: int = 224,
        multilabel: bool,
    ) -> None:
        self.ds = dataset_cls(split=split, download=True, size=28, as_rgb=True)
        self.multilabel = multilabel
        self.tfm = transforms.Compose(
            [
                transforms.Resize((image_size, image_size)),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ]
        )

    def __len__(self) -> int:
        return len(self.ds)

    def __getitem__(self, idx: int):
        img, label = self.ds[idx]
        if not isinstance(img, Image.Image):
            img = Image.fromarray(np.asarray(img).astype(np.uint8))
        x = self.tfm(img.convert("RGB"))
        if self.multilabel:
            y = torch.as_tensor(np.asarray(label).astype(np.float32)).view(-1)
        else:
            arr = np.asarray(label).astype(np.int64).flatten()
            y = torch.tensor(int(arr[0]), dtype=torch.long)
        return x, y


def _spec(ui_modality: str):
    ui_modality = ui_modality.strip().lower()
    if ui_modality == "skin":
        return {
            "dataset_py": "DermaMNIST",
            "multilabel": False,
            "display": DERMA_DISPLAY_CLASSES,
            "label_keys": None,
        }
    if ui_modality == "chest":
        return {
            "dataset_py": "ChestMNIST",
            "multilabel": True,
            "display": CHEST_DISPLAY_CLASSES,
            "label_keys": CHEST_MNIST_LABEL_KEYS,
        }
    if ui_modality == "eye":
        return {
            "dataset_py": "OCTMNIST",
            "multilabel": False,
            "display": OCT_DISPLAY_CLASSES,
            "label_keys": None,
        }
    if ui_modality == "brain":
        return {
            "dataset_py": "OrganSMNIST",
            "multilabel": False,
            "display": ORGAN_S_DISPLAY_CLASSES,
            "label_keys": None,
        }
    raise ValueError(f"Unknown modality {ui_modality!r}; use skin|chest|eye|brain")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--modality",
        type=str,
        required=True,
        choices=("skin", "chest", "eye", "brain"),
        help="UI modality key; maps to a MedMNIST dataset (brain -> OrganSMNIST CT organs).",
    )
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--batch-size", type=int, default=64)
    parser.add_argument("--lr", type=float, default=3e-4)
    parser.add_argument("--image-size", type=int, default=224)
    args = parser.parse_args()

    spec = _spec(args.modality)
    DatasetCls = _get_medmnist_class(spec["dataset_py"])
    multilabel = spec["multilabel"]
    display_names = list(spec["display"])
    num_classes = len(display_names)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    train_ds = MedMNISTEfficientNetDataset(
        DatasetCls, "train", image_size=args.image_size, multilabel=multilabel
    )
    val_ds = MedMNISTEfficientNetDataset(
        DatasetCls, "val", image_size=args.image_size, multilabel=multilabel
    )

    train_loader = DataLoader(
        train_ds, batch_size=args.batch_size, shuffle=True, num_workers=0, pin_memory=False
    )
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False, num_workers=0)

    model = timm.create_model("efficientnet_b0", pretrained=True, num_classes=num_classes)
    model.to(device)

    if multilabel:
        criterion = nn.BCEWithLogitsLoss()
    else:
        criterion = nn.CrossEntropyLoss()

    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr)

    for epoch in range(args.epochs):
        model.train()
        running = 0.0
        for xb, yb in train_loader:
            xb = xb.to(device)
            yb = yb.to(device)
            if multilabel:
                yb = yb.float()
                if yb.dim() == 1:
                    yb = yb.view(xb.size(0), -1)
            else:
                yb = yb.long()
            optimizer.zero_grad()
            logits = model(xb)
            loss = criterion(logits, yb)
            loss.backward()
            optimizer.step()
            running += float(loss.item())
        print(
            f"Epoch {epoch + 1}/{args.epochs} train loss (avg batch): "
            f"{running / max(len(train_loader), 1):.4f}"
        )

        model.eval()
        vloss = 0.0
        with torch.no_grad():
            for xb, yb in val_loader:
                xb = xb.to(device)
                yb = yb.to(device)
                if multilabel:
                    yb = yb.float()
                    if yb.dim() == 1:
                        yb = yb.view(xb.size(0), -1)
                else:
                    yb = yb.long()
                logits = model(xb)
                vloss += float(criterion(logits, yb).item())
        print(f"Epoch {epoch + 1}/{args.epochs} val loss: {vloss / max(len(val_loader), 1):.4f}")

    out_dir = os.path.join(os.path.dirname(__file__), "..", "models", "weights")
    os.makedirs(out_dir, exist_ok=True)
    out_name = f"efficientnet_{args.modality}_disease.pth"
    out_path = os.path.join(out_dir, out_name)

    checkpoint: dict = {
        "model_state_dict": model.state_dict(),
        "disease_classes": display_names,
        "class_names": display_names,
        "multi_label": multilabel,
        "backbone": "efficientnet_b0",
        "image_size": args.image_size,
        "dataset": MEDMNIST_DATASET_ID[args.modality],
        "medmnist_task": MEDMNIST_TASK_NAME[args.modality],
        "ui_modality": args.modality,
    }
    if spec.get("label_keys"):
        checkpoint["label_keys"] = spec["label_keys"]

    torch.save(checkpoint, out_path)
    print(f"[OK] Saved {args.modality} model to {out_path}")
    print("     Reload the backend to load the new weights.")


if __name__ == "__main__":
    main()
