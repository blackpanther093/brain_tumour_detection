from __future__ import annotations

import re
from typing import Tuple

import numpy as np
import torch
from PIL import Image
import clip


def clean_text(text: str) -> str:
    text = text.strip().lower()
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"[^a-z0-9\s.,]", "", text)
    return text


def tokenize_text(text: str) -> torch.Tensor:
    if not text or not text.strip():
        return torch.zeros(77, dtype=torch.long)
    cleaned = clean_text(text)
    tokens = clip.tokenize(cleaned, truncate=True)
    return tokens[0]


def prepare_image(pil_img: Image.Image, img_size: int = 128) -> Tuple[torch.Tensor, np.ndarray]:
    # Mirror training preprocessing: grayscale, resize, float32, stack 3 channels.
    if pil_img.mode != "L":
        pil_img = pil_img.convert("L")
    pil_img = pil_img.resize((img_size, img_size), Image.BILINEAR)

    img_np = np.array(pil_img).astype(np.float32)
    if img_np.max() > 1.0:
        img_np = img_np / 255.0
    img_np = np.clip(img_np, 0.0, 1.0)

    img_3 = np.stack([img_np, img_np, img_np], axis=0)
    tensor = torch.from_numpy(img_3).unsqueeze(0)
    return tensor, img_np
