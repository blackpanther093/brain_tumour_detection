from __future__ import annotations

from io import BytesIO
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import numpy as np

from .model_loader import get_model, DEVICE
from .preprocessing import prepare_image, tokenize_text
from .inference import run_inference


app = FastAPI(title="VLM Brain Tumor Segmentation API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "device": str(DEVICE)}


@app.post("/api/segment")
async def segment(
    image: UploadFile = File(...),
    report: Optional[str] = Form(""),
    threshold: float = Form(0.5),
    opacity: float = Form(0.55),
    return_attention: bool = Form(True),
) -> dict:
    # Allow common image uploads and numpy arrays (.npy)
    filename = (image.filename or "").lower()
    is_npy = filename.endswith(".npy")
    allowed_images = {"image/png", "image/jpeg", "image/jpg"}
    if not is_npy and image.content_type not in allowed_images:
        raise HTTPException(status_code=400, detail="Unsupported image format.")

    if not (0.0 < threshold < 1.0):
        raise HTTPException(status_code=400, detail="Threshold must be between 0 and 1.")

    if not (0.0 <= opacity <= 1.0):
        raise HTTPException(status_code=400, detail="Opacity must be between 0 and 1.")

    try:
        raw = await image.read()
        if is_npy:
            # Load numpy array from uploaded .npy file
            try:
                arr = np.load(BytesIO(raw), allow_pickle=False)
            except Exception:
                raise HTTPException(status_code=400, detail="Invalid .npy file format.")

            # Convert common shapes to a 2D grayscale image
            if arr.ndim == 2:
                img_np = arr.astype(np.float32)
            elif arr.ndim == 3:
                # HWC or CHW handling
                if arr.shape[2] in (1, 3):
                    # H, W, C
                    if arr.shape[2] == 3:
                        img_np = arr.mean(axis=2).astype(np.float32)
                    else:
                        img_np = arr[..., 0].astype(np.float32)
                elif arr.shape[0] in (1, 3):
                    # C, H, W -> convert to H, W
                    arr_hwc = np.transpose(arr, (1, 2, 0))
                    if arr_hwc.shape[2] == 3:
                        img_np = arr_hwc.mean(axis=2).astype(np.float32)
                    else:
                        img_np = arr_hwc[..., 0].astype(np.float32)
                else:
                    # Fallback: take first channel/slice
                    img_np = arr[0].astype(np.float32)
            else:
                raise HTTPException(status_code=400, detail="Unsupported .npy array shape.")

            # Normalize to [0,1]
            if img_np.max() > 1.5:
                img_np = img_np / 255.0
            img_np = np.clip(img_np, 0.0, 1.0)
            pil_img = Image.fromarray((img_np * 255).astype("uint8")).convert("RGB")
        else:
            pil_img = Image.open(BytesIO(raw)).convert("RGB")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid image file.") from exc

    try:
        _ = get_model()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    img_tensor, image_np = prepare_image(pil_img, img_size=128)
    text_tokens = tokenize_text(report or "")

    has_text = bool(report and report.strip())
    images, metrics = run_inference(
        img_tensor=img_tensor,
        image_np=image_np,
        text_tokens=text_tokens,
        threshold=threshold,
        opacity=opacity,
        return_attention=return_attention,
        has_text=has_text,
    )

    return {"images": images, "metrics": metrics}
