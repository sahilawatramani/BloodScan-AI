import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { motion } from "framer-motion";

export default function Charts({ summary, results }) {
  const pieData = [
    { name: "Cancer (ALL)", value: summary.cancerCount },
    { name: "Normal (HEM)", value: summary.normalCount },
  ];
  const pieColors = ["#FF006E", "#00FF88"];

  // Confidence distribution for bar chart
  const confBuckets = [
    { range: "50-60%", all: 0, hem: 0 },
    { range: "60-70%", all: 0, hem: 0 },
    { range: "70-80%", all: 0, hem: 0 },
    { range: "80-90%", all: 0, hem: 0 },
    { range: "90-100%", all: 0, hem: 0 },
  ];
  results?.forEach(r => {
    const conf = r.confidence;
    const idx = Math.min(Math.floor((conf - 50) / 10), 4);
    if (idx >= 0) {
      if (r.prediction.includes("ALL")) confBuckets[idx].all++;
      else confBuckets[idx].hem++;
    }
  });

  const tooltipStyle = {
    background: "rgba(3,7,17,0.95)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    color: "white",
    fontSize: "12px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
  };

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Donut chart */}
      <div className="glass card-3d rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-1">Cell Distribution</h2>
        <p className="text-xs text-gray-500 mb-4">Classification breakdown</p>

        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={95}
              innerRadius={55}
              paddingAngle={5}
              strokeWidth={0}
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={pieColors[i]}
                  style={{ filter: `drop-shadow(0 0 10px ${pieColors[i]}50)` }}
                />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend
              wrapperStyle={{ color: "rgba(255,255,255,0.7)", fontSize: "12px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Bar chart */}
      <div className="glass card-3d rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-1">Confidence Distribution</h2>
        <p className="text-xs text-gray-500 mb-4">Per-cell confidence ranges</p>

        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={confBuckets}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="range"
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              allowDecimals={false}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="all" name="Blast (ALL)" fill="#FF006E" radius={[4, 4, 0, 0]}
              style={{ filter: "drop-shadow(0 0 6px rgba(255,0,110,0.3))" }}
            />
            <Bar dataKey="hem" name="Normal (HEM)" fill="#00FF88" radius={[4, 4, 0, 0]}
              style={{ filter: "drop-shadow(0 0 6px rgba(0,255,136,0.3))" }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
