import { FileText } from "lucide-react";
import { motion } from "framer-motion";

export default function TextReportCard({ value, onChange, placeholder, maxLength }) {
  return (
    <motion.div
      className="glass rounded-2xl p-5"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05 }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center">
          <FileText className="h-5 w-5 text-cyan-200" />
        </div>
        <div>
          <p className="text-sm text-muted">Radiology Report (Optional)</p>
          <h3 className="text-lg font-semibold">Text Guidance</h3>
        </div>
      </div>

      <div className="relative">
        <div
          className={`absolute inset-0 p-4 text-sm text-muted pointer-events-none whitespace-pre-wrap leading-relaxed ${
            value && value.length > 0 ? "hidden" : "block"
          }`}
        >
          {placeholder}
        </div>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={maxLength}
          rows={6}
          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-cyan-300/60 transition"
        />
      </div>
      <div className="flex justify-between text-xs text-muted mt-2">
        <span>Clinical context enhances attention modeling</span>
        <span>{value.length}/{maxLength}</span>
      </div>
    </motion.div>
  );
}
