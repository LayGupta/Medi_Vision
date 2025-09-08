// frontend/src/components/CohortView.js
export default function CohortView({ rows, onSelect, selectedId }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr><th>Patient ID</th><th>Risk Score</th><th>Last Check-in</th></tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const hasScore = Number.isFinite(r.risk_score);
            const scoreStr = hasScore ? Number(r.risk_score).toFixed(2) : "—";
            const category = hasScore ? (r.risk_category || labelFromScore(r.risk_score)) : "—";
            const pillClass = hasScore ? (category || "Low").toLowerCase() : "";

            return (
              <tr key={r.id}
                  className={selectedId === r.id ? "sel" : ""}
                  onClick={() => onSelect(r)}>
                <td>{String(r.id).padStart(3,"0")}</td>
                <td>
                  {scoreStr}{" "}
                  <span className={`pill ${pillClass}`}>{category}</span>
                </td>
                <td>{r.last_checkin || "—"}</td>
              </tr>
            );
          })}
          {!rows.length && <tr><td colSpan={3}>No patients found.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function labelFromScore(s) {
  if (!Number.isFinite(s)) return "—";
  if (s > 0.7) return "High";
  if (s > 0.4) return "Medium";
  return "Low";
}
