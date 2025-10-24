#!/usr/bin/env python3
"""
Quick test to find which model performs best on digit 7
"""
import numpy as np
import tensorflow as tf
from tensorflow import keras
import os

def test_digit7_accuracy():
    """Test all available models for digit 7 accuracy"""
    print("Testing all models for digit 7 accuracy...")
    
    # Load MNIST test data
    (_, _), (x_test, y_test) = keras.datasets.mnist.load_data()
    x_test = x_test.reshape(-1, 28, 28, 1).astype('float32') / 255.0
    
    # Available models
    models = [
        "backend/mnist_cnn_final_acc_99.69percent.h5",
        "backend/mnist_cnn_final_acc_99.70percent.h5",
        "backend/mnist_cnn_final_acc_99.73percent.h5",
        "backend/best_mnist_cnn_model.h5"
    ]
    
    results = {}
    
    for model_path in models:
        if os.path.exists(model_path):
            try:
                model = keras.models.load_model(model_path)
                predictions = model.predict(x_test, verbose=0)
                pred_classes = np.argmax(predictions, axis=1)
                
                # Focus on digit 7
                digit7_indices = np.where(y_test == 7)[0]
                digit7_preds = pred_classes[digit7_indices]
                digit7_accuracy = np.mean(digit7_preds == 7)
                
                # Count 7s misclassified as 1s
                seven_as_one = np.sum(digit7_preds == 1)
                seven_as_one_rate = seven_as_one / len(digit7_indices)
                
                results[model_path] = {
                    'digit7_accuracy': digit7_accuracy,
                    'seven_as_one_count': seven_as_one,
                    'seven_as_one_rate': seven_as_one_rate
                }
                
                print(f"\n{os.path.basename(model_path)}:")
                print(f"  Digit 7 accuracy: {digit7_accuracy:.3f} ({digit7_accuracy*100:.1f}%)")
                print(f"  7s misclassified as 1: {seven_as_one} ({seven_as_one_rate*100:.1f}%)")
                
            except Exception as e:
                print(f"Error with {model_path}: {e}")
        else:
            print(f"Model not found: {model_path}")
    
    if results:
        best_model = max(results.items(), key=lambda x: x[1]['digit7_accuracy'])
        print(f"\n🏆 BEST MODEL FOR DIGIT 7:")
        print(f"   {os.path.basename(best_model[0])}")
        print(f"   Accuracy: {best_model[1]['digit7_accuracy']*100:.1f}%")
        print(f"   Only {best_model[1]['seven_as_one_rate']*100:.1f}% of 7s misclassified as 1s")
        
        return best_model[0]
    
    return None

if __name__ == "__main__":
    best_model_path = test_digit7_accuracy()
    
    if best_model_path:
        print(f"\n✅ RECOMMENDATION: Use {os.path.basename(best_model_path)} in your backend")
        print("   Update the MODEL_PATHS in backend/main.py to prioritize this model")