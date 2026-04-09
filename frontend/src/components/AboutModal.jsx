import { motion, AnimatePresence } from "framer-motion";

export default function AboutModal({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl glass-strong border border-[rgba(0,245,212,0.3)] rounded-2xl p-8 overflow-hidden"
          >
            {/* Decorative background glow */}
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#3A86FF] rounded-full blur-[100px] opacity-20 pointer-events-none" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#00F5D4] rounded-full blur-[100px] opacity-20 pointer-events-none" />

            {/* Header */}
            <div className="flex justify-between items-start mb-6 border-b border-[rgba(255,255,255,0.1)] pb-4">
              <div>
                <h2 className="text-3xl font-extrabold bg-gradient-to-r from-[#00F5D4] to-[#3A86FF] bg-clip-text text-transparent">
                  BloodScan AI
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  Quantum-Enhanced Feature Fusion for Leukemia Detection
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-white transition-colors p-2 text-xl"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="space-y-6 text-gray-300 text-sm leading-relaxed relative z-10">
              <p>
                <strong className="text-white">BloodScan AI</strong> is a next-generation diagnostic support tool designed to detect <strong className="text-[#00F5D4]">Acute Lymphoblastic Leukemia (ALL)</strong> cells from microscopic imagery. 
              </p>
              <p>
                The system utilizes a custom hybrid neural network architecture named <strong>QuantumFusion</strong>. It wraps a pretrained Xception Convolutional Backbone inside proprietary Quantum Neural computation layers (State Projection, Phase Encoding, and Entanglement) to extract deeper morphological features of lymphoblasts that standard models miss.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="glass p-4 rounded-xl border border-[rgba(255,255,255,0.05)]">
                  <h4 className="text-[#00F5D4] font-bold mb-2 flex items-center gap-2">
                    <span>🔬</span> Inference Engine
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-xs text-gray-400">
                    <li>Python FastAPI Backend</li>
                    <li>TensorFlow / Keras 3 Core</li>
                    <li>Live Grad-CAM Saliency Maps</li>
                  </ul>
                </div>
                <div className="glass p-4 rounded-xl border border-[rgba(255,255,255,0.05)]">
                  <h4 className="text-[#3A86FF] font-bold mb-2 flex items-center gap-2">
                    <span>⚛️</span> Performance
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-xs text-gray-400">
                    <li>94.00% System Accuracy</li>
                    <li>0.904 F1-Score</li>
                    <li>Trained on C-NMC Dataset</li>
                  </ul>
                </div>
              </div>

              <div className="bg-[rgba(255,0,110,0.1)] border border-[rgba(255,0,110,0.3)] rounded-lg p-3 text-xs text-[#FF006E]">
                <strong>Disclaimer:</strong> BloodScan AI is intended for research and portfolio demonstration purposes only. It is not an FDA-approved medical diagnostic device.
              </div>
            </div>
            
            {/* Footer */}
            <div className="mt-8 text-center border-t border-[rgba(255,255,255,0.05)] pt-4">
              <button 
                onClick={onClose}
                className="btn-primary px-8"
              >
                Back to Dashboard
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
