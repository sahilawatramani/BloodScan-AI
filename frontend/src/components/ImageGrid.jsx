import { motion } from "framer-motion";

export default function ImageGrid({ files }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-6"
    >
      <p className="text-sm text-gray-400 mb-3">
        {files.length} {files.length === 1 ? "image" : "images"} uploaded
      </p>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
        {files.map((file, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03, type: "spring", stiffness: 300 }}
            className="glass rounded-xl overflow-hidden aspect-square group relative"
          >
            <img
              src={URL.createObjectURL(file)}
              alt={`Cell ${i + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-1">
              <span className="text-[10px] text-white font-medium">Cell {i + 1}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
