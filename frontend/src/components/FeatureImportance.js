// frontend/src/components/FeatureImportance.js
export default function FeatureImportance({ data }) {
  const max = Math.max(...data.map(d => d.importance || 0), 0.0001);
  return (
    <div className="bars">
      {data.map((d, i) => (
        <div key={i} className="bar-row">
          <div className="bar-label">{pretty(d.feature)}</div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(d.importance / max) * 100}%` }} />
          </div>
        </div>
      ))}
      {!data.length && <p className="muted">No importance available.</p>}
    </div>
  );
}
function pretty(s){ return s.replace(/_/g," ").replace(/\b(z)\b/i,"Z"); }
