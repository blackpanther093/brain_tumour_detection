import { Sliders, PlayCircle } from "lucide-react";
import { motion } from "framer-motion";

function SliderRow({ label, value, min, max, step, onChange, suffix }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">{label}</span>
        <span className="font-semibold">
          {value.toFixed(2)}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-cyan-300"
      />
    </div>
  );
}

export default function ControlsCard({
  threshold,
  setThreshold,
  opacity,
  setOpacity,
  onRun,
  loading
}) {
  return (
    <motion.div
      className="glass rounded-2xl p-5"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center">
          <Sliders className="h-5 w-5 text-cyan-200" />
        </div>
        <div>
          <p className="text-sm text-muted">Model Controls</p>
          <h3 className="text-lg font-semibold">Inference Tuning</h3>
        </div>
      </div>

      <div className="space-y-5">
        <SliderRow
          label="Confidence Threshold"
          value={threshold}
          min={0.1}
          max={0.9}
          step={0.01}
          onChange={setThreshold}
          suffix=""
        />
        <SliderRow
          label="Segmentation Opacity"
          value={opacity}
          min={0.1}
          max={0.9}
          step={0.01}
          onChange={setOpacity}
          suffix=""
        />
      </div>

      <button
        className={`mt-6 w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition ${
          loading
            ? "button-glow text-white/90 animate-pulse cursor-not-allowed"
            : "button-glow text-white hover:brightness-110"
        }`}
        onClick={onRun}
        disabled={loading}
      >
        <PlayCircle className="h-4 w-4" />
        {loading ? "Running Segmentation..." : "Run Segmentation"}
      </button>
    </motion.div>
  );
}
