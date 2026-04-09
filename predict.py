import tensorflow as tf
import numpy as np
import os
import json

# ============================================================
# Custom Quantum Layers (required for model loading)
# ============================================================
class QuantumFeatureFusion(tf.keras.layers.Layer):
    def __init__(self, dim, **kwargs):
        super().__init__(**kwargs)
        self.dim = dim
        self.theta = tf.keras.layers.Dense(dim)
        self.amp = tf.keras.layers.Dense(dim)
    def build(self, input_shape):
        self.alpha = self.add_weight(name="alpha", shape=(1,),
            initializer=tf.keras.initializers.Constant(0.6), trainable=True, dtype=tf.float32)
    def call(self, x):
        phi = tf.sigmoid(self.theta(x)) * np.pi
        A = tf.sigmoid(self.amp(x))
        return x + self.alpha * (tf.cos(phi) * x * A + tf.sin(phi) * x * (1 - A))
    def get_config(self):
        return {**super().get_config(), "dim": self.dim}

class QuantumAttention(tf.keras.layers.Layer):
    def __init__(self, dim, **kwargs):
        super().__init__(**kwargs)
        self.dim = dim
        self.phase = tf.keras.layers.Dense(dim)
        self.amp = tf.keras.layers.Dense(dim)
    def build(self, input_shape):
        self.gamma = self.add_weight(name="gamma", shape=(1,),
            initializer=tf.keras.initializers.Constant(0.7), trainable=True, dtype=tf.float32)
    def call(self, x):
        theta = tf.sigmoid(self.phase(x)) * np.pi
        A = tf.sigmoid(self.amp(x))
        return x * (1 + self.gamma * (tf.cos(theta) * A + tf.sin(theta) * (1 - A)))
    def get_config(self):
        return {**super().get_config(), "dim": self.dim}

class QuantumEntanglement(tf.keras.layers.Layer):
    def __init__(self, dim, **kwargs):
        super().__init__(**kwargs)
        self.dim = dim
        self.W1 = tf.keras.layers.Dense(dim)
        self.W2 = tf.keras.layers.Dense(dim)
        self.W3 = tf.keras.layers.Dense(dim)
        self.out = tf.keras.layers.Dense(dim)
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
        return {**super().get_config(), "dim": self.dim}

class QuantumStateProjection(tf.keras.layers.Layer):
    def __init__(self, dim, **kwargs):
        super().__init__(**kwargs)
        self.dim = dim
        self.U = tf.keras.layers.Dense(dim, use_bias=False, kernel_initializer="orthogonal")
    def build(self, input_shape):
        self.gamma = self.add_weight(name="gamma", shape=(1,),
            initializer=tf.keras.initializers.Constant(0.5), trainable=True, dtype=tf.float32)
    def call(self, x):
        Ux = tf.nn.l2_normalize(self.U(x), axis=-1)
        proj = tf.matmul(Ux, self.U.kernel, transpose_b=True)
        return x + self.gamma * proj
    def get_config(self):
        return {**super().get_config(), "dim": self.dim}

class QuantumPhaseEncoding(tf.keras.layers.Layer):
    def __init__(self, dim, **kwargs):
        super().__init__(**kwargs)
        self.dim = dim
        self.phase = tf.keras.layers.Dense(dim)
    def build(self, input_shape):
        self.delta = self.add_weight(name="delta", shape=(1,),
            initializer=tf.keras.initializers.Constant(0.4), trainable=True, dtype=tf.float32)
    def call(self, x):
        phi = tf.sigmoid(self.phase(x)) * np.pi
        return x + self.delta * (tf.cos(phi) * x + tf.sin(phi) * x)
    def get_config(self):
        return {**super().get_config(), "dim": self.dim}

custom_objects = {
    "QuantumFeatureFusion": QuantumFeatureFusion,
    "QuantumAttention": QuantumAttention,
    "QuantumEntanglement": QuantumEntanglement,
    "QuantumStateProjection": QuantumStateProjection,
    "QuantumPhaseEncoding": QuantumPhaseEncoding,
}

# ============================================================
# Model Loading (supports .keras and legacy .h5)
# ============================================================
def load_trained_model(model_path="Best_QuantumFusion_Model.keras"):
    """Load trained model with custom quantum layers."""
    print(f"Loading model from {model_path}...")
    model = tf.keras.models.load_model(model_path, custom_objects=custom_objects, compile=False)
    print("Model loaded successfully!")
    return model


def predict_single_image(image_path, model, img_size=(224, 224)):
    """Predict a single image and return class + confidence."""
    if not os.path.exists(image_path):
        print(f"Error: Image not found at {image_path}")
        return None, None

    img = tf.io.read_file(image_path)
    img = tf.image.decode_image(img, channels=3)
    img = tf.image.resize(img, img_size)
    img = tf.cast(img, tf.float32) / 255.0
    img_array = tf.expand_dims(img, 0)

    predictions = model.predict(img_array, verbose=0)
    class_idx = np.argmax(predictions[0])
    confidence = np.max(predictions[0]) * 100
    class_names = ['ALL (Leukemia Blast)', 'HEM (Normal Cell)']
    predicted_class = class_names[class_idx]

    print(f"--- Prediction Results ---")
    print(f"Image: {os.path.basename(image_path)}")
    print(f"Prediction: {predicted_class}")
    print(f"Confidence: {confidence:.2f}%")
    print(f"Probabilities -> ALL: {predictions[0][0]:.4f}, HEM: {predictions[0][1]:.4f}")

    return predicted_class, confidence


def predict_batch_to_json(image_dir, model, output_path="predictions.json", img_size=(224, 224)):
    """Predict all images in a directory and save results as JSON."""
    results = []
    files = [f for f in os.listdir(image_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp'))]

    for i, fname in enumerate(files):
        path = os.path.join(image_dir, fname)
        img = tf.io.read_file(path)
        img = tf.image.decode_image(img, channels=3)
        img = tf.image.resize(img, img_size)
        img = tf.cast(img, tf.float32) / 255.0
        preds = model.predict(tf.expand_dims(img, 0), verbose=0)[0]
        ci = np.argmax(preds)

        results.append({
            "id": f"CELL-{i+1:03d}",
            "filename": fname,
            "prediction": "ALL (Leukemia Blast)" if ci == 0 else "HEM (Normal Cell)",
            "confidence": float(np.max(preds) * 100),
            "probabilities": {"ALL": float(preds[0]), "HEM": float(preds[1])},
        })

    cancer_count = sum(1 for r in results if "ALL" in r["prediction"])
    output = {
        "individual": results,
        "summary": {
            "total": len(results),
            "cancerCount": cancer_count,
            "normalCount": len(results) - cancer_count,
            "blastRatio": cancer_count / max(len(results), 1),
            "patientPrediction": "CANCER POSITIVE" if cancer_count / max(len(results), 1) > 0.5 else "CANCER NEGATIVE",
        },
    }

    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)
    print(f"Saved {len(results)} predictions to {output_path}")
    return output


if __name__ == "__main__":
    # Try .keras first, fall back to .h5
    for ext in [".keras", ".h5"]:
        model_path = f"Best_QuantumFusion_Model{ext}"
        if os.path.exists(model_path):
            model = load_trained_model(model_path)
            test_image = "path/to/your/test/image.jpg"
            if os.path.exists(test_image):
                predict_single_image(test_image, model)
            else:
                print(f"\nUpdate 'test_image' path to test a real image.")
            break
    else:
        print("No trained model found. Train the model first.")
