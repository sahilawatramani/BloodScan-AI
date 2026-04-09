import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Layout
import ParticleBackground from "./components/ParticleBackground";
import Navbar from "./components/Navbar";
import ProgressTracker from "./components/ProgressTracker";
import HistorySidebar from "./components/HistorySidebar";
import AboutModal from "./components/AboutModal";
import ToastContainer, { showToast } from "./components/Toast";

// Step components
import PatientForm from "./components/PatientForm";
import UploadPanel from "./components/UploadPanel";
import ImageGrid from "./components/ImageGrid";
import SkeletonLoader from "./components/SkeletonLoader";

// Result components
import PatientDashboard from "./components/PatientDashboard";
import Charts from "./components/Charts";
import MetricsPanel from "./components/MetricsPanel";
import ConfidenceSlider from "./components/ConfidenceSlider";
import PredictionList from "./components/PredictionList";
import Heatmap from "./components/Heatmap";
import ReportSummary from "./components/ReportSummary";

// API — Real backend with automatic demo fallback
import { predictBatch, checkHealth, getGradCAM, saveAnalysis, getHistory } from "./services/api";

const pageVariants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export default function App() {
  // Multi-step state: 0 = patient, 1 = upload, 2 = analyzing, 3 = results
  const [step, setStep] = useState(0);
  const [patientInfo, setPatientInfo] = useState({ name: "", id: "", age: "", date: "" });
  const [files, setFiles] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [threshold, setThreshold] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [historyData, setHistoryData] = useState([]);

  // Backend connection state
  const [backendStatus, setBackendStatus] = useState("checking"); // "checking" | "connected" | "disconnected"
  const [heatmapData, setHeatmapData] = useState(null);

  useEffect(() => {
    const check = async () => {
      const { connected } = await checkHealth();
      setBackendStatus(connected ? "connected" : "disconnected");
      if (connected) loadHistory();
    };
    check();
    const interval = setInterval(check, 30000); // Re-check every 30s
    return () => clearInterval(interval);
  }, []);

  const loadHistory = async () => {
    const data = await getHistory();
    setHistoryData(data);
  };

  const handleRestoreHistory = (historyItem) => {
    try {
      if (historyItem.full_data_json) {
        const parsed = JSON.parse(historyItem.full_data_json);
        setPatientInfo(parsed.patientInfo || { name: historyItem.patient_name, id: historyItem.patient_id, age: historyItem.patient_age, date: historyItem.patient_date });
        setData(parsed);
        // Clear files since we can't restore File objects trivially, and skip heatmaps for now unless we reconstruct simulated blobs
        setFiles([]); 
        setHeatmapData(null);
        setStep(3);
        setHistoryOpen(false);
        showToast(`Dashboard restored for ${historyItem.patient_name || "Patient"}`, "info");
      }
    } catch {
      showToast("Could not restore data for this analysis.", "error");
    }
  };

  const handleUpload = useCallback((f) => {
    setFiles(f);
    setData(null);
    setHeatmapData(null);
    showToast(`${f.length} image${f.length > 1 ? "s" : ""} uploaded successfully`, "success");
  }, []);

  const handlePredict = useCallback(async () => {
    setStep(2);
    setLoading(true);
    setProgress(0);
    setHeatmapData(null);
    try {
      const res = await predictBatch(files, setProgress);
      setData(res);
      setStep(3);

      const sourceLabel = res.source === "live" ? "" : " (Demo Mode)";
      showToast(
        `Analysis complete — ${res.summary.patientPrediction}${sourceLabel}`,
        res.summary.patientPrediction === "CANCER POSITIVE" ? "warning" : "success"
      );

      // Save to database if live
      if (res.source === "live") {
        saveAnalysis(patientInfo, res).then(() => loadHistory());
      }

      // Generate Grad-CAM for the first image (async, non-blocking)
      if (files.length > 0 && res.source === "live") {
        getGradCAM(files[0]).then((cam) => {
          if (cam) setHeatmapData(cam);
        });
      }
    } catch (err) {
      showToast(err.message || "Analysis failed. Please try again.", "error");
      setStep(1);
    }
    setLoading(false);
  }, [files]);

  const handleReset = () => {
    setStep(0);
    setFiles([]);
    setData(null);
    setHeatmapData(null);
    setPatientInfo({ name: "", id: "", age: "", date: "" });
    setThreshold(0);
  };

  return (
    <div className="relative min-h-screen">
      {/* Background layers */}
      <div className="app-bg" />
      <ParticleBackground />

      {/* Fixed UI */}
      <Navbar 
        backendStatus={backendStatus} 
        onOpenHistory={() => setHistoryOpen(true)}
        onOpenAbout={() => setAboutOpen(true)}
      />
      <ToastContainer />
      <HistorySidebar 
        isOpen={historyOpen} 
        onToggle={() => setHistoryOpen(!historyOpen)} 
        historyData={historyData}
        onRestoreHistory={handleRestoreHistory}
      />
      <AboutModal isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />

      {/* Main content */}
      <main className="relative z-10 pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto">
        {/* Progress Tracker */}
        <ProgressTracker currentStep={step} />

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-[#00F5D4] via-[#3A86FF] to-[#FF006E] bg-clip-text text-transparent animate-gradient pb-1">
            BloodScan AI
          </h1>
          <p className="text-gray-400 mt-2 text-lg max-w-xl mx-auto">
            Advanced Deep Learning System for Acute Lymphoblastic Leukemia Detection
          </p>
        </motion.div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          {/* Step 0: Patient Info */}
          {step === 0 && (
            <motion.div key="patient" {...pageVariants} transition={{ duration: 0.4 }}>
              <PatientForm
                patientInfo={patientInfo}
                setPatientInfo={setPatientInfo}
                onNext={() => {
                  setStep(1);
                  showToast("Patient information saved", "info");
                }}
              />
            </motion.div>
          )}

          {/* Step 1: Upload */}
          {step === 1 && (
            <motion.div key="upload" {...pageVariants} transition={{ duration: 0.4 }}>
              <div className="max-w-3xl mx-auto">
                <UploadPanel onUpload={handleUpload} fileCount={files.length} />

                {files.length > 0 && <ImageGrid files={files} />}

                <div className="flex items-center justify-between mt-8">
                  <button
                    onClick={() => setStep(0)}
                    className="btn-secondary"
                  >
                    ← Back
                  </button>

                  {files.length > 0 && (
                    <motion.button
                      onClick={handlePredict}
                      className="btn-primary"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      🧬 Run AI Analysis
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Analyzing */}
          {step === 2 && (
            <motion.div key="analyzing" {...pageVariants} transition={{ duration: 0.4 }}>
              <div className="max-w-2xl mx-auto text-center">
                <div className="glass card-3d rounded-2xl p-10">
                  {/* Animated spinner */}
                  <div className="relative w-24 h-24 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full border-2 border-[rgba(0,245,212,0.1)]" />
                    <div className="absolute inset-0 rounded-full border-2 border-t-[#00F5D4] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                    <div className="absolute inset-2 rounded-full border-2 border-t-transparent border-r-[#3A86FF] border-b-transparent border-l-transparent animate-spin"
                      style={{ animationDuration: "1.5s", animationDirection: "reverse" }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl">🧬</span>
                    </div>
                  </div>

                  <h2 className="text-xl font-bold text-white mb-2">Analyzing Blood Cells</h2>
                  <p className="text-gray-400 text-sm mb-1">
                    Processing {files.length} cell {files.length === 1 ? "image" : "images"} through QuantumFusion neural network
                  </p>
                  <p className="text-gray-600 text-xs mb-6">
                    {backendStatus === "connected" ? "🟢 Live inference via GPU backend" : "🟡 Running in demo mode"}
                  </p>

                  {/* Progress bar */}
                  <div className="w-full bg-[rgba(255,255,255,0.06)] rounded-full h-3 overflow-hidden mb-2">
                    <motion.div
                      className="h-3 rounded-full"
                      style={{
                        background: "linear-gradient(90deg, #00F5D4, #3A86FF)",
                        boxShadow: "0 0 15px rgba(0,245,212,0.5)",
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-sm text-[#00F5D4] font-mono">{Math.round(progress)}%</p>
                </div>

                <div className="mt-8">
                  <SkeletonLoader />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Results */}
          {step === 3 && data && (
            <motion.div key="results" {...pageVariants} transition={{ duration: 0.4 }}>
              <div className="space-y-6">
                {/* Source indicator */}
                {data.source === "demo" && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                  >
                    <span className="badge badge-warning text-xs">
                      ⚡ Demo Mode — Start the backend for real AI predictions
                    </span>
                  </motion.div>
                )}

                <PatientDashboard summary={data.summary} patientInfo={patientInfo} />
                <Charts summary={data.summary} results={data.individual} />
                <MetricsPanel metrics={data.metrics} />

                {/* Performance stats (only for live mode) */}
                {data.performance && data.source === "live" && (
                  <motion.div
                    className="glass rounded-2xl p-4 flex items-center justify-center gap-8 text-xs text-gray-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <span>⚡ Total: {data.performance.total_inference_ms?.toFixed(0)}ms</span>
                    <span>📊 Avg: {data.performance.avg_inference_ms?.toFixed(0)}ms/image</span>
                    <span>🖼️ {data.performance.images_processed} images processed</span>
                  </motion.div>
                )}

                <ConfidenceSlider value={threshold} onChange={setThreshold} />
                <PredictionList
                  results={data.individual}
                  files={files}
                  threshold={threshold}
                />
                <Heatmap heatmapData={heatmapData} files={files} />
                <ReportSummary
                  summary={data.summary}
                  metrics={data.metrics}
                  patientInfo={patientInfo}
                  results={data.individual}
                />

                {/* Reset button */}
                <div className="flex justify-center pt-4 pb-8">
                  <motion.button
                    onClick={handleReset}
                    className="btn-secondary"
                    whileHover={{ scale: 1.03 }}
                  >
                    🔄 New Analysis
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 border-t border-[rgba(255,255,255,0.05)]">
        <p className="text-xs text-gray-600">
          BloodScan AI v2.0 • Quantum-Enhanced Feature Fusion • For Research & Clinical Reference Only • © 2026
        </p>
      </footer>
    </div>
  );
}
