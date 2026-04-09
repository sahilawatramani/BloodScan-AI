import { motion, AnimatePresence } from "framer-motion";

export default function HistorySidebar({ isOpen, onToggle, historyData = [], onRestoreHistory }) {
  return (
    <>
      {/* Toggle button */}
      <motion.button
        onClick={onToggle}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 glass-strong px-2 py-4 rounded-l-xl hover:bg-[rgba(0,245,212,0.1)] transition-colors"
        whileHover={{ x: -4 }}
      >
        <span className="text-[#00F5D4] text-sm">{isOpen ? "›" : "‹"}</span>
        <p className="text-[10px] text-gray-400 [writing-mode:vertical-lr] mt-2">History</p>
      </motion.button>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onToggle}
            />

            <motion.aside
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-80 z-50 glass-strong border-l border-[rgba(255,255,255,0.08)] overflow-y-auto"
            >
              <div className="p-6 pt-20">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white">Recent Analyses</h3>
                  <button
                    onClick={onToggle}
                    className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3">
                  {historyData.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">No recent analyses found.</p>
                  ) : (
                    historyData.map((item, i) => (
                      <motion.div
                        key={item.id}
                        onClick={() => onRestoreHistory && onRestoreHistory(item)}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="glass rounded-xl p-4 cursor-pointer hover:bg-[rgba(255,255,255,0.06)] transition-all group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm font-medium text-white group-hover:text-[#00F5D4] transition-colors">
                              {item.patient_name || "Unknown"}
                            </p>
                            <p className="text-[10px] text-gray-500">{item.patient_date}</p>
                          </div>
                          <span className={`badge text-[10px] ${
                            (item.prediction || "").includes("POSITIVE") ? "badge-danger" : "badge-success"
                          }`}>
                            {(item.prediction || "").includes("POSITIVE") ? "POS" : "NEG"}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400">
                          {item.total_cells} cells analyzed
                        </p>
                      </motion.div>
                    ))
                  )}
                </div>

                <div className="mt-6 text-center">
                  <button className="btn-secondary text-xs w-full">
                    View All History
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
