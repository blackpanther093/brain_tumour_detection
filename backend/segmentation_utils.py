from __future__ import annotations

import base64
import io
from typing import Dict

import numpy as np
from PIL import Image


def image_to_base64(img: Image.Image) -> str:
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
    return f"data:image/png;base64,{encoded}"


def mask_to_image(mask: np.ndarray) -> Image.Image:
    mask_uint8 = (mask * 255).astype(np.uint8)
    return Image.fromarray(mask_uint8, mode="L")


def overlay_mask(image_np: np.ndarray, mask_np: np.ndarray, opacity: float) -> Image.Image:
    base = np.stack([image_np, image_np, image_np], axis=-1)
    color = np.array([1.0, 0.25, 0.05], dtype=np.float32)
    overlay = base.copy()
    m = mask_np > 0.5
    overlay[m] = (1.0 - opacity) * base[m] + opacity * color
    overlay = np.clip(overlay, 0.0, 1.0)
    return Image.fromarray((overlay * 255).astype(np.uint8))


def _apply_colormap(values: np.ndarray) -> np.ndarray:
    v = np.clip(values, 0.0, 1.0)
    r = np.clip(1.5 * v, 0.0, 1.0)
    g = np.clip(1.5 * (1.0 - np.abs(v - 0.5) * 2.0), 0.0, 1.0)
    b = np.clip(1.5 * (1.0 - v), 0.0, 1.0)
    return np.stack([r, g, b], axis=-1)


def overlay_heatmap(image_np: np.ndarray, cam: np.ndarray, opacity: float) -> Image.Image:
    base = np.stack([image_np, image_np, image_np], axis=-1)
    heat = _apply_colormap(cam)
    out = (1.0 - opacity) * base + opacity * heat
    out = np.clip(out, 0.0, 1.0)
    return Image.fromarray((out * 255).astype(np.uint8))


def pack_images(original: Image.Image, mask: Image.Image, overlay: Image.Image, attention: Image.Image | None) -> Dict[str, str | None]:
    return {
        "original": image_to_base64(original),
        "mask": image_to_base64(mask),
        "overlay": image_to_base64(overlay),
        "attention": image_to_base64(attention) if attention is not None else None,
    }
