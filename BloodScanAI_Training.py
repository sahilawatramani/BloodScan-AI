# ============================================================
# BloodScan AI — Complete Training Script
# Run: python BloodScanAI_Training.py
# ============================================================
import subprocess, sys, os
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend (no pop-up windows)

import tensorflow as tf
print(f"TensorFlow: {tf.__version__}")

# Check for GPU
gpus = tf.config.list_physical_devices('GPU')
if not gpus:
    print("⚠️ WARNING: No GPU found. Falling back to CPU. Training will be significantly slower.")
else:
    print(f"✅ GPU Available: {gpus}")
    
    # --- RTX A4000 Specific Optimizations ---
    # 1. Enable memory growth so it doesn't instantly claim all 16GB VRAM
    for gpu in gpus:
        tf.config.experimental.set_memory_growth(gpu, True)
    
    # 2. Enable mixed precision (RTX A4000 natively accelerates FP16)
    print("Enabling mixed precision for 2x speed and lower memory usage.")
    tf.keras.mixed_precision.set_global_policy('mixed_float16')
    
    # 3. Enable XLA (Accelerated Linear Algebra) for extra ~15% speed boost
    tf.config.optimizer.set_jit(True)
    print("Enabled XLA compiler for maximum GPU throughput.")

# ============================================================
# CELL 2: Imports & Config
# ============================================================
import random, gc, time, json, glob, shutil
import numpy as np
import pandas as pd
from tensorflow import keras
from tensorflow.keras import layers
from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_class_weight
from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                             f1_score, confusion_matrix, classification_report,
                             roc_auc_score, roc_curve)
import matplotlib.pyplot as plt
import seaborn as sns

SEED = 42
random.seed(SEED)
np.random.seed(SEED)
tf.random.set_seed(SEED)

# === CHANGE THIS PATH FOR YOUR WORKSTATION ===
# e.g., ROOT_DIR = "/home/CL502-11/Downloads/CV_Project/C-NMC_Leukemia/training_data"
ROOT_DIR = "./C-NMC_Leukemia/training_data"
# For Colab: ROOT_DIR = "/content/drive/MyDrive/C-NMC_Leukemia/training_data"

IMG_SIZE = (224, 224)
BATCH_SIZE = 128 # Increased to 128! 16GB VRAM + FP16 can handle this easily
EPOCHS = 50      # EarlyStopping will halt if it plateaus
PROJ_DIM = 1024  # Richer feature representation
NUM_CLASSES = 2
LR = 1e-4
CHECKPOINT_DIR = "checkpoints"
os.makedirs(CHECKPOINT_DIR, exist_ok=True)
os.makedirs("plots", exist_ok=True)

# ============================================================
# CELL 3: Dataset Loading with Augmentation + Class Weights
# ============================================================
def load_and_split_dataset(root_dir, img_size=IMG_SIZE, batch_size=BATCH_SIZE):
    image_paths, labels = [], []
    
    has_folds = any("fold" in d for d in os.listdir(root_dir))
    folds = [d for d in os.listdir(root_dir) if d.startswith("fold")] if has_folds else [""]
    
    for fold in folds:
        for label, category in enumerate(['all', 'hem']):
            folder = os.path.join(root_dir, fold, category) if fold else os.path.join(root_dir, category)
            if os.path.exists(folder):
                imgs = [os.path.join(folder, f) for f in os.listdir(folder) 
                       if f.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp'))]
                image_paths.extend(imgs)
                labels.extend([label] * len(imgs))
                print(f"  Found {len(imgs)} images in {folder}")
    
    image_paths, labels = np.array(image_paths), np.array(labels)
    print(f"\nTotal: {len(image_paths)} | ALL: {(labels==0).sum()} | HEM: {(labels==1).sum()}")
    
    X_train, X_temp, y_train, y_temp = train_test_split(
        image_paths, labels, test_size=0.3, stratify=labels, random_state=SEED)
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.5, stratify=y_temp, random_state=SEED)
    
    print(f"Train: {len(X_train)} | Val: {len(X_val)} | Test: {len(X_test)}")
    
    cw = compute_class_weight('balanced', classes=np.unique(y_train), y=y_train)
    class_weight_dict = dict(enumerate(cw))
    print(f"Class weights: {class_weight_dict}")
    
    augment = keras.Sequential([
        layers.RandomFlip("horizontal_and_vertical"),
        layers.RandomRotation(0.2),
        layers.RandomZoom(0.15),
        layers.RandomContrast(0.2),
    ], name="augmentation")
    
    def preprocess(path, label):
        img = tf.io.read_file(path)
        img = tf.image.decode_image(img, channels=3)
        img.set_shape([None, None, 3])
        img = tf.image.resize(img, img_size)
        img = tf.cast(img, tf.float32) / 255.0
        return img, tf.one_hot(label, NUM_CLASSES)
    
    def make_ds(X, y, shuffle=False, augment_fn=None):
        ds = tf.data.Dataset.from_tensor_slices((X, y))
        if shuffle:
            ds = ds.shuffle(buffer_size=len(X))
        ds = ds.map(preprocess, num_parallel_calls=tf.data.AUTOTUNE)
        if augment_fn:
            ds = ds.map(lambda img, lbl: (augment_fn(img, training=True), lbl),
                       num_parallel_calls=tf.data.AUTOTUNE)
        return ds.batch(batch_size).prefetch(tf.data.AUTOTUNE)
    
    train_ds = make_ds(X_train, y_train, shuffle=True, augment_fn=augment)
    val_ds = make_ds(X_val, y_val)
    test_ds = make_ds(X_test, y_test)
    
    return train_ds, val_ds, test_ds, class_weight_dict, (X_test, y_test)

