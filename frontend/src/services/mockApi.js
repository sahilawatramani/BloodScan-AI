const randomPrediction = (index) => {
  const isCancer = Math.random() > 0.5;
  const allProb = Math.random() * 0.5 + (isCancer ? 0.5 : 0);
  const hemProb = 1 - allProb;

  return {
    id: `CELL-${String(index + 1).padStart(3, "0")}`,
    prediction: isCancer ? "ALL (Leukemia Blast)" : "HEM (Normal Cell)",
    confidence: Math.max(allProb, hemProb) * 100,
    probabilities: { ALL: allProb, HEM: hemProb },
    timestamp: new Date().toISOString(),
  };
};

export const predictBatch = async (files, onProgress) => {
  return new Promise((resolve) => {
    const totalTime = 3000;
    const steps = 10;
    let current = 0;

    const progressInterval = setInterval(() => {
      current++;
      onProgress?.(Math.min((current / steps) * 100, 95));
      if (current >= steps) clearInterval(progressInterval);
    }, totalTime / steps);

    setTimeout(() => {
      clearInterval(progressInterval);
      onProgress?.(100);

      const results = files.map((_, i) => randomPrediction(i));
      const cancerCount = results.filter(r => r.prediction.includes("ALL")).length;
      const blastRatio = cancerCount / results.length;

      resolve({
        individual: results,
        summary: {
          total: results.length,
          cancerCount,
          normalCount: results.length - cancerCount,
          blastRatio,
          patientPrediction: blastRatio > 0.5 ? "CANCER POSITIVE" : "CANCER NEGATIVE",
          riskLevel:
            blastRatio > 0.7 ? "CRITICAL" :
            blastRatio > 0.4 ? "HIGH" :
            blastRatio > 0.2 ? "MODERATE" : "LOW",
        },
        metrics: {
          accuracy: 0.94,
          precision: 0.92,
          recall: 0.95,
          f1: 0.93,
        },
        timestamp: new Date().toISOString(),
      });
    }, totalTime);
  });
};
