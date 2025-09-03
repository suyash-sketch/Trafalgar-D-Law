import io
import os
from typing import Optional, Tuple

import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageOps

try:
    # TensorFlow is heavy; keep import inside try for clearer error if missing
    import tensorflow as tf
except Exception as exc:  # pragma: no cover
    tf = None
    _import_error = exc
else:
    _import_error = None


MODEL_PATHS = [
    os.path.join(os.path.dirname(__file__), "model.h5"),
    os.path.join(os.path.dirname(__file__), "model.keras"),
    os.path.join(os.path.dirname(__file__), "..", "model.h5"),
    os.path.join(os.path.dirname(__file__), "..", "model.keras"),
]


def _find_model_path() -> Optional[str]:
    for p in MODEL_PATHS:
        if os.path.exists(p):
            return os.path.abspath(p)
    return None


_model = None


def get_model():
    global _model
    if _model is not None:
        return _model

    if _import_error is not None:
        raise RuntimeError(
            f"TensorFlow import failed: {_import_error}. Install dependencies from requirements.txt"
        )

    model_path = _find_model_path()
    if model_path is None:
        raise RuntimeError(
            "Model file not found. Please open the notebook and export the trained model:\n"
            "\n"
            "In Hand_Written_Digit.ipynb add and run:\n"
            "\n"
            "    import os\n"
            "    os.makedirs('backend', exist_ok=True)\n"
            "    model.save('backend/model.h5')\n"
        )

    _model = tf.keras.models.load_model(model_path)
    return _model


def preprocess_digit_image_from_bytes(image_bytes: bytes) -> Tuple[Image.Image, np.ndarray]:
    """Ported from the notebook's preprocess_digit_image.

    - Convert to grayscale
    - Auto-invert if background is white (MNIST expects white digit on black)
    - Autocontrast
    - Fit into 28x28 canvas preserving aspect ratio
    - Normalize to [0,1] and reshape to (1,28,28,1)
    """
    img = Image.open(io.BytesIO(image_bytes)).convert("L")

    np_img = np.array(img)
    if np.mean(np_img) > 127:
        img = ImageOps.invert(img)

    img = ImageOps.autocontrast(img)

    img.thumbnail((28, 28), Image.LANCZOS)
    canvas = Image.new("L", (28, 28), color=0)
    paste_x = (28 - img.width) // 2
    paste_y = (28 - img.height) // 2
    canvas.paste(img, (paste_x, paste_y))

    arr = np.array(canvas).astype("float32") / 255.0
    arr = arr.reshape(1, 28, 28, 1)
    return canvas, arr


app = FastAPI(title="Handwritten Digit Recognition API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if file.content_type is None or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image file")

    try:
        raw_bytes = await file.read()
        _, input_tensor = preprocess_digit_image_from_bytes(raw_bytes)
        model = get_model()
        probs = model.predict(input_tensor, verbose=0)[0]
        digit = int(np.argmax(probs))
        return {
            "digit": digit,
            "probs": [float(x) for x in probs.tolist()],
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


def _main():  # pragma: no cover
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    # If running from the backend directory, use local module path for reload
    cwd_name = os.path.basename(os.getcwd()).lower()
    if cwd_name == "backend":
        module_str = "main:app"
    else:
        # When running from root directory, we need to add the current directory to Python path
        import sys
        current_dir = os.path.dirname(os.path.abspath(__file__))
        parent_dir = os.path.dirname(current_dir)
        if parent_dir not in sys.path:
            sys.path.insert(0, parent_dir)
        module_str = "backend.main:app"
    uvicorn.run(module_str, host="0.0.0.0", port=port, reload=True)


if __name__ == "__main__":  # pragma: no cover
    _main()