train_ds, val_ds, test_ds, class_weights, test_info = load_and_split_dataset(ROOT_DIR)

# Verify
for imgs, lbls in train_ds.take(1):
    print(f"Batch shape: {imgs.shape}, Labels: {lbls.shape}")

# ============================================================
# CELL 4: Quantum Layer Definitions (with get_config)
# ============================================================
class QuantumFeatureFusion(layers.Layer):
    def __init__(self, dim, **kwargs):
        super().__init__(**kwargs)
        self.dim = dim
        self.theta = layers.Dense(dim)
        self.amp = layers.Dense(dim)
    def build(self, input_shape):
        self.alpha = self.add_weight(name="alpha", shape=(1,),
            initializer=tf.keras.initializers.Constant(0.6), trainable=True, dtype=tf.float32)
    def call(self, x):
        phi = tf.sigmoid(self.theta(x)) * np.pi
        A = tf.sigmoid(self.amp(x))
        return x + self.alpha * (tf.cos(phi) * x * A + tf.sin(phi) * x * (1 - A))
    def get_config(self):
        config = super().get_config()
        config.update({"dim": self.dim})
        return config

class QuantumAttention(layers.Layer):
    def __init__(self, dim, **kwargs):
        super().__init__(**kwargs)
        self.dim = dim
        self.phase = layers.Dense(dim)
        self.amp = layers.Dense(dim)
    def build(self, input_shape):
        self.gamma = self.add_weight(name="gamma", shape=(1,),
            initializer=tf.keras.initializers.Constant(0.7), trainable=True, dtype=tf.float32)
    def call(self, x):
        theta = tf.sigmoid(self.phase(x)) * np.pi
        A = tf.sigmoid(self.amp(x))
        att = tf.cos(theta) * A + tf.sin(theta) * (1 - A)
        return x * (1 + self.gamma * att)
    def get_config(self):
        config = super().get_config()
        config.update({"dim": self.dim})
        return config

class QuantumEntanglement(layers.Layer):
    def __init__(self, dim, **kwargs):
        super().__init__(**kwargs)
        self.dim = dim
        self.W1 = layers.Dense(dim)
        self.W2 = layers.Dense(dim)
        self.W3 = layers.Dense(dim)
        self.out = layers.Dense(dim)
    def build(self, input_shape):
        self.beta = self.add_weight(name="beta", shape=(1,),
            initializer=tf.keras.initializers.Constant(0.5), trainable=True, dtype=tf.float32)
    def call(self, inputs):
        f1, f2, f3 = inputs
        e12 = tf.tanh(self.W1(f1) * self.W2(f2))
        e23 = tf.tanh(self.W2(f2) * self.W3(f3))
        e31 = tf.tanh(self.W3(f3) * self.W1(f1))
        fused = self.out(tf.concat([e12, e23, e31], axis=-1))
        return fused + self.beta * fused
    def get_config(self):
        config = super().get_config()
        config.update({"dim": self.dim})
        return config

