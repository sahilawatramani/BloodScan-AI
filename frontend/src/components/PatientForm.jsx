import { motion } from "framer-motion";

export default function PatientForm({ patientInfo, setPatientInfo, onNext }) {
  const handleChange = (field, value) => {
    setPatientInfo(prev => ({ ...prev, [field]: value }));
  };

  const isComplete = patientInfo.name && patientInfo.id && patientInfo.age;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass card-3d rounded-2xl p-8 max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00F5D4] to-[#3A86FF] flex items-center justify-center text-lg">
          🧑‍⚕️
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Patient Information</h2>
          <p className="text-sm text-gray-400">Enter details before analysis</p>
        </div>
      </div>

      {/* Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
            Patient Name
          </label>
          <input
            type="text"
            className="input-glass"
            placeholder="John Doe"
            value={patientInfo.name}
            onChange={(e) => handleChange("name", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
            Patient ID
          </label>
          <input
            type="text"
            className="input-glass"
            placeholder="PAT-2024-0001"
            value={patientInfo.id}
            onChange={(e) => handleChange("id", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
            Age
          </label>
          <input
            type="number"
            className="input-glass"
            placeholder="45"
            value={patientInfo.age}
            onChange={(e) => handleChange("age", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
            Sample Date
          </label>
          <input
            type="date"
            className="input-glass"
            value={patientInfo.date}
            onChange={(e) => handleChange("date", e.target.value)}
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end mt-8">
        <motion.button
          onClick={onNext}
          disabled={!isComplete}
          className="btn-primary"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          Continue to Upload →
        </motion.button>
      </div>
    </motion.div>
  );
}
