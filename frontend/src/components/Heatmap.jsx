import { motion } from "framer-motion";
import { useState } from "react";
import { getGradCAM } from "../services/api";

export default function Heatmap({ heatmapData, files }) {
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [currentHeatmap, setCurrentHeatmap] = useState(heatmapData);

  // Update when parent passes new data
  if (heatmapData && !currentHeatmap) {
    setCurrentHeatmap(heatmapData);
  }

  const handleGenerateForCell = async (idx) => {
    if (!files?.[idx]) return;
    setSelectedIdx(idx);
    setLoading(true);
    try {
      const result = await getGradCAM(files[idx]);
      if (result) setCurrentHeatmap(result);
    } catch {
      // silently fail
    }
    setLoading(false);
  };

  const displayData = currentHeatmap || heatmapData;

  return (
    <motion.div
      className="glass card-3d rounded-2xl p-6 mt-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔬</span>
          <div>
            <h2 className="text-lg font-bold text-white">Model Attention Heatmap</h2>
            <p className="text-xs text-gray-500">
              {displayData
                ? "Gradient-weighted Class Activation Mapping (Grad-CAM) provides clinical explainability by highlighting the morphological features the AI used to make its prediction."
                : "Upload images and run analysis to generate attention maps"}
            </p>
          </div>
        </div>

        {/* Cell selector thumbnails */}
        {files && files.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 mr-1">Cell:</span>
            {files.slice(0, 6).map((file, i) => (
              <button
                key={i}
                onClick={() => handleGenerateForCell(i)}
                className={`w-8 h-8 rounded-lg overflow-hidden border-2 transition-all duration-300 flex-shrink-0 ${
                  selectedIdx === i && displayData
                    ? "border-[#00F5D4] shadow-[0_0_10px_rgba(0,245,212,0.3)]"
                    : "border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.3)]"
                }`}
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Cell ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
            {files.length > 6 && (
              <span className="text-xs text-gray-500">+{files.length - 6}</span>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl overflow-hidden border border-[rgba(255,255,255,0.08)] relative group">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-t-[#00F5D4] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
              <p className="text-sm text-gray-400">Generating attention map...</p>
            </div>
          </div>
        ) : displayData?.heatmap ? (
          <>
            <img
              src={`data:image/png;base64,${displayData.heatmap}`}
              alt="Grad-CAM model attention heatmap"
              className="w-full max-w-lg mx-auto block transition-transform duration-500 group-hover:scale-105"
            />
            {/* Overlay glow on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,245,212,0.1)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {/* Prediction overlay */}
            {displayData.prediction && (
              <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-2">
                <div className="glass rounded-lg p-2 text-[10px] text-gray-300 backdrop-blur-md">
                  <span className="font-bold text-white">How to read this:</span> Warm colors (red/yellow) indicate regions of high morphological importance for the model's decision. Cool colors (blue) were ignored.
                </div>
                <div className="glass rounded-lg px-4 py-2 flex items-center justify-between">
                  <span className={`text-sm font-bold ${
                    displayData.class === "ALL" ? "text-[#FF006E]" : "text-[#00FF88]"
                  }`}>
                    {displayData.prediction}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">
                    {displayData.confidence?.toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <p className="text-4xl mb-3 opacity-30">🔬</p>
              <p className="text-sm text-gray-500">
                {files?.length > 0
                  ? "Click a cell thumbnail above to generate its attention map"
                  : "Run an analysis first to visualize model attention regions"}
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
