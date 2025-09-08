Risk Dashboard
A full-stack web dashboard for patient risk prediction.
Built with React on the frontend and Flask + scikit-learn/LightGBM on the backend.

Features
Cohort view of patients with computed risk scores (Low/Medium/High).

Patient detail view with vitals trends, risk category, and contributing factors.

Add new patients directly from the dashboard.

Uses a trained ML model (risk_prediction_model.pkl) for predictions.

Handles missing values — backend fills defaults and computes z-scores for features.

Project Structure
text
risk-dashboard/
├─ backend/                  # Flask API + model wrapper
│  ├─ app.py
│  ├─ predictor.py
│  ├─ features.json
│  ├─ risk_prediction_model.pkl   # (tracked with Git LFS)
│  ├─ patients.json
│  └─ zscore_stats.json
└─ frontend/                 # React dashboard
   ├─ src/
   │  ├─ pages/Dashboard.js
   │  ├─ components/
   │  └─ services/api.js
   ├─ package.json
   └─ .env.example
Getting Started
1. Clone the repository
bash
git clone https://github.com/<your-username>/risk-dashboard.git
cd risk-dashboard
2. Backend Setup
bash
cd backend
python -m venv .venv

# Activate virtual environment
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate

pip install -r requirements.txt
python app.py
Check API health:
http://localhost:8000/api/health → {"status": "ok"}

3. Frontend Setup
bash
cd frontend
cp .env.example .env
npm install
npm start
Open the dashboard at: http://localhost:3000

API Overview
GET /api/patients → list of patients with risk scores

POST /api/patients → add or update a patient

POST /api/predict_explain → predict risk and return feature attributions

GET /api/patients/:id/vitals → vitals history series

Example Request: Add Patient
json
{
  "id": 101,
  "last_checkin": "2025-09-08",
  "core": {
    "age": 45,
    "gender": 1,
    "heartrate_mean": 78,
    "resp_rate_mean": 16,
    "spo2_mean": 98,
    "temp_mean": 98.6,
    "sbp_mean": 120,
    "dbp_mean": 80,
    "glucose_mean": 110,
    "creatinine_mean": 1.0,
    "bun_mean": 15,
    "wbc_mean": 7,
    "hemoglobin_mean": 14,
    "platelets_mean": 250,
    "sodium_mean": 140,
    "potassium_mean": 4.2,
    "lactate_mean": 1.2,
    "diabetes": 0,
    "hypertension": 0,
    "copd": 0,
    "ckd": 0,
    "chf": 0,
    "cad": 0,
    "asthma": 0,
    "cancer": 0
  }
}
Tech Stack
Frontend: React (with hooks)

Backend: Flask, Flask-CORS

Machine Learning: scikit-learn, LightGBM

Storage: JSON (patients, model metadata, z-score stats)

