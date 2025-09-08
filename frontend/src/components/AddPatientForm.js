// frontend/src/components/AddPatientForm.js
import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

const BASIC_FIELDS = [
  // ID & date are captured separately; these are clinical fields
  { key:"age", label:"Age", type:"number" },
  { key:"gender", label:"Gender (0=female,1=male)", type:"number" },

  { key:"heartrate_mean", label:"Heart Rate (mean)", type:"number" },
  { key:"resp_rate_mean", label:"Resp Rate (mean)", type:"number" },
  { key:"spo2_mean", label:"SpO₂ (mean)", type:"number" },
  { key:"temp_mean", label:"Temperature (mean °F)", type:"number" },

  { key:"sbp_mean", label:"SBP (mean)", type:"number" },
  { key:"dbp_mean", label:"DBP (mean)", type:"number" },

  { key:"glucose_mean", label:"Glucose (mean)", type:"number" },
  { key:"creatinine_mean", label:"Creatinine (mean)", type:"number" },
  { key:"bun_mean", label:"BUN (mean)", type:"number" },

  { key:"wbc_mean", label:"WBC (mean)", type:"number" },
  { key:"hemoglobin_mean", label:"Hemoglobin (mean)", type:"number" },
  { key:"platelets_mean", label:"Platelets (mean)", type:"number" },

  { key:"sodium_mean", label:"Sodium (mean)", type:"number" },
  { key:"potassium_mean", label:"Potassium (mean)", type:"number" },
  { key:"lactate_mean", label:"Lactate (mean)", type:"number" },

  { key:"diabetes", label:"Diabetes (0/1)", type:"number" },
  { key:"hypertension", label:"Hypertension (0/1)", type:"number" },
  { key:"copd", label:"COPD (0/1)", type:"number" },
  { key:"ckd", label:"CKD (0/1)", type:"number" },
  { key:"chf", label:"CHF (0/1)", type:"number" },
  { key:"cad", label:"CAD (0/1)", type:"number" },
  { key:"asthma", label:"Asthma (0/1)", type:"number" },
  { key:"cancer", label:"Cancer (0/1)", type:"number" }
];

export default function AddPatientForm({ onClose, onSaved }) {
  const [mode, setMode] = useState("basic"); // "basic" | "advanced"
  const [featuresList, setFeaturesList] = useState([]);
  const [id, setId] = useState("");
  const [lastCheckin, setLastCheckin] = useState("");
  const [core, setCore] = useState({});
  const [feat, setFeat] = useState({});
  const [vitalsText, setVitalsText] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.features().then(r => {
      const fl = r.features || [];
      setFeaturesList(fl);
      const init = {};
      fl.forEach(f => { init[f] = ""; });
      setFeat(init);
    }).catch(e => setErr(String(e)));
  }, []);

  const payload = useMemo(() => {
    const vhist = parseVitals(vitalsText);
    if (mode === "basic") {
      const c = {};
      for (const f of BASIC_FIELDS) {
        const raw = core[f.key];
        if (raw === "" || raw === undefined) continue;
        const n = Number(raw);
        c[f.key] = Number.isFinite(n) ? n : raw;
      }
      return {
        id: id ? Number(id) : undefined,
        last_checkin: lastCheckin || undefined,
        core: c,
        vitals_history: vhist
      };
    } else {
      // advanced: send full features (whatever is filled)
      const f = {};
      for (const k of featuresList) {
        const raw = feat[k];
        if (raw === "" || raw === undefined) continue;
        const n = Number(raw);
        f[k] = Number.isFinite(n) ? n : raw;
      }
      return {
        id: id ? Number(id) : undefined,
        last_checkin: lastCheckin || undefined,
        features: f,
        vitals_history: vhist
      };
    }
  }, [mode, id, lastCheckin, core, feat, featuresList, vitalsText]);

  const canSave = id && (mode === "advanced" ? true : true); // id is enough; backend tolerant

  async function handleSave(e) {
    e.preventDefault();
    setErr("");
    if (!canSave) { setErr("Please enter at least an ID."); return; }
    try {
      setSaving(true);
      const saved = await api.addPatient(payload);
      setSaving(false);
      onSaved?.(saved);
      onClose?.();
    } catch (e) {
      setSaving(false);
      setErr(String(e.message || e));
    }
  }

  return (
    <div className="card add-form">
      <div className="form-head">
        <h3>Add Patient</h3>
        <div style={{display:"flex", gap:8, alignItems:"center"}}>
          <span className="muted">Mode:</span>
          <select value={mode} onChange={e=>setMode(e.target.value)}>
            <option value="basic">Basic (recommended)</option>
            <option value="advanced">Advanced (all features)</option>
          </select>
          <button className="btn-link" onClick={onClose}>✕ Close</button>
        </div>
      </div>

      {err && <div className="err">{err}</div>}

      <form onSubmit={handleSave}>
        <div className="grid2">
          <label>
            <span>Patient ID</span>
            <input type="number" value={id} onChange={e=>setId(e.target.value)} required />
          </label>
          <label>
            <span>Last Check-in (YYYY-MM-DD)</span>
            <input type="text" placeholder="2025-09-08" value={lastCheckin}
                   onChange={e=>setLastCheckin(e.target.value)} />
          </label>
        </div>

        {mode === "basic" ? (
          <>
            <h4>Basic Inputs</h4>
            <div className="grid3">
              {BASIC_FIELDS.map(f => (
                <label key={f.key}>
                  <span>{f.label}</span>
                  <input
                    type={f.type}
                    value={core[f.key] ?? ""}
                    onChange={e=>setCore(prev => ({...prev, [f.key]: e.target.value}))}
                  />
                </label>
              ))}
            </div>
          </>
        ) : (
          <>
            <h4>All Model Features</h4>
            <div className="grid3">
              {featuresList.map((k) => (
                <label key={k}>
                  <span>{pretty(k)}</span>
                  <input
                    value={feat[k] ?? ""}
                    onChange={e => setFeat(prev => ({ ...prev, [k]: e.target.value }))}
                    placeholder={k === "date" ? "YYYY-MM-DD" : "number"}
                  />
                </label>
              ))}
            </div>
          </>
        )}

        <details style={{ marginTop: 12 }}>
          <summary>Optional: Vitals history (JSON array)</summary>
          <textarea
            rows={5}
            placeholder='[{"label":"Sep 1","value":102},{"label":"Sep 5","value":110}]'
            value={vitalsText}
            onChange={e=>setVitalsText(e.target.value)}
          />
        </details>

        <div className="form-actions">
          <button type="submit" className="btn" disabled={!canSave || saving}>
            {saving ? "Saving…" : "Save"}
          </button>
          <button type="button" className="btn-link" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

function pretty(s){ return s.replace(/_/g," ").replace(/\b(z)\b/i, "Z"); }
function parseVitals(t){ if(!t?.trim()) return []; try{ const v=JSON.parse(t); return Array.isArray(v)?v:[] }catch{return []} }
