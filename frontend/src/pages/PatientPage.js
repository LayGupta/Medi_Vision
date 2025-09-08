// frontend/src/pages/PatientPage.js
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api";
import "../styles/Patient.css";
import PatientDetail from "../components/PatientDetail";
import RiskChart from "../components/RiskChart";

export default function PatientPage() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [vitals, setVitals] = useState([]);
  const [explain, setExplain] = useState({ risk_score: 0, risk_category: "Low", attributions: [] });

  useEffect(() => {
    api.patient(id).then(setPatient);
    api.vitals(id).then(r => setVitals(r.series));
  }, [id]);

  useEffect(() => {
    if (!patient) return;
    const feat = patient.features || patient;
    api.predictExplain(feat).then(({ risk_score, risk_category, attributions }) => {
      setExplain({ risk_score, risk_category, attributions });
    });
  }, [patient]);

  if (!patient) return <div className="card"><p>Loading…</p></div>;

  return (
    <div className="card patient-page">
      <div className="page-head">
        <Link to="/dashboard" className="btn-link">← Back to Dashboard</Link>
        <h2>Patient Detail View</h2>
      </div>
      <PatientDetail riskScore={explain.risk_score} riskCategory={explain.risk_category}
        subtitle="Next 50 days: Likely deterioration without intervention." />
      <div className="split">
        <div>
          <h3>Vitals Trends</h3>
          <RiskChart series={vitals} />
        </div>
        <div>
          <h3>Top Contributing Factors</h3>
          <ul className="bullets">
            {explain.attributions.map((a, i) => (
              <li key={i}><strong>{a.feature}</strong> → pushes {a.direction} (score {a.magnitude})</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
