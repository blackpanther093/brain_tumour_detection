from __future__ import annotations

import time
from typing import Dict, Tuple

import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image

from .model_loader import get_model, DEVICE
from .segmentation_utils import mask_to_image, overlay_mask, overlay_heatmap, pack_images
from .utils.gradcam import GradCAM


def run_inference(
    img_tensor: torch.Tensor,
    image_np: np.ndarray,
    text_tokens: torch.Tensor,
    threshold: float,
    opacity: float,
    return_attention: bool,
    has_text: bool,
) -> Tuple[Dict, Dict]:
    model = get_model()
    img_tensor = img_tensor.to(DEVICE)
    text_tokens = text_tokens.unsqueeze(0).to(DEVICE)

    start = time.perf_counter()
    with torch.no_grad():
        logits, text_emb, img_emb = model(img_tensor, text_tokens)
        probs = torch.sigmoid(logits)
    inference_ms = (time.perf_counter() - start) * 1000.0

    probs_np = probs.squeeze().cpu().numpy()
    mask_np = (probs_np > threshold).astype(np.float32)

    if mask_np.sum() > 0:
        dice_confidence = float(probs_np[mask_np > 0.5].mean())
    else:
        dice_confidence = float(probs_np.mean())

    tumor_area_percent = float(mask_np.mean() * 100.0)
    segmentation_coverage = float(mask_np.sum() / mask_np.size * 100.0)

    semantic_alignment = None
    if has_text:
        semantic_alignment = float(F.cosine_similarity(text_emb, img_emb, dim=1).mean().item())

    original_img = Image.fromarray((image_np * 255).astype(np.uint8)).convert("RGB")
    mask_img = mask_to_image(mask_np)
    overlay_img = overlay_mask(image_np, mask_np, opacity)

    attention_img = None
    if return_attention:
        cam_generator = GradCAM(model, model.unet.encoder.layer4)
        cam = cam_generator.generate(img_tensor, text_tokens)
        attention_img = overlay_heatmap(image_np, cam, opacity=0.45)

    images = pack_images(original_img, mask_img, overlay_img, attention_img)

    metrics = {
        "dice_confidence": dice_confidence,
        "tumor_area_percent": tumor_area_percent,
        "segmentation_coverage": segmentation_coverage,
        "inference_ms": inference_ms,
        "semantic_alignment": semantic_alignment,
    }
    return images, metrics
