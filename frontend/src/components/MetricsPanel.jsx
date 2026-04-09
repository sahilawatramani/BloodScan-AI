import { motion } from "framer-motion";

export default function MetricsPanel({ metrics }) {
  const metricConfig = {
    accuracy: { label: "Accuracy", icon: "🎯", color: "#3A86FF" },
    precision: { label: "Precision", icon: "🔬", color: "#00F5D4" },
    recall: { label: "Recall", icon: "📡", color: "#FF006E" },
    f1: { label: "F1 Score", icon: "⚡", color: "#FFAA00" },
  };

  return (
    <div className="mt-6">
      <h2 className="text-lg font-bold text-white mb-1">Model Performance</h2>
      <p className="text-xs text-gray-500 mb-4">Evaluation metrics on test set</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(metrics).map(([k, v], i) => {
          const config = metricConfig[k] || { label: k, icon: "📊", color: "#3A86FF" };
          const percentage = v * 100;

          return (
            <motion.div
              key={k}
              className="glass card-3d rounded-2xl p-5 text-center relative overflow-hidden group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              {/* Background ring */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 opacity-10">
                <svg viewBox="0 0 100 100" className="-rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke={config.color} strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - v)}`}
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <span className="text-xl mb-2 block">{config.icon}</span>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2 relative z-10">
                {config.label}
              </p>
              <motion.p
                className="text-3xl font-extrabold relative z-10"
                style={{ color: config.color }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1, type: "spring" }}
              >
                {percentage.toFixed(1)}%
              </motion.p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
