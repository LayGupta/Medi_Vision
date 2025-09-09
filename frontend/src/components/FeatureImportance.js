

// frontend/src/components/FeatureImportance.js
export default function FeatureImportance({ data = [] }) {
  // normalize and guard
  const rows = Array.isArray(data)
    ? data
        .map(d => ({
          feature: String(d?.feature ?? ""),
          // accept importance | weight | value, coerce to number, abs for SHAP-like values
          importance: Math.abs(Number(d?.importance ?? d?.weight ?? d?.value ?? 0)),
        }))
        .filter(d => Number.isFinite(d.importance) && d.feature.length > 0)
    : [];

  // sort desc; keep top 15 (tweak if you like)
  const top = rows.sort((a, b) => b.importance - a.importance).slice(0, 15);

  const max = Math.max(...top.map(d => d.importance), 0.0001);

  if (!top.length) {
    return <p className="muted">No importance available.</p>;
  }

  return (
    <div className="bars">
      {top.map((d, i) => {
        const pct = Math.max(0, (d.importance / max) * 100);
        return (
          <div key={i} className="bar-row">
            <div className="bar-label" title={d.feature}>{pretty(d.feature)}</div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="bar-value">{d.importance.toFixed(3)}</div>
          </div>
        );
      })}
    </div>
  );
}

function pretty(s) {
  if (!s) return "";
  try {
    return s.replace(/_/g, " ").replace(/\b(z)\b/i, "Z");
  } catch {
    return String(s);
  }
}
