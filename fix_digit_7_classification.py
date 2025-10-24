#!/usr/bin/env python3
"""
Script to diagnose and fix the digit 7 misclassification issue.
The model is incorrectly predicting 7s as 1s.
Completing 5 specific tasks to resolve the issue.
"""

import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix, classification_report
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models, optimizers, callbacks
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.utils import to_categorical
import os

# Set style for better plots
plt.style.use('default')
sns.set_palette("husl")

# Fix random seeds for reproducibility
SEED = 42
os.environ['PYTHONHASHSEED'] = str(SEED)
np.random.seed(SEED)
tf.random.set_seed(SEED)

def load_and_preprocess_data():
    """Load and preprocess MNIST data"""
    print("Loading MNIST dataset...")
    (x_train, y_train), (x_test, y_test) = keras.datasets.mnist.load_data()
    
    # Preprocess the data
    x_train = x_train.reshape(-1, 28, 28, 1).astype('float32') / 255.0
    x_test = x_test.reshape(-1, 28, 28, 1).astype('float32') / 255.0
    
    # One-hot encode labels
    y_train_cat = to_categorical(y_train, 10)
    y_test_cat = to_categorical(y_test, 10)
    
    return (x_train, y_train, y_train_cat), (x_test, y_test, y_test_cat)

def analyze_current_model(model_path="backend/mnist_cnn_final_acc_99.70percent.h5"):
    """Analyze the current model's performance, especially on digit 7"""
    print(f"\n=== Analyzing Model: {model_path} ===")
    
    # Load data
    (x_train, y_train, y_train_cat), (x_test, y_test, y_test_cat) = load_and_preprocess_data()
    
    # Load model
    try:
        model = keras.models.load_model(model_path)
        print("✓ Model loaded successfully")
    except Exception as e:
        print(f"✗ Error loading model: {e}")
        return None
    
    # Make predictions
    print("Making predictions on test set...")
    y_pred = model.predict(x_test, verbose=0)
    y_pred_classes = np.argmax(y_pred, axis=1)
    
    # Overall accuracy
    accuracy = np.mean(y_pred_classes == y_test)
    print(f"Overall Test Accuracy: {accuracy:.4f} ({accuracy*100:.2f}%)")
    
    # Create confusion matrix
    cm = confusion_matrix(y_test, y_pred_classes)
    
    # Analyze digit 7 specifically
    digit_7_indices = np.where(y_test == 7)[0]
    digit_7_predictions = y_pred_classes[digit_7_indices]
    digit_7_accuracy = np.mean(digit_7_predictions == 7)
    
    print(f"\nDigit 7 Analysis:")
    print(f"Total 7s in test set: {len(digit_7_indices)}")
    print(f"Correctly classified 7s: {np.sum(digit_7_predictions == 7)}")
    print(f"Digit 7 accuracy: {digit_7_accuracy:.4f} ({digit_7_accuracy*100:.2f}%)")
    
    # Check what 7s are being misclassified as
    misclassified_as = digit_7_predictions[digit_7_predictions != 7]
    if len(misclassified_as) > 0:
        print(f"Misclassified 7s: {len(misclassified_as)}")
        unique, counts = np.unique(misclassified_as, return_counts=True)
        for digit, count in zip(unique, counts):
            print(f"  - Predicted as {digit}: {count} times ({count/len(digit_7_indices)*100:.1f}%)")
    
    # Plot confusion matrix
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                xticklabels=range(10), yticklabels=range(10))
    plt.title('Confusion Matrix - Current Model')
    plt.xlabel('Predicted')
    plt.ylabel('Actual')
    plt.tight_layout()
    plt.savefig('confusion_matrix_analysis.png', dpi=300, bbox_inches='tight')
    plt.show()
    
    return model, (x_test, y_test, y_pred_classes)

def visualize_misclassified_7s(x_test, y_test, y_pred_classes, num_samples=16):
    """Visualize misclassified 7s to understand the problem"""
    print(f"\n=== Visualizing Misclassified 7s ===")
    
    # Find misclassified 7s
    digit_7_indices = np.where(y_test == 7)[0]
    misclassified_indices = digit_7_indices[y_pred_classes[digit_7_indices] != 7]
    
    if len(misclassified_indices) == 0:
        print("No misclassified 7s found!")
        return
    
    # Select random samples
    sample_indices = np.random.choice(misclassified_indices, 
                                    min(num_samples, len(misclassified_indices)), 
                                    replace=False)
    
    # Plot misclassified samples
    rows = 4
    cols = 4
    fig, axes = plt.subplots(rows, cols, figsize=(12, 12))
    fig.suptitle('Misclassified 7s (Actual: 7, Predicted: X)', fontsize=16)
    
    for i, idx in enumerate(sample_indices):
        if i >= rows * cols:
            break
        
        row = i // cols
        col = i % cols
        
        axes[row, col].imshow(x_test[idx].squeeze(), cmap='gray')
        axes[row, col].set_title(f'Predicted: {y_pred_classes[idx]}')
        axes[row, col].axis('off')
    
    # Hide unused subplots
    for i in range(len(sample_indices), rows * cols):
        row = i // cols
        col = i % cols
        axes[row, col].axis('off')
    
    plt.tight_layout()
    plt.savefig('misclassified_7s.png', dpi=300, bbox_inches='tight')
    plt.show()

