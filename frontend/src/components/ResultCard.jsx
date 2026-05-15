import { motion } from "framer-motion";
import SkeletonCard from "./SkeletonCard.jsx";

export default function ResultCard({ title, subtitle, image, loading }) {
  return (
    <motion.div
      className="glass rounded-2xl p-4 min-h-[220px] flex flex-col"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-3">
        <h4 className="text-sm font-semibold">{title}</h4>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      </div>
      <div className="flex-1 rounded-xl overflow-hidden border border-white/10">
        {loading ? (
          <SkeletonCard />
        ) : image ? (
          <img src={image} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-muted">
            Awaiting inference output
          </div>
        )}
      </div>
    </motion.div>
  );
}
