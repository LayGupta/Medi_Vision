# Risk Dashboard

A full-stack web application for clinical risk prediction. Built with React on the frontend and Flask + scikit-learn/LightGBM on the backend, it integrates a trained ML model to evaluate patient risk categories in real time.

---

## Features

- **Cohort view** of patients with computed risk scores (Low / Medium / High)  
- **Patient detail view** with vitals trends, risk category, and contributing factors  
- **Add new patients** directly from the dashboard  
- **Integrated ML model** (`risk_prediction_model.pkl`) for automated predictions  
- **Handles missing values** — backend applies defaults and computes z-scores for features  
- **Extensible design** for experimenting with alternative ML models and datasets  

---

## Machine Learning Model

- **Training features:** Clinical features (demographics, vitals, labs, comorbidities) — over 40 features in total  
- **Model:** LightGBM classifier, with preprocessing handled via scikit-learn pipelines  
- **Normalization:** Input normalization with z-score statistics (`zscore_stats.json`)  
- **Predictions:** Calibrated into discrete categories — Low, Medium, High risk  
- **Artifacts:** Model artifact (`risk_prediction_model.pkl`) is tracked with Git LFS  

---

## Dataset

- Derived from patient-level time series data (demographics + vitals + lab tests + chronic conditions)  
- **Example input:** `test_patient.json`  
- **Feature list:** `features.json`  
- **Preprocessing:** Handles missing values and standardizes features  

---

## Project Structure

```
risk-dashboard/
├── backend/                    # Flask API + ML model
│   ├── app.py
│   ├── predictor.py
│   ├── features.json
│   ├── risk_prediction_model.pkl  # ML model (tracked with Git LFS)
│   ├── patients.json
│   └── zscore_stats.json
└── frontend/                   # React dashboard
    ├── src/
    │   ├── pages/Dashboard.js
    │   ├── components/
    │   └── services/api.js
    ├── package.json
    └── .env.example
```

---

## Getting Started

### Clone the repository

```bash
git clone https://github.com/<your-username>/risk-dashboard.git
cd risk-dashboard
```

### Backend Setup

```bash
cd backend
python -m venv .venv

# Activate environment
.venv\Scripts\activate      # Windows
source .venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
python app.py
```

Check API health: http://localhost:8000/api/health

Expected response:
```json
{"status": "ok"}
```

### Frontend Setup

```bash
cd frontend
cp .env.example .env
npm install
npm start
```

Dashboard available at: http://localhost:3000

---

## API Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/patients` | GET | List of patients with risk scores |
| `/api/patients` | POST | Add or update a patient |
| `/api/predict` | POST | Predict risk from raw feature vector |
| `/api/features` | GET | List of model input features |

**Example request:** see `test_patient.json`

---

## Tech Stack

- **Frontend:** React (with hooks)
- **Backend:** Flask, Flask-CORS
- **Machine Learning:** scikit-learn, LightGBM
- **Storage:** JSON (patients, model metadata, z-score stats)

---

## Prerequisites

- Python 3.8+
- Node.js 14+
- npm or yarn

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support

If you encounter any issues or have questions, please open an issue on GitHub or contact the development team.