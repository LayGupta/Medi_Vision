
// frontend/src/services/api.js
const API_BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

async function j(method, path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return res.json();
}

export const api = {
  health: () => j("GET", "/api/health"),
  features: () => j("GET", "/api/features"),
  patients: () => j("GET", "/api/patients"),
  patient: (id) => j("GET", `/api/patients/${id}`),
  vitals: (id) => j("GET", `/api/patients/${id}/vitals`),
  predict: (features) => j("POST", "/api/predict", { features }),
  predictExplain: (features) => j("POST", "/api/predict_explain", { features }),
  importance: () => j("GET", "/api/feature_importance"),
  addPatient: (payload) => j("POST", "/api/patients", payload),
};

