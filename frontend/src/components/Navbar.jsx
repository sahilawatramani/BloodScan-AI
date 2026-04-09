import { motion } from "framer-motion";

const statusConfig = {
  connected: {
    color: "#00FF88",
    shadow: "0 0 8px rgba(0,255,136,0.6)",
    label: "Backend Online",
  },
  disconnected: {
    color: "#FF006E",
    shadow: "0 0 8px rgba(255,0,110,0.6)",
    label: "Demo Mode",
  },
  checking: {
    color: "#FFAA00",
    shadow: "0 0 8px rgba(255,170,0,0.6)",
    label: "Connecting...",
  },
};

export default function Navbar({ backendStatus = "checking", onOpenHistory, onOpenAbout }) {
  const status = statusConfig[backendStatus] || statusConfig.checking;

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 glass-strong"
    >
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10">
            {/* DNA Helix Icon */}
            <svg viewBox="0 0 40 40" className="w-10 h-10">
              <defs>
                <linearGradient id="dna-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00F5D4" />
                  <stop offset="100%" stopColor="#FF006E" />
                </linearGradient>
              </defs>
              <path
                d="M12 5 Q20 12 28 10 Q20 18 12 16 Q20 24 28 22 Q20 30 12 28 Q20 36 28 34"
                stroke="url(#dna-grad)" strokeWidth="2.5" fill="none" strokeLinecap="round"
              />
              <path
                d="M28 5 Q20 12 12 10 Q20 18 28 16 Q20 24 12 22 Q20 30 28 28 Q20 36 12 34"
                stroke="url(#dna-grad)" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.5"
              />
              {/* Connecting bars */}
              {[10, 16, 22, 28].map((y, i) => (
                <line key={i} x1="14" y1={y} x2="26" y2={y}
                  stroke="rgba(0,245,212,0.3)" strokeWidth="1.5" />
              ))}
            </svg>
            {/* Pulse ring */}
            <div className="absolute inset-0 rounded-full border border-[#00F5D4] opacity-30"
              style={{ animation: "pulse-ring 3s infinite" }} />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-[#00F5D4] to-[#3A86FF] bg-clip-text text-transparent leading-tight">
              BloodScan AI
            </h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-[3px]">
              Leukemia Detection
            </p>
          </div>
        </div>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          <button className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 bg-[rgba(0,245,212,0.1)] text-[#00F5D4] shadow-[0_0_15px_rgba(0,245,212,0.1)]">
            <span className="mr-1.5">⬡</span> Dashboard
          </button>
          <button 
            onClick={onOpenHistory}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.05)]"
          >
            <span className="mr-1.5">◷</span> History
          </button>
          <button 
            onClick={onOpenAbout}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.05)]"
          >
            <span className="mr-1.5">◈</span> About
          </button>
        </div>
      </div>

      {/* Bottom glow line */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-[#00F5D4] to-transparent opacity-30" />
    </motion.nav>
  );
}
