# Handwritten Digit Recognition API

FastAPI backend that loads the CNN from your notebook and exposes a prediction API.

## 1) Export model from notebook
Open `Hand_Written_Digit.ipynb` and run a cell after training:

```python
import os
os.makedirs('backend', exist_ok=True)
model.save('backend/model.h5')
print('Saved to backend/model.h5')
```

This writes the trained model to `backend/model.h5` which the API will load at startup.

## 2) Install and run API
```bash
cd backend
python -m venv .venv
# Windows PowerShell
. .venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000
```

## 3) Test
```bash
curl -F "file=@../4.png" http://localhost:8000/predict
```

Response:
```json
{ "digit": 4, "probs": [ 0.01, 0.02, 0.93, ... ] }
```

Make sure your React app points to `http://localhost:8000` via `VITE_API_BASE_URL` or the default.


