
// frontend/src/pages/Dashboard.js
import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import "../styles/Dashboard.css";
import CohortView from "../components/CohortView";
import FeatureImportance from "../components/FeatureImportance";
import PatientDetail from "../components/PatientDetail";
import RiskChart from "../components/RiskChart";
import AddPatientForm from "../components/AddPatientForm";

export default function Dashboard() {
  const [patients, setPatients] = useState([]);
  const [importance, setImportance] = useState([]);
  const [selected, setSelected] = useState(null);
  const [vitals, setVitals] = useState([]);
  const [explain, setExplain] = useState({
    risk_score: 0,
    risk_category: "Low",
    attributions: [],
  });
  const [showAdd, setShowAdd] = useState(false);

  // Helper: load patients safely
  const reloadPatients = async () => {
    try {
      const pts = await api.patients();
      const safe = Array.isArray(pts) ? pts : [];
      setPatients(safe);
      // auto-select first if nothing selected
      if (!selected && safe.length > 0) setSelected(safe[0]);
      return safe;
    } catch (e) {
      console.error("patients()", e);
      setPatients([]);
      return [];
    }
  };

  // Normalize importance payload from API to [{feature, importance}]
  const normalizeImportance = (r) => {
    const arr = Array.isArray(r) ? r : (r?.importance ?? []);
    return (arr || [])
      .map((item) => ({
        feature: String(item?.feature ?? ""),
        importance: Math.abs(
          Number(item?.importance ?? item?.weight ?? item?.value ?? 0)
        ),
      }))
      .filter((x) => x.feature && Number.isFinite(x.importance));
  };

  // Initial load
  useEffect(() => {
    (async () => {
      await reloadPatients();
      try {
        const r = await api.importance();
        setImportance(normalizeImportance(r));
      } catch (e) {
        console.error("importance()", e);
        setImportance([]);
      }
    })();
  }, []); 

  // When selection changes, pull vitals + explain
  useEffect(() => {
    if (!selected?.id && !selected) return;

    (async () => {
      // Vitals
      try {
        const v = await api.vitals(selected.id);
        const series = Array.isArray(v?.series) ? v.series : [];
        setVitals(series);
      } catch (e) {
        console.error("vitals()", e);
        setVitals([]);
      }

      // Predict + Explain
      try {
        const feat = selected.features || selected; // tolerant
        const { risk_score, risk_category, attributions } =
          (await api.predictExplain(feat)) || {};
        const safeAttr = Array.isArray(attributions) ? attributions : [];
        setExplain({
          risk_score: Number.isFinite(Number(risk_score))
            ? Number(risk_score)
            : NaN,
          risk_category: String(risk_category ?? ""),
          attributions: safeAttr,
        });
      } catch (e) {
        console.error("predictExplain()", e);
        setExplain({ risk_score: NaN, risk_category: "", attributions: [] });
      }
    })();
  }, [selected]);

  // Memo: selected id for CohortView
  const selectedId = useMemo(() => selected?.id, [selected]);

  return (
    <div className="dash-grid">
      <div className="left-pane card">
        <div className="pane-header">
          <h2>Cohort View</h2>
          <div style={{ display: "flex", gap: 12 }}>
            <button className="btn-link" onClick={() => setShowAdd(true)}>
              + Add Patient
            </button>
            {selected && (
              <Link to={`/patients/${selected.id}`} className="btn-link">
                View Details
              </Link>
            )}
          </div>
        </div>

        <CohortView rows={patients} onSelect={setSelected} selectedId={selectedId} />

        <h3 className="section-title">Global Feature Importance</h3>
        <FeatureImportance data={importance} />
      </div>

      <div className="right-pane card">
        <PatientDetail
          riskScore={explain.risk_score}
          riskCategory={explain.risk_category}
          subtitle="Next 50 days: Likely deterioration without intervention."
        />

        <h3 className="section-title">Vitals Trends</h3>
        <RiskChart series={vitals} />

        <h3 className="section-title">Top Contributing Factors</h3>
        <ul className="bullets">
          {explain.attributions.map((a, i) => (
            <li key={i}>
              <strong>{a.feature}</strong> → pushes {a.direction} (score{" "}
              {a.magnitude})
            </li>
          ))}
          {!explain.attributions.length && (
            <li>No strong contributors detected.</li>
          )}
        </ul>

        <h3 className="section-title">Recommended Next Actions</h3>
        <ul className="bullets">
          <li>Schedule cardiology follow-up in 2 weeks</li>
          <li>Adherence counseling and HbA1c re-test</li>
          <li>Daily vitals monitoring via app</li>
        </ul>
      </div>

      {/* Lightweight modal overlay for Add Patient */}
      {showAdd && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.25)",
            display: "grid",
            placeItems: "center",
            zIndex: 50,
          }}
        >
          <div style={{ maxWidth: 1000, width: "92%" }}>
            <AddPatientForm
              onClose={() => setShowAdd(false)}
              onSaved={async (saved) => {
                const pts = await reloadPatients();
                const match = pts.find((p) => p.id === saved.id);
                if (match) setSelected(match);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
