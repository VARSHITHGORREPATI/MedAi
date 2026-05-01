"""
MedMNIST class names aligned with https://github.com/MedMNIST/MedMNIST (INFO labels).

Used as default `disease_classes` when EfficientNet weights are trained from our scripts.
- Chest: ChestMNIST (multi-label, 14).
- Skin: DermaMNIST (7), dermatoscopy.
- Eye: OCTMNIST (4), retinal OCT.
- Brain (UI slot): OrganSMNIST (11) — **abdominal CT organ** slices in MedMNIST, not intracranial MRI.
  Use custom .pth if you need brain-tumor classes instead.
"""

from __future__ import annotations

# --- ChestMNIST (14, multi-label) ---
CHEST_MNIST_LABEL_KEYS: list[str] = [
    "atelectasis",
    "cardiomegaly",
    "effusion",
    "infiltration",
    "mass",
    "nodule",
    "pneumonia",
    "pneumothorax",
    "consolidation",
    "edema",
    "emphysema",
    "fibrosis",
    "pleural",
    "hernia",
]


def chest_display_name(key: str) -> str:
    if key == "pleural":
        return "Pleural Thickening"
    return key.replace("_", " ").strip().title()


CHEST_DISPLAY_CLASSES: list[str] = [chest_display_name(k) for k in CHEST_MNIST_LABEL_KEYS]

# --- DermaMNIST (7) ---
DERMA_DISPLAY_CLASSES: list[str] = [
    "Actinic keratoses and intraepithelial carcinoma",
    "Basal cell carcinoma",
    "Benign keratosis-like lesions",
    "Dermatofibroma",
    "Melanoma",
    "Melanocytic nevi",
    "Vascular lesions",
]

# --- OCTMNIST (4) ---
OCT_DISPLAY_CLASSES: list[str] = [
    "Choroidal neovascularization",
    "Diabetic macular edema",
    "Drusen",
    "Normal",
]

# --- OrganSMNIST (11) — used for the “Brain” dropdown when trained via MedMNIST (CT organ). ---
ORGAN_S_DISPLAY_CLASSES: list[str] = [
    "Bladder",
    "Femur left",
    "Femur right",
    "Heart",
    "Kidney left",
    "Kidney right",
    "Liver",
    "Lung left",
    "Lung right",
    "Pancreas",
    "Spleen",
]

# Default dataset id string stored in checkpoints / API metadata
MEDMNIST_DATASET_ID: dict[str, str] = {
    "skin": "MedMNIST-DermaMNIST",
    "chest": "MedMNIST-ChestMNIST",
    "eye": "MedMNIST-OCTMNIST",
    "brain": "MedMNIST-OrganSMNIST",
}

MEDMNIST_TASK_NAME: dict[str, str] = {
    "skin": "dermamnist",
    "chest": "chestmnist",
    "eye": "octmnist",
    "brain": "organsmnist",
}
