import { motion } from "framer-motion";

export default function AnimatedCard({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      className={`glass card-3d rounded-2xl p-6 ${className}`}
      whileHover={{
        scale: 1.02,
        rotateX: 1,
        rotateY: -1,
        boxShadow: "0 30px 60px rgba(0,0,0,0.7), 0 0 40px rgba(0,245,212,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
      }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  );
}
