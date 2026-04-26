import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";

export default function UploadPanel({ onUpload, fileCount }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    onDrop: (files) => onUpload(files),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div
        {...getRootProps()}
        className={`relative glass rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all duration-400 overflow-hidden group ${
          isDragActive
            ? "border-[#00FF88] bg-[rgba(0,255,136,0.05)] scale-[1.01]"
            : "border-[rgba(0,245,212,0.3)] hover:border-[#00F5D4] hover:bg-[rgba(0,245,212,0.03)]"
        }`}
      >
        {/* Scan line effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00F5D4] to-transparent"
            style={{ animation: "scan-line 3s linear infinite" }} />
        </div>

        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4 py-12 px-6">
          {/* Upload icon with pulse */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[rgba(0,245,212,0.1)] to-[rgba(58,134,255,0.1)] flex items-center justify-center border border-[rgba(0,245,212,0.2)]">
              <svg className="w-10 h-10 text-[#00F5D4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            {isDragActive && (
              <div className="absolute inset-0 rounded-full border-2 border-[#00FF88]"
                style={{ animation: "pulse-ring 1.5s infinite" }} />
            )}
          </div>

          <div>
            <p className="text-[#00F5D4] text-lg font-semibold">
              {isDragActive ? "Drop images here..." : "Drag & Drop Peripheral Blood Smear Images"}
            </p>
            <p className="text-gray-400 text-sm mt-1 max-w-md mx-auto">
              Please upload <b>single-cell crops</b> from stained peripheral blood smears or bone marrow aspirates. The AI is optimized for identifying Acute Lymphoblastic Leukemia (ALL) blasts vs normal hemopoietic cells.
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Formats: PNG, JPG (up to 50MB) • Multiple files supported for batch analysis
            </p>
          </div>

          {fileCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="badge badge-info"
            >
              {fileCount} {fileCount === 1 ? "image" : "images"} selected
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
