import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Image as ImageIcon, UploadCloud, X } from "lucide-react";

export default function UploadCard({ file, preview, onFileSelect, onClear }) {
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = (files) => {
    if (!files || !files.length) return;
    onFileSelect(files[0]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    handleFiles(event.dataTransfer.files);
  };

  return (
    <motion.div
      className={`glass rounded-2xl p-5 border ${dragActive ? "neon-border" : "border-transparent"}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onDragOver={(event) => {
        event.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center">
            <ImageIcon className="h-5 w-5 text-cyan-200" />
          </div>
          <div>
            <p className="text-sm text-muted">Upload MRI Image</p>
            <h3 className="text-lg font-semibold">FLAIR Slice (PNG, JPG, or NPY)</h3>
          </div>
        </div>
        {file && (
          <button
            onClick={onClear}
            className="text-xs text-muted hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-4">
        {preview ? (
          <motion.div
            className="rounded-xl overflow-hidden border border-white/10 p-4 flex items-center justify-center bg-white/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {file && file.name && file.name.toLowerCase().endsWith('.npy') ? (
              <div className="text-sm text-muted">
                <div className="font-semibold">{file.name}</div>
                <div className="text-xs mt-1">NumPy (.npy) array — will be converted to a slice</div>
              </div>
            ) : (
              <img src={preview} alt="MRI Preview" className="w-full h-56 object-cover" />
            )}
          </motion.div>
        ) : (
          <div
            className={`rounded-xl border border-dashed border-white/15 h-56 flex flex-col items-center justify-center text-center transition ${
              dragActive ? "bg-white/5" : "bg-white/0"
            }`}
          >
            <UploadCloud className="h-8 w-8 text-cyan-200" />
            <p className="mt-3 text-sm text-muted">Drag and drop your MRI image here</p>
            <button
              className="mt-3 px-4 py-2 rounded-full bg-white/10 text-sm hover:bg-white/20 transition"
              onClick={() => inputRef.current?.click()}
            >
              Browse File
            </button>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.npy,image/png,image/jpeg,application/octet-stream"
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />
    </motion.div>
  );
}
