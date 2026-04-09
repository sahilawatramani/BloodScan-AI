import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

let toastId = 0;
const listeners = new Set();

export function showToast(message, type = "success", duration = 4000) {
  const id = ++toastId;
  listeners.forEach(fn => fn({ id, message, type, duration }));
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (toast) => {
      setToasts(prev => [...prev, toast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, toast.duration);
    };
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  const icons = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  };
  const colors = {
    success: "#00FF88",
    error: "#FF006E",
    warning: "#FFAA00",
    info: "#3A86FF",
  };

  return (
    <div className="fixed top-20 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="glass-strong rounded-xl px-5 py-3 flex items-center gap-3 min-w-[280px] pointer-events-auto relative overflow-hidden"
          >
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{
                background: `${colors[toast.type]}20`,
                color: colors[toast.type],
              }}
            >
              {icons[toast.type]}
            </span>
            <p className="text-sm text-white flex-1">{toast.message}</p>

            {/* Progress bar */}
            <motion.div
              className="absolute bottom-0 left-0 h-[2px]"
              style={{ background: colors[toast.type] }}
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: toast.duration / 1000, ease: "linear" }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
