// frontend/src/components/PatientDetail.js
export default function PatientDetail({ riskScore, riskCategory, subtitle }) {
  const cls = (riskCategory || "Low").toLowerCase();
  return (
    <div className="patient-card">
      <div className="risk-row">
        <div>
          <div className="risk-title">Risk</div>
          <div className="risk-value">{riskScore?.toFixed(2)} <span className={`pill ${cls}`}>{riskCategory}</span></div>
          <div className="muted">{subtitle}</div>
        </div>
        <div className={`risk-chip ${cls}`}>{riskScore?.toFixed(2)} | {riskCategory} Risk</div>
      </div>
    </div>
  );
}
