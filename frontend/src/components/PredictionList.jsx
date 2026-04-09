import AnimatedCard from "./AnimatedCard";
import { motion } from "framer-motion";

export default function PredictionList({ results, files, threshold = 0 }) {
  const filtered = results.filter(r => r.confidence >= threshold);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white">Individual Cell Analysis</h2>
          <p className="text-xs text-gray-500">
            Showing {filtered.length} of {results.length} cells
            {threshold > 0 && ` (≥${threshold}% confidence)`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((r, i) => {
          const isCancer = r.prediction.includes("ALL");
          const file = files?.[i];

          return (
            <AnimatedCard key={i} delay={i * 0.05}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {/* Thumbnail */}
                  {file && (
                    <div className="w-14 h-14 rounded-lg overflow-hidden border border-[rgba(255,255,255,0.1)] flex-shrink-0">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Cell ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-300">Cell {i + 1}</p>
                    <p className={`text-base font-bold ${isCancer ? "text-[#FF006E]" : "text-[#00FF88]"}`}>
                      {r.prediction}
                    </p>
                  </div>
                </div>
                <span className={`badge text-[10px] ${isCancer ? "badge-danger" : "badge-success"}`}>
                  {isCancer ? "BLAST" : "NORMAL"}
                </span>
              </div>

              {/* Confidence bar */}
              <div className="mt-3">
                <div className="flex justify-between text-[11px] text-gray-400 mb-1.5">
                  <span>Confidence</span>
                  <span className="font-mono">{r.confidence.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-[rgba(255,255,255,0.06)] rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-2 rounded-full"
                    style={{
                      background: isCancer
                        ? "linear-gradient(90deg, #FF006E, #FF4D6D)"
                        : "linear-gradient(90deg, #00FF88, #00F5D4)",
                      boxShadow: isCancer
                        ? "0 0 10px rgba(255,0,110,0.4)"
                        : "0 0 10px rgba(0,255,136,0.4)",
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${r.confidence}%` }}
                    transition={{ duration: 1, delay: i * 0.05, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Probability breakdown */}
              <div className="mt-3 flex gap-4 text-[11px]">
                <div>
                  <span className="text-gray-500">ALL: </span>
                  <span className="text-[#FF006E] font-mono">
                    {(r.probabilities.ALL * 100).toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">HEM: </span>
                  <span className="text-[#00FF88] font-mono">
                    {(r.probabilities.HEM * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </AnimatedCard>
          );
        })}
      </div>
    </div>
  );
}
