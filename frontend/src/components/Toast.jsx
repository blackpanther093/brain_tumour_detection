import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle } from "lucide-react";

export default function Toast({ type, message }) {
  const icon = type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />;
  const bg = type === "success" ? "bg-emerald-500/20" : "bg-rose-500/20";

  return (
    <motion.div
      className={`glass-strong rounded-xl px-4 py-3 flex items-center gap-2 text-sm ${bg}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      {icon}
      <span>{message}</span>
    </motion.div>
  );
}
