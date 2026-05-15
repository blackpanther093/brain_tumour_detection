from __future__ import annotations

import os
from pathlib import Path

import torch
import torch.nn as nn
import torch.nn.functional as F
import segmentation_models_pytorch as smp
import clip


DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


class FiLMLayer(nn.Module):
    def __init__(self, text_dim: int, channels: int) -> None:
        super().__init__()
        self.gamma = nn.Linear(text_dim, channels)
        self.beta = nn.Linear(text_dim, channels)

    def forward(self, x: torch.Tensor, text_emb: torch.Tensor) -> torch.Tensor:
        g = self.gamma(text_emb).unsqueeze(2).unsqueeze(3)
        b = self.beta(text_emb).unsqueeze(2).unsqueeze(3)
        return x * (1 + g) + b


class TrueVLM_BrainSeg(nn.Module):
    def __init__(self) -> None:
        super().__init__()
        self.clip_model, _ = clip.load("ViT-B/32", device=DEVICE)
        for param in self.clip_model.parameters():
            param.requires_grad = False

        self.unet = smp.Unet(
            encoder_name="resnet34",
            encoder_weights="imagenet",
            in_channels=3,
            classes=1,
        )

        self.fusion = FiLMLayer(text_dim=512, channels=512)
        self.current_text_emb = None
        self.unet.encoder.register_forward_hook(self._encoder_hook)

    def _encoder_hook(self, module, input, output):
        modified_output = list(output)
        modified_output[-1] = self.fusion(modified_output[-1], self.current_text_emb)
        return type(output)(modified_output)

    def forward(self, img: torch.Tensor, text_tokens: torch.Tensor):
        with torch.no_grad():
            text_emb = self.clip_model.encode_text(text_tokens).float()
            img_resized = F.interpolate(img, size=(224, 224), mode="bilinear")
            clip_img_emb = self.clip_model.encode_image(img_resized).float()

        self.current_text_emb = text_emb
        seg_out = self.unet(img)
        return seg_out, text_emb, clip_img_emb


_BASE_DIR = Path(__file__).resolve().parent
_PROJECT_ROOT = _BASE_DIR.parent
_DEFAULT_MODEL_PATH = _PROJECT_ROOT / "models" / "best_model.pth"

_MODEL = None


def load_model(checkpoint_path: Path) -> nn.Module:
    model = TrueVLM_BrainSeg().to(DEVICE)
    state = torch.load(checkpoint_path, map_location=DEVICE)
    if isinstance(state, dict) and "model" in state:
        state = state["model"]
    missing, unexpected = model.load_state_dict(state, strict=False)
    if missing or unexpected:
        print(f"[model] missing keys: {len(missing)}, unexpected keys: {len(unexpected)}")
    model.eval()
    return model


def get_model() -> nn.Module:
    global _MODEL
    if _MODEL is None:
        path = Path(os.getenv("MODEL_CHECKPOINT_PATH", str(_DEFAULT_MODEL_PATH))).expanduser()
        if not path.exists():
            raise FileNotFoundError(f"Model checkpoint not found: {path}")
        _MODEL = load_model(path)
    return _MODEL