class QuantumStateProjection(layers.Layer):
    def __init__(self, dim, **kwargs):
        super().__init__(**kwargs)
        self.dim = dim
        self.U = layers.Dense(dim, use_bias=False, kernel_initializer="orthogonal")
    def build(self, input_shape):
        self.gamma = self.add_weight(name="gamma", shape=(1,),
            initializer=tf.keras.initializers.Constant(0.5), trainable=True, dtype=tf.float32)
    def call(self, x):
        Ux = tf.nn.l2_normalize(self.U(x), axis=-1)
        proj = tf.matmul(Ux, self.U.kernel, transpose_b=True)
        return x + self.gamma * proj
    def get_config(self):
        config = super().get_config()
        config.update({"dim": self.dim})
        return config

class QuantumPhaseEncoding(layers.Layer):
    def __init__(self, dim, **kwargs):
        super().__init__(**kwargs)
        self.dim = dim
        self.phase = layers.Dense(dim)
    def build(self, input_shape):
        self.delta = self.add_weight(name="delta", shape=(1,),
            initializer=tf.keras.initializers.Constant(0.4), trainable=True, dtype=tf.float32)
    def call(self, x):
        phi = tf.sigmoid(self.phase(x)) * np.pi
        enc = tf.cos(phi) * x + tf.sin(phi) * x
        return x + self.delta * enc
    def get_config(self):
        config = super().get_config()
        config.update({"dim": self.dim})
        return config

custom_objects = {
    "QuantumFeatureFusion": QuantumFeatureFusion,
    "QuantumAttention": QuantumAttention,
    "QuantumEntanglement": QuantumEntanglement,
    "QuantumStateProjection": QuantumStateProjection,
    "QuantumPhaseEncoding": QuantumPhaseEncoding,
}

# ============================================================
# CELL 5: Model Builder (2-Phase Training Support)
# ============================================================
def build_xception_fusion(fusion_type="QFF", img_size=224, proj_dim=PROJ_DIM, num_classes=NUM_CLASSES):
    base = tf.keras.applications.Xception(weights="imagenet", include_top=False,
                                           input_shape=(img_size, img_size, 3))
    base.trainable = False  # Phase 1: Freeze backbone
    
    layer_names = ["block3_sepconv2_act", "block10_sepconv2_act", "block13_sepconv2_act"]
    feats = [base.get_layer(n).output for n in layer_names]
    feat_model = tf.keras.Model(base.input, feats)

    inp = layers.Input(shape=(img_size, img_size, 3))
    fmaps = feat_model(inp)
    pooled = [layers.GlobalAveragePooling2D()(f) for f in fmaps]
    proj = [layers.Dense(proj_dim, activation="relu")(p) for p in pooled]

    if fusion_type == "QFF":
        fused = [QuantumFeatureFusion(proj_dim)(p) for p in proj]
        x = layers.Concatenate()(fused)
    elif fusion_type == "QAM":
        fused = [QuantumAttention(proj_dim)(p) for p in proj]
        x = layers.Concatenate()(fused)
    elif fusion_type == "QEF":
        x = QuantumEntanglement(proj_dim)(proj)
    elif fusion_type == "QSPM":
        fused = [QuantumStateProjection(proj_dim)(p) for p in proj]
        x = layers.Concatenate()(fused)
    elif fusion_type == "QPEL":
        fused = [QuantumPhaseEncoding(proj_dim)(p) for p in proj]
        x = layers.Concatenate()(fused)
    else:
        x = layers.Concatenate()(proj)

    x = layers.Dense(1024, activation="relu")(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.4)(x)
    x = layers.Dense(256, activation="relu")(x)
    x = layers.Dropout(0.3)(x)
    out = layers.Dense(num_classes, activation="softmax", dtype="float32")(x)
    
    return keras.Model(inp, out, name=f"Xception_{fusion_type}"), feat_model

# ============================================================
# CELL 6: Training Loop (2-Phase + Checkpoints + Class Weights)
# ============================================================
FUSION_TYPES = ["QFF", "QAM", "QEF", "QSPM", "QPEL"]
RESULTS = []
best_model_name = None
best_acc = 0.0

