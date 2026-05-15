const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function runSegmentation({
  imageFile,
  report,
  threshold,
  opacity,
  returnAttention
}) {
  const form = new FormData();
  form.append("image", imageFile);
  form.append("report", report || "");
  form.append("threshold", String(threshold));
  form.append("opacity", String(opacity));
  form.append("return_attention", returnAttention ? "true" : "false");

  const res = await fetch(`${API_URL}/api/segment`, {
    method: "POST",
    body: form
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Inference failed");
  }

  return res.json();
}
