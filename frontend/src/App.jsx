import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, Brain, Sparkles } from "lucide-react";

import UploadCard from "./components/UploadCard.jsx";
import TextReportCard from "./components/TextReportCard.jsx";
import ControlsCard from "./components/ControlsCard.jsx";
import MetricCard from "./components/MetricCard.jsx";
import ResultCard from "./components/ResultCard.jsx";
import Toast from "./components/Toast.jsx";
import { runSegmentation } from "./api/client.js";

const PLACEHOLDER =
  "The lesion area is in the right frontal and parietal lobes with a mixed pattern of high and low signals.\nSpeckled high signal regions suggest edema with peripheral enhancement.";

export default function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [report, setReport] = useState("");
  const [threshold, setThreshold] = useState(0.5);
  const [opacity, setOpacity] = useState(0.55);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const addToast = (type, message) => {
    const id = toastId.current++;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 2800);
  };

  const handleFileSelect = (selected) => {
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleClear = () => {
    setFile(null);
    setPreview("");
    setResults(null);
    setMetrics(null);
  };

  const handleRun = async () => {
    if (!file) {
      addToast("error", "Please upload a valid MRI image.");
      return;
    }

    setLoading(true);
    try {
      const data = await runSegmentation({
        imageFile: file,
        report,
        threshold,
        opacity,
        returnAttention: true
      });
      setResults(data.images);
      setMetrics(data.metrics);
      addToast("success", "Segmentation completed successfully.");
    } catch (err) {
      addToast("error", err.message || "Inference failed.");
    } finally {
      setLoading(false);
    }
  };

  const metricCards = useMemo(() => {
    return [
      {
        label: "Dice confidence",
        value: metrics?.dice_confidence,
        suffix: "",
        precision: 3
      },
      {
        label: "Tumor area",
        value: metrics?.tumor_area_percent,
        suffix: "%",
        precision: 2
      },
      {
        label: "Segmentation coverage",
        value: metrics?.segmentation_coverage,
        suffix: "%",
        precision: 2
      },
      {
        label: "Inference time",
        value: metrics?.inference_ms,
        suffix: "ms",
        precision: 0
      },
      {
        label: "Text-image alignment",
        value: metrics?.semantic_alignment,
        suffix: "",
        precision: 3
      }
    ];
  }, [metrics]);

  return (
    <div className="min-h-screen px-5 py-8 lg:px-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col gap-4">
          <motion.div
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Sparkles className="h-4 w-4 text-cyan-200" />
            Multimodal Medical AI
          </motion.div>
          <motion.h1
            className="text-3xl md:text-4xl font-semibold"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Text-Guided Brain Tumor Segmentation
          </motion.h1>
          <p className="text-sm text-muted max-w-3xl">
            Vision Language Model with FLAIR MRI and radiology reports. CLIP-driven semantic
            fusion with FiLM-guided UNet segmentation.
          </p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
          <div className="space-y-6">
            <UploadCard
              file={file}
              preview={preview}
              onFileSelect={handleFileSelect}
              onClear={handleClear}
            />
            <TextReportCard
              value={report}
              onChange={setReport}
              placeholder={PLACEHOLDER}
              maxLength={900}
            />
            <ControlsCard
              threshold={threshold}
              setThreshold={setThreshold}
              opacity={opacity}
              setOpacity={setOpacity}
              onRun={handleRun}
              loading={loading}
            />
          </div>

          <div className="space-y-6">
            <div className="glass-strong rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-cyan-200" />
                </div>
                <div>
                  <p className="text-sm text-muted">Segmentation Outputs</p>
                  <h3 className="text-lg font-semibold">Model Visualization</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <ResultCard
                  title="Original MRI"
                  subtitle="Input slice"
                  image={results?.original}
                  loading={loading}
                />
                <ResultCard
                  title="Predicted Mask"
                  subtitle="Binary tumor region"
                  image={results?.mask}
                  loading={loading}
                />
                <ResultCard
                  title="Overlay"
                  subtitle="Mask applied to MRI"
                  image={results?.overlay}
                  loading={loading}
                />
                <ResultCard
                  title="Attention Heatmap"
                  subtitle="Grad-CAM guidance"
                  image={results?.attention}
                  loading={loading}
                />
              </div>
            </div>

            <div className="glass rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-cyan-200" />
                </div>
                <div>
                  <p className="text-sm text-muted">Inference Metrics</p>
                  <h3 className="text-lg font-semibold">Clinical Summary</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
                {metricCards.map((metric) => (
                  <MetricCard
                    key={metric.label}
                    label={metric.label}
                    value={metric.value}
                    suffix={metric.suffix}
                    precision={metric.precision}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <footer className="text-xs text-muted flex items-center justify-between">
          <span>Powered by CLIP text embeddings and UNet-ResNet34 encoder</span>
          <span className="flex items-center gap-2">Secure offline inference</span>
        </footer>
      </div>

      <div className="fixed bottom-6 right-6 space-y-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <Toast key={toast.id} type={toast.type} message={toast.message} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
