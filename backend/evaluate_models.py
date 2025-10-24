import os
import time
from typing import List, Tuple

import numpy as np

try:
    import tensorflow as tf
except Exception as exc:  # pragma: no cover
    raise RuntimeError(
        f"TensorFlow import failed: {exc}. Install dependencies from requirements.txt"
    )


def list_candidate_models() -> List[str]:
    here = os.path.dirname(__file__)
    candidates = [
        "mnist_cnn_final_acc_99.73percent.h5",
        "mnist_cnn_final_acc_99.69percent.h5",
        "best_mnist_cnn_model.h5",
        "model.h5",
        "modelgpu.h5",
        "sarthakmodel.h5",
        "model.keras",
    ]
    paths: List[str] = []
    for name in candidates:
        p = os.path.join(here, name)
        if os.path.exists(p):
            paths.append(p)
    return paths


def load_mnist_test() -> Tuple[np.ndarray, np.ndarray]:
    # Loads MNIST test set and preprocesses to (N, 28, 28, 1) float32 in [0,1]
    (_, _), (x_test, y_test) = tf.keras.datasets.mnist.load_data()
    x_test = x_test.astype("float32") / 255.0
    x_test = np.expand_dims(x_test, axis=-1)
    return x_test, y_test


def evaluate_model(model_path: str, x_test: np.ndarray, y_test: np.ndarray, sample_size: int = 10000) -> Tuple[float, float]:
    # Returns (accuracy, avg_ms_per_sample)
    model = tf.keras.models.load_model(model_path)

    # For accuracy, use the full test set (or subset if requested)
    n = min(sample_size, x_test.shape[0])
    x_eval = x_test[:n]
    y_eval = y_test[:n]

    # Accuracy
    logits = model.predict(x_eval, verbose=0)
    preds = np.argmax(logits, axis=1)
    accuracy = float((preds == y_eval).mean())

    # Latency: average over a smaller subset to keep it quick
    k = min(1000, n)
    start = time.perf_counter()
    _ = model.predict(x_eval[:k], verbose=0)
    elapsed = time.perf_counter() - start
    avg_ms = (elapsed / k) * 1000.0

    return accuracy, avg_ms


def main():
    model_paths = list_candidate_models()
    if not model_paths:
        print("No model files found in backend/. Place your .h5 or .keras model there.")
        return

    print("Found models:")
    for p in model_paths:
        print(f" - {os.path.basename(p)}")

    print("\nLoading MNIST test set...")
    x_test, y_test = load_mnist_test()
    print(f"Test set: {x_test.shape[0]} samples")

    results = []
    for p in model_paths:
        name = os.path.basename(p)
        try:
            print(f"\nEvaluating {name}...")
            acc, ms = evaluate_model(p, x_test, y_test)
            print(f"Accuracy: {acc*100:.2f}% | Avg latency: {ms:.3f} ms/sample")
            results.append((name, acc, ms))
        except Exception as exc:
            print(f"Failed to evaluate {name}: {exc}")

    if not results:
        print("\nNo models evaluated successfully.")
        return

    # Rank by accuracy desc, then latency asc
    results.sort(key=lambda t: (-t[1], t[2]))

    print("\n=== Summary (best first) ===")
    for i, (name, acc, ms) in enumerate(results, 1):
        print(f"{i}. {name}: {acc*100:.2f}% | {ms:.3f} ms/sample")

    best = results[0]
    print(
        f"\nBest model: {best[0]} with {best[1]*100:.2f}% accuracy and {best[2]:.3f} ms/sample"
    )


if __name__ == "__main__":
    main()


