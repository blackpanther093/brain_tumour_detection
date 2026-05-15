# Text-Guided Brain Tumor Segmentation Web App

A production-grade, modern web UI and FastAPI backend for multimodal brain tumor segmentation using FLAIR MRI and optional radiology text guidance. The inference pipeline mirrors the notebook preprocessing: grayscale resize to 128, float32 in [0, 1], 3-channel stacking, and CLIP text tokenization with identical cleaning rules.

## Project Structure

- backend/ - FastAPI service, model loader, preprocessing, inference
- frontend/ - React + Vite + Tailwind UI
- models/ - place your model checkpoint here
- assets/ - optional static assets

## Backend Setup

1. Create a virtual environment and install dependencies:

```
cd medical-ai-app
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. Add your checkpoint path:

```
cp backend/.env.example backend/.env
```

Edit backend/.env and set:

```
MODEL_CHECKPOINT_PATH=/absolute/path/to/your/model.pth
```

3. Run the API server:

```
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

## Frontend Setup

```
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Notes

- The model uses CLIP ViT-B/32 and UNet-ResNet34 with FiLM conditioning, matching the training notebook.
- If no text is provided, the backend uses a zero token tensor (same as training fallback).
- Grad-CAM is computed on the last encoder layer and returned as a heatmap overlay.
- The first run may download CLIP weights.

## API Contract

POST /api/segment (multipart/form-data)
- image: image/png or image/jpeg
- report: optional text string
- threshold: float (0 to 1)
- opacity: float (0 to 1)
- return_attention: true/false

Response:
- images.original
- images.mask
- images.overlay
- images.attention
- metrics.dice_confidence
- metrics.tumor_area_percent
- metrics.segmentation_coverage
- metrics.inference_ms
- metrics.semantic_alignment
