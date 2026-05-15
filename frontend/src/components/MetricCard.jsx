import { useEffect, useState } from "react";

function useCountUp(value, durationMs) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (typeof value !== "number" || Number.isNaN(value)) {
      setDisplay(0);
      return;
    }

    let start = 0;
    let startTime;

    const tick = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / durationMs, 1);
      const current = start + (value - start) * progress;
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [value, durationMs]);

  return display;
}

export default function MetricCard({ label, value, suffix, precision = 2 }) {
  const displayValue = useCountUp(value, 900);
  const hasValue = typeof value === "number" && !Number.isNaN(value);

  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-xs text-muted uppercase tracking-wide">{label}</p>
      <div className="mt-3 text-2xl font-semibold">
        {hasValue ? `${displayValue.toFixed(precision)}${suffix}` : "--"}
      </div>
    </div>
  );
}
