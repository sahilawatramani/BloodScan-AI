import { motion } from "framer-motion";

export default function ConfidenceSlider({ value, onChange }) {
  return (
    <motion.div
      className="glass rounded-2xl p-6 mt-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎚️</span>
          <h3 className="text-sm font-semibold text-white">Confidence Threshold</h3>
        </div>
        <span className="text-sm font-mono text-[#00F5D4] bg-[rgba(0,245,212,0.1)] px-3 py-1 rounded-lg">
          {value}%
        </span>
      </div>

      <div className="relative">
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #00F5D4 0%, #3A86FF ${value}%, rgba(255,255,255,0.1) ${value}%)`,
          }}
        />
      </div>

      <div className="flex justify-between mt-2 text-[10px] text-gray-500 uppercase tracking-wider">
        <span>Low Confidence</span>
        <span>High Confidence</span>
      </div>

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #00F5D4, #3A86FF);
          border: 3px solid rgba(0,0,0,0.4);
          cursor: pointer;
          box-shadow: 0 0 15px rgba(0,245,212,0.5);
          transition: box-shadow 0.2s;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          box-shadow: 0 0 25px rgba(0,245,212,0.8);
        }
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #00F5D4, #3A86FF);
          border: 3px solid rgba(0,0,0,0.4);
          cursor: pointer;
          box-shadow: 0 0 15px rgba(0,245,212,0.5);
        }
      `}</style>
    </motion.div>
  );
}