for fusion in FUSION_TYPES:
    print(f"\n{'='*50}")
    print(f"  TRAINING FUSION: {fusion}")
    print(f"{'='*50}")
    tf.keras.backend.clear_session()
    gc.collect()

    model, feat_model = build_xception_fusion(fusion)
    
    # --- PHASE 1: Frozen backbone ---
    model.compile(optimizer=keras.optimizers.Adam(LR),
                  loss="categorical_crossentropy", metrics=["accuracy"])
    
    p1_cb = [
        keras.callbacks.ModelCheckpoint(f"{CHECKPOINT_DIR}/best_{fusion}_p1.keras",
            monitor="val_accuracy", save_best_only=True, verbose=1),
        keras.callbacks.EarlyStopping(monitor="val_loss", patience=5, restore_best_weights=True),
        keras.callbacks.CSVLogger(f"{CHECKPOINT_DIR}/{fusion}_p1.csv"),
        keras.callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=2, min_lr=1e-7, verbose=1),
    ]
    
    print("\n--- Phase 1: Frozen Backbone (10 epochs) ---")
    start = time.time()
    h1 = model.fit(train_ds, validation_data=val_ds, epochs=10,
                   callbacks=p1_cb, class_weight=class_weights, verbose=1)
    
    # --- PHASE 2: Unfreeze + fine-tune ---
    print("\n--- Phase 2: Fine-tuning Full Model ---")
    feat_model.trainable = True
    model.compile(optimizer=keras.optimizers.Adam(LR / 10),
                  loss="categorical_crossentropy", metrics=["accuracy"])
    
    p2_cb = [
        keras.callbacks.ModelCheckpoint(f"{CHECKPOINT_DIR}/best_{fusion}_p2.keras",
            monitor="val_accuracy", save_best_only=True, verbose=1),
        keras.callbacks.ModelCheckpoint(f"{CHECKPOINT_DIR}/epoch_{{epoch:02d}}_{fusion}.keras",
            save_freq="epoch"),  # Every epoch for crash recovery
        keras.callbacks.EarlyStopping(monitor="val_loss", patience=7, restore_best_weights=True),
        keras.callbacks.CSVLogger(f"{CHECKPOINT_DIR}/{fusion}_p2.csv"),
        keras.callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=3, min_lr=1e-7, verbose=1),
    ]
    
    p1_epochs = len(h1.history['loss'])
    h2 = model.fit(train_ds, validation_data=val_ds, epochs=EPOCHS,
                   initial_epoch=p1_epochs, callbacks=p2_cb,
                   class_weight=class_weights, verbose=1)
    train_time = time.time() - start
    
    # --- EVALUATE ---
    model.load_weights(f"{CHECKPOINT_DIR}/best_{fusion}_p2.keras")
    y_true, y_pred, y_prob = [], [], []
    for imgs, lbls in test_ds:
        preds = model.predict(imgs, verbose=0)
        y_true.extend(np.argmax(lbls, axis=1))
        y_pred.extend(np.argmax(preds, axis=1))
        y_prob.extend(preds[:, 0])
    
    acc = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred)
    rec = recall_score(y_true, y_pred)
    f1 = f1_score(y_true, y_pred)
    auc = roc_auc_score(y_true, y_prob)
    
    print(f"\n{fusion} Results: Acc={acc:.4f} Prec={prec:.4f} Rec={rec:.4f} F1={f1:.4f} AUC={auc:.4f}")
    print(classification_report(y_true, y_pred, target_names=["ALL", "HEM"]))
    
    # --- PLOTS ---
    # Confusion Matrix
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=["ALL", "HEM"], yticklabels=["ALL", "HEM"])
    plt.title(f"Confusion Matrix - {fusion}"); plt.ylabel("True"); plt.xlabel("Predicted")
    plt.tight_layout(); plt.savefig(f"plots/cm_{fusion}.png", dpi=150); plt.close()
    
    # ROC Curve
    fpr, tpr, _ = roc_curve(y_true, y_prob)
    plt.figure(figsize=(6, 5))
    plt.plot(fpr, tpr, label=f"AUC={auc:.3f}", linewidth=2)
    plt.plot([0, 1], [0, 1], '--', color='gray')
    plt.title(f"ROC - {fusion}"); plt.xlabel("FPR"); plt.ylabel("TPR")
    plt.legend(); plt.tight_layout(); plt.savefig(f"plots/roc_{fusion}.png", dpi=150); plt.close()
    
    # Training Curves
    all_acc = h1.history['accuracy'] + h2.history['accuracy']
    all_val = h1.history['val_accuracy'] + h2.history['val_accuracy']
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))
    ax1.plot(all_acc, label='Train'); ax1.plot(all_val, label='Val')
    ax1.axvline(x=p1_epochs-1, color='red', ls='--', label='Unfreeze')
    ax1.set_title(f'{fusion} Accuracy'); ax1.legend()
    all_loss = h1.history['loss'] + h2.history['loss']
    all_vloss = h1.history['val_loss'] + h2.history['val_loss']
    ax2.plot(all_loss, label='Train'); ax2.plot(all_vloss, label='Val')
    ax2.axvline(x=p1_epochs-1, color='red', ls='--', label='Unfreeze')
    ax2.set_title(f'{fusion} Loss'); ax2.legend()
    plt.tight_layout(); plt.savefig(f"plots/curves_{fusion}.png", dpi=150); plt.close()
    
    if acc > best_acc:
        best_acc = acc
        best_model_name = fusion
        model.save("Best_QuantumFusion_Model.keras")
        print(f"NEW BEST: {fusion} ({acc:.4f})")

    RESULTS.append({"Fusion": fusion, "Accuracy": acc, "Precision": prec,
                     "Recall": rec, "F1": f1, "AUC": auc, "Time(s)": train_time})
    pd.DataFrame(RESULTS).to_csv("fusion_results.csv", index=False)
    del model; gc.collect()

