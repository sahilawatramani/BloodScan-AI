import AnimatedCard from "./AnimatedCard";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

function AnimatedNumber({ value, duration = 1000 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = value / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <span>{display}</span>;
}

export default function PatientDashboard({ summary, patientInfo }) {
  const isPositive = summary.patientPrediction === "CANCER POSITIVE";
  const blastRatio = summary.total > 0 ? (summary.cancerCount / summary.total) * 100 : 0;

  const getRiskLevel = () => {
    if (blastRatio > 70) return { label: "CRITICAL", color: "#FF006E", bg: "badge-danger" };
    if (blastRatio > 40) return { label: "HIGH RISK", color: "#FF006E", bg: "badge-danger" };
    if (blastRatio > 20) return { label: "MODERATE", color: "#FFAA00", bg: "badge-warning" };
    return { label: "LOW RISK", color: "#00FF88", bg: "badge-success" };
  };
  const risk = getRiskLevel();

  return (
    <AnimatedCard>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[rgba(0,245,212,0.15)] to-[rgba(58,134,255,0.15)] flex items-center justify-center text-2xl border border-[rgba(0,245,212,0.2)]">
            🩺
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Patient Diagnosis</h2>
            {patientInfo?.name && (
              <p className="text-sm text-gray-400">{patientInfo.name} • {patientInfo.id}</p>
            )}
          </div>
        </div>
        <span className={`badge ${risk.bg}`}>{risk.label}</span>
      </div>

      {/* Diagnosis Result */}
      <div className="flex items-center gap-4 mb-6">
        <motion.p
          className={`text-3xl font-extrabold ${isPositive ? "text-[#FF006E]" : "text-[#00FF88]"}`}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {summary.patientPrediction}
        </motion.p>
      </div>

      {/* Ring Gauge */}
      <div className="flex items-center gap-8 mb-6">
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <motion.circle
              cx="50" cy="50" r="42" fill="none"
              stroke={isPositive ? "#FF006E" : "#00FF88"}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 42}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - blastRatio / 100) }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{ filter: `drop-shadow(0 0 8px ${isPositive ? "rgba(255,0,110,0.5)" : "rgba(0,255,136,0.5)"})` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className={`text-xl font-bold ${isPositive ? "text-[#FF006E]" : "text-[#00FF88]"}`}>
              {blastRatio.toFixed(0)}%
            </p>
            <p className="text-[10px] text-gray-500">BLAST</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 flex-1">
          <div className="text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Total Cells</p>
            <p className="text-3xl font-bold text-white">
              <AnimatedNumber value={summary.total} />
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Blast (ALL)</p>
            <p className="text-3xl font-bold text-[#FF006E]">
              <AnimatedNumber value={summary.cancerCount} />
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Normal (HEM)</p>
            <p className="text-3xl font-bold text-[#00FF88]">
              <AnimatedNumber value={summary.normalCount} />
            </p>
          </div>
        </div>
      </div>
    </AnimatedCard>
  );
}
