import { motion } from "framer-motion";

const steps = [
  { label: "Patient Info", icon: "🧑‍⚕️" },
  { label: "Upload", icon: "📤" },
  { label: "Analyzing", icon: "🧬" },
  { label: "Results", icon: "📊" },
];

export default function ProgressTracker({ currentStep }) {
  return (
    <div className="w-full max-w-3xl mx-auto mb-10">
      <div className="flex items-center justify-between relative">
        {/* Progress line background */}
        <div className="absolute top-5 left-[12%] right-[12%] h-[2px] bg-[rgba(255,255,255,0.08)] z-0" />

        {/* Progress line fill */}
        <motion.div
          className="absolute top-5 left-[12%] h-[2px] z-[1]"
          style={{
            background: "linear-gradient(90deg, #00F5D4, #3A86FF)",
            boxShadow: "0 0 10px rgba(0,245,212,0.4)",
          }}
          initial={{ width: "0%" }}
          animate={{
            width: `${(currentStep / (steps.length - 1)) * 76}%`,
          }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        />

        {steps.map((step, i) => {
          const isCompleted = i < currentStep;
          const isActive = i === currentStep;

          return (
            <div key={i} className="relative z-10 flex flex-col items-center" style={{ width: "25%" }}>
              {/* Step circle */}
              <motion.div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold relative ${
                  isCompleted
                    ? "bg-gradient-to-br from-[#00F5D4] to-[#3A86FF] text-black"
                    : isActive
                    ? "bg-[rgba(0,245,212,0.15)] text-[#00F5D4] border-2 border-[#00F5D4]"
                    : "bg-[rgba(255,255,255,0.05)] text-gray-500 border border-[rgba(255,255,255,0.1)]"
                }`}
                animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                transition={isActive ? { duration: 2, repeat: Infinity } : {}}
              >
                {isCompleted ? "✓" : step.icon}
                {isActive && (
                  <div
                    className="absolute inset-0 rounded-full border-2 border-[#00F5D4]"
                    style={{ animation: "pulse-ring 2s infinite" }}
                  />
                )}
              </motion.div>

              {/* Label */}
              <p className={`mt-2 text-xs font-medium ${
                isCompleted ? "text-[#00F5D4]"
                : isActive ? "text-white"
                : "text-gray-500"
              }`}>
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