# ============================================================
# CELL 7: Final Comparison
# ============================================================
df = pd.DataFrame(RESULTS)
print("\nFINAL COMPARISON:")
print(df.to_string(index=False))

fig, axes = plt.subplots(1, 5, figsize=(20, 5))
for i, m in enumerate(['Accuracy', 'Precision', 'Recall', 'F1', 'AUC']):
    colors = ['#00F5D4' if v == df[m].max() else '#3A86FF' for v in df[m]]
    axes[i].bar(df['Fusion'], df[m], color=colors)
    axes[i].set_title(m, fontweight='bold'); axes[i].set_ylim(0.7, 1.0)
    axes[i].tick_params(axis='x', rotation=45)
plt.suptitle("Quantum Fusion Comparison", fontsize=16, fontweight='bold', y=1.02)
plt.tight_layout(); plt.savefig("plots/final_comparison.png", dpi=200, bbox_inches='tight'); plt.close()
print(f"\nBest: {best_model_name} (Acc={best_acc:.4f})")

# ============================================================
# CELL 8: Export to TFLite
# ============================================================
model = tf.keras.models.load_model("Best_QuantumFusion_Model.keras", custom_objects=custom_objects)

converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
converter.target_spec.supported_types = [tf.float16]
tflite_model = converter.convert()
with open("leukemia_detector.tflite", "wb") as f:
    f.write(tflite_model)

print(f"Keras: {os.path.getsize('Best_QuantumFusion_Model.keras')/1e6:.1f} MB")
print(f"TFLite: {os.path.getsize('leukemia_detector.tflite')/1e6:.1f} MB")

# ============================================================
# CELL 9: Batch Predict Test Images -> JSON for Frontend
# ============================================================
X_test_paths, y_test_labels = test_info
test_results = []

for i, (path, true_label) in enumerate(zip(X_test_paths, y_test_labels)):
    img = tf.io.read_file(path)
    img = tf.image.decode_image(img, channels=3)
    img.set_shape([None, None, 3])
    img = tf.image.resize(img, IMG_SIZE)
    img = tf.cast(img, tf.float32) / 255.0
    img = tf.expand_dims(img, 0)
    preds = model.predict(img, verbose=0)[0]
    ci = np.argmax(preds)
    test_results.append({
        "id": f"CELL-{i+1:03d}",
        "filename": os.path.basename(path),
        "prediction": "ALL (Leukemia Blast)" if ci == 0 else "HEM (Normal Cell)",
        "confidence": float(np.max(preds) * 100),
        "probabilities": {"ALL": float(preds[0]), "HEM": float(preds[1])},
        "true_label": "ALL" if true_label == 0 else "HEM",
        "correct": bool(ci == true_label),
    })

best_result = next(r for r in RESULTS if r["Fusion"] == best_model_name)
output = {
    "model": best_model_name,
    "total_predictions": len(test_results),
    "accuracy": sum(r["correct"] for r in test_results) / len(test_results),
    "predictions": test_results,
    "metrics": {
        "accuracy": best_result["Accuracy"],
        "precision": best_result["Precision"],
        "recall": best_result["Recall"],
        "f1": best_result["F1"],
        "auc": best_result["AUC"],
    }
}
with open("predictions.json", "w") as f:
    json.dump(output, f, indent=2)
print(f"Saved {len(test_results)} predictions to predictions.json")

# ============================================================
# CELL 10: Model Summary & Architecture Diagram
# ============================================================
model.summary()
print("\n=== FILES TO DOWNLOAD ===")
print("1. Best_QuantumFusion_Model.keras  (full model)")
print("2. leukemia_detector.tflite        (lightweight for deployment)")
print("3. predictions.json                (for frontend)")
print("4. fusion_results.csv              (comparison table)")
print("5. plots/ folder                   (all visualizations)")
print("6. checkpoints/ folder             (all checkpoints)")
