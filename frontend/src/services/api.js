// ============================================================
// BloodScan AI — Unified API Service
// ============================================================
// Connects to the FastAPI backend for real-time predictions.
// Falls back to demo mode if backend is unreachable.
// ============================================================

const RAW_API_URL = import.meta.env.VITE_API_URL || "/api";
// Remove trailing slash if present to prevent malformed URLs like "https://api.com//health"
const API_BASE = RAW_API_URL.endsWith('/') ? RAW_API_URL.slice(0, -1) : RAW_API_URL;

/**
 * Check if the backend is reachable and healthy.
 * @returns {{ connected: boolean, data: object|null }}
 */
export const checkHealth = async () => {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return { connected: false, data: null };
    const data = await res.json();
    return { connected: data.model_loaded === true, data };
  } catch {
    return { connected: false, data: null };
  }
};

/**
 * Save an analysis to the backend history database.
 */
export const saveAnalysis = async (patientInfo, data) => {
  try {
    const res = await fetch(`${API_BASE}/history`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientInfo, ...data }),
    });
    if (!res.ok) return false;
    return await res.json();
  } catch {
    return false;
  }
};

/**
 * Fetch past analyses history from the backend.
 */
export const getHistory = async () => {
  try {
    const res = await fetch(`${API_BASE}/history`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.history || [];
  } catch {
    return [];
  }
};

/**
 * Fetch model architecture info and training metrics.
 */
export const getModelInfo = async () => {
  try {
    const res = await fetch(`${API_BASE}/model-info`);
    if (!res.ok) throw new Error("Failed to fetch model info");
    return await res.json();
  } catch {
    return null;
  }
};

/**
 * Send multiple images to the backend for batch prediction.
 * @param {File[]} files - Array of image File objects
 * @param {function} onProgress - Progress callback (0-100)
 * @returns {object} { individual, summary, metrics, performance }
 */
export const predictBatch = async (files, onProgress) => {
  // Step 1: Check backend availability
  const { connected } = await checkHealth();

  if (!connected) {
    console.warn("Backend unreachable — falling back to demo mode");
    return demoFallback(files, onProgress);
  }

  // Step 2: Upload files via real API
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  // Simulate progress during upload (0 → 60%)
  let progressValue = 0;
  const progressInterval = setInterval(() => {
    progressValue = Math.min(progressValue + 3, 60);
    onProgress?.(progressValue);
  }, 100);

  try {
    const res = await fetch(`${API_BASE}/predict/batch`, {
      method: "POST",
      body: formData,
    });

    clearInterval(progressInterval);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Unknown error" }));
      throw new Error(err.detail || `Server error: ${res.status}`);
    }

    // Progress: upload done → processing complete (60% → 100%)
    onProgress?.(80);
    const data = await res.json();
    onProgress?.(100);

    return {
      individual: data.individual.map((r) => ({
        ...r,
        timestamp: r.timestamp || new Date().toISOString(),
      })),
      summary: data.summary,
      metrics: data.metrics,
      performance: data.performance,
      timestamp: data.timestamp,
      source: "live",
    };
  } catch (err) {
    clearInterval(progressInterval);
    console.error("Batch prediction failed:", err);
    throw err;
  }
};

/**
 * Generate Grad-CAM heatmap for a single image.
 * @param {File} file - Image file
 * @returns {{ heatmap: string, prediction: string, confidence: number } | null}
 */
export const getGradCAM = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/gradcam`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

/**
 * Predict a single image.
 * @param {File} file - Image file
 * @returns {object} Prediction result
 */
export const predictSingle = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Prediction failed" }));
    throw new Error(err.detail);
  }

  return await res.json();
};

// ============================================================
// Demo Fallback (offline / no backend)
// ============================================================
const demoFallback = async (files, onProgress) => {
  const totalTime = 3000;
  const steps = 20;
  let current = 0;

  // Simulate processing animation
  await new Promise((resolve) => {
    const interval = setInterval(() => {
      current++;
      onProgress?.(Math.min((current / steps) * 100, 95));
      if (current >= steps) {
        clearInterval(interval);
        resolve();
      }
    }, totalTime / steps);
  });

  onProgress?.(100);

  // Generate realistic-looking demo predictions
  const individual = files.map((file, i) => {
    const isCancer = Math.random() > 0.45;
    const dominantProb = 0.7 + Math.random() * 0.28;
    const allProb = isCancer ? dominantProb : 1 - dominantProb;
    const hemProb = 1 - allProb;

    return {
      id: `CELL-${String(i + 1).padStart(3, "0")}`,
      filename: file.name,
      prediction: isCancer ? "ALL (Leukemia Blast)" : "HEM (Normal Cell)",
      class: isCancer ? "ALL" : "HEM",
      confidence: Math.max(allProb, hemProb) * 100,
      probabilities: { ALL: allProb, HEM: hemProb },
      inference_time_ms: 15 + Math.random() * 30,
      timestamp: new Date().toISOString(),
    };
  });

  const cancerCount = individual.filter((r) => r.class === "ALL").length;
  const blastRatio = cancerCount / individual.length;

  return {
    individual,
    summary: {
      total: individual.length,
      cancerCount,
      normalCount: individual.length - cancerCount,
      blastRatio,
      avgConfidence:
        individual.reduce((sum, r) => sum + r.confidence, 0) / individual.length,
      patientPrediction:
        blastRatio > 0.5 ? "CANCER POSITIVE" : "CANCER NEGATIVE",
      riskLevel:
        blastRatio > 0.7
          ? "CRITICAL"
          : blastRatio > 0.4
          ? "HIGH"
          : blastRatio > 0.2
          ? "MODERATE"
          : "LOW",
    },
    metrics: {
      accuracy: 0.94,
      precision: 0.9155,
      recall: 0.8939,
      f1: 0.9046,
    },
    performance: {
      total_inference_ms: individual.reduce(
        (sum, r) => sum + r.inference_time_ms,
        0
      ),
      avg_inference_ms: 25,
      images_processed: individual.length,
    },
    timestamp: new Date().toISOString(),
    source: "demo",
  };
};