def compare_digit_similarities():
    """Compare digit 7 and 1 to understand why they might be confused"""
    print(f"\n=== Comparing Digit 7 and 1 Patterns ===")
    
    # Load data
    (x_train, y_train, y_train_cat), (x_test, y_test, y_test_cat) = load_and_preprocess_data()
    
    # Get samples of 1s and 7s
    ones_indices = np.where(y_test == 1)[0][:8]
    sevens_indices = np.where(y_test == 7)[0][:8]
    
    fig, axes = plt.subplots(2, 8, figsize=(15, 6))
    
    # Plot 1s
    for i, idx in enumerate(ones_indices):
        axes[0, i].imshow(x_test[idx].squeeze(), cmap='gray')
        axes[0, i].set_title('1')
        axes[0, i].axis('off')
    
    # Plot 7s
    for i, idx in enumerate(sevens_indices):
        axes[1, i].imshow(x_test[idx].squeeze(), cmap='gray')
        axes[1, i].set_title('7')
        axes[1, i].axis('off')
    
    plt.suptitle('Comparison of 1s (top) and 7s (bottom)')
    plt.tight_layout()
    plt.savefig('digit_comparison_1_vs_7.png', dpi=300, bbox_inches='tight')
    plt.show()

def create_improved_model():
    """Create an improved model with better architecture for distinguishing 7 from 1"""
    print(f"\n=== Creating Improved Model ===")
    
    model = models.Sequential([
        # Input layer
        layers.Input(shape=(28, 28, 1)),
        
        # First Convolutional Block - More filters to capture fine details
        layers.Conv2D(64, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.Conv2D(64, (3, 3), activation='relu', padding='same'),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        # Second Convolutional Block - Focus on mid-level features
        layers.Conv2D(128, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.Conv2D(128, (3, 3), activation='relu', padding='same'),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        # Third Convolutional Block - High-level features
        layers.Conv2D(256, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.Conv2D(256, (3, 3), activation='relu', padding='same'),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.3),
        
        # Fourth Convolutional Block - Even more detailed features
        layers.Conv2D(512, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.Dropout(0.4),
        
        # Global Average Pooling
        layers.GlobalAveragePooling2D(),
        
        # Dense layers with more regularization
        layers.Dense(1024, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.6),
        
        layers.Dense(512, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.5),
        
        # Output layer
        layers.Dense(10, activation='softmax')
    ])
    
    # Compile with a lower learning rate for fine-tuning
    optimizer = optimizers.Adam(learning_rate=0.0005)
    model.compile(
        optimizer=optimizer,
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    print("✓ Improved model created")
    model.summary()
    
    return model

def create_enhanced_data_generator():
    """Create enhanced data augmentation specifically to help with 7 vs 1 confusion"""
    print("Creating enhanced data augmentation...")
    
    # More conservative augmentation to preserve digit characteristics
    datagen = ImageDataGenerator(
        rotation_range=8,           # Reduced rotation to preserve 7's horizontal line
        zoom_range=0.08,            # Reduced zoom
        width_shift_range=0.08,     # Reduced shift
        height_shift_range=0.08,
        shear_range=0.05,           # Reduced shear to preserve digit structure
        fill_mode='nearest'
    )
    
    return datagen

def train_improved_model():
    """Train the improved model with enhanced data augmentation"""
    print(f"\n=== Training Improved Model ===")
    
    # Load data
    (x_train, y_train, y_train_cat), (x_test, y_test, y_test_cat) = load_and_preprocess_data()
    
    # Create improved model
    model = create_improved_model()
    
    # Create enhanced data generator
    datagen = create_enhanced_data_generator()
    datagen.fit(x_train)
    
    # Create callbacks
    callbacks_list = [
        callbacks.EarlyStopping(
            monitor='val_accuracy',
            patience=10,
            restore_best_weights=True,
            verbose=1
        ),
        callbacks.ModelCheckpoint(
            'improved_mnist_model.h5',
            monitor='val_accuracy',
            save_best_only=True,
            verbose=1
        ),
        callbacks.ReduceLROnPlateau(
            monitor='val_accuracy',
            factor=0.2,
            patience=5,
            min_lr=1e-7,
            verbose=1
        )
    ]
    
    # Training parameters
    EPOCHS = 30
    BATCH_SIZE = 128
    
    print(f"Training for {EPOCHS} epochs with batch size {BATCH_SIZE}...")
    
    # Train the model
    history = model.fit(
        datagen.flow(x_train, y_train_cat, batch_size=BATCH_SIZE),
        steps_per_epoch=len(x_train) // BATCH_SIZE,
        epochs=EPOCHS,
        validation_data=(x_test, y_test_cat),
        callbacks=callbacks_list,
        verbose=1
    )
    
    return model, history

def evaluate_all_models():
    """Evaluate all available models to find the best one for digit 7"""
    print(f"\n=== Evaluating All Available Models ===")
    
    model_files = [
        "backend/mnist_cnn_final_acc_99.69percent.h5",
        "backend/mnist_cnn_final_acc_99.70percent.h5", 
        "backend/mnist_cnn_final_acc_99.73percent.h5",
        "backend/best_mnist_cnn_model.h5"
    ]
    
    # Load data
    (x_train, y_train, y_train_cat), (x_test, y_test, y_test_cat) = load_and_preprocess_data()
    
    results = {}
    
    for model_file in model_files:
        if os.path.exists(model_file):
            print(f"\nEvaluating: {model_file}")
            try:
                model = keras.models.load_model(model_file)
                
                # Make predictions
                y_pred = model.predict(x_test, verbose=0)
                y_pred_classes = np.argmax(y_pred, axis=1)
                
                # Overall accuracy
                overall_acc = np.mean(y_pred_classes == y_test)
                
                # Digit 7 accuracy
                digit_7_indices = np.where(y_test == 7)[0]
                digit_7_predictions = y_pred_classes[digit_7_indices]
                digit_7_acc = np.mean(digit_7_predictions == 7)
                
                # 7 misclassified as 1
                misclassified_as_1 = np.sum(digit_7_predictions == 1)
                
                results[model_file] = {
                    'overall_accuracy': overall_acc,
                    'digit_7_accuracy': digit_7_acc,
                    'seven_as_one_count': misclassified_as_1,
                    'seven_as_one_rate': misclassified_as_1 / len(digit_7_indices)
                }
                
                print(f"  Overall Accuracy: {overall_acc:.4f}")
                print(f"  Digit 7 Accuracy: {digit_7_acc:.4f}")
                print(f"  7s classified as 1: {misclassified_as_1} ({misclassified_as_1/len(digit_7_indices)*100:.1f}%)")
                
            except Exception as e:
                print(f"  Error loading model: {e}")
        else:
            print(f"Model not found: {model_file}")
    
    # Find best model for digit 7
    if results:
        best_model = max(results.items(), key=lambda x: x[1]['digit_7_accuracy'])
        print(f"\n🏆 Best model for digit 7: {best_model[0]}")
        print(f"   Digit 7 accuracy: {best_model[1]['digit_7_accuracy']:.4f}")
    
    return results

def main():
    """Main function to run the diagnosis and fix"""
    print("=" * 60)
    print("DIGIT 7 MISCLASSIFICATION DIAGNOSTIC AND FIX")
    print("=" * 60)
    
    # Step 1: Analyze current model
    model_data = analyze_current_model()
    
    if model_data is not None:
        model, (x_test, y_test, y_pred_classes) = model_data
        
        # Step 2: Visualize misclassified 7s
        visualize_misclassified_7s(x_test, y_test, y_pred_classes)
        
        # Step 3: Compare digit similarities
        compare_digit_similarities()
    
    # Step 4: Evaluate all available models
    results = evaluate_all_models()
    
    # Step 5: Provide recommendations
    print(f"\n" + "=" * 60)
    print("RECOMMENDATIONS")
    print("=" * 60)
    
    print("\n1. IMMEDIATE SOLUTIONS:")
    print("   - Use the model with highest digit 7 accuracy from evaluation above")
    print("   - Check image preprocessing - ensure 7s aren't being distorted")
    print("   - Verify that input images are properly normalized and centered")
    
    print("\n2. LONG-TERM SOLUTIONS:")
    print("   - Retrain with enhanced data augmentation (less aggressive)")
    print("   - Use a deeper model with more filters to capture fine details")
    print("   - Consider ensemble methods combining multiple models")
    print("   - Add more training data specifically for problematic 7 cases")
    
    print("\n3. DEBUGGING STEPS:")
    print("   - Test with various 7 images to identify patterns in misclassification")
    print("   - Check if the issue occurs with handwritten vs printed 7s")
    print("   - Verify preprocessing pipeline matches training preprocessing")
    
    user_input = input("\nWould you like to train an improved model now? (y/n): ").lower()
    if user_input == 'y':
        print("\nStarting improved model training...")
        improved_model, history = train_improved_model()
        
        # Evaluate the improved model
        print("\nEvaluating improved model...")
        analyze_current_model("improved_mnist_model.h5")
    
    print("\n✅ Analysis complete! Check the generated visualizations:")
    print("   - confusion_matrix_analysis.png")
    print("   - misclassified_7s.png") 
    print("   - digit_comparison_1_vs_7.png")

if __name__ == "__main__":
    main()