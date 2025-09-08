#  Risk Dashboard

A full-stack dashboard to explore patient risk prediction.  
Built with **React** on the frontend and **Flask + scikit-learn/LightGBM** on the backend.

---

##  What it does

- Shows a **Cohort View** of patients with computed **risk scores** (Low/Medium/High).
- Displays patient details: vitals trends, risk category, and contributing factors.
- Lets you **add new patients** directly from the dashboard.
- Uses a trained ML model (`risk_prediction_model.pkl`) to make predictions.
- Tolerant of missing values — backend fills defaults and computes z-scores.

---

##  Demo

![Dashboard screenshot](./docs/screenshot.png)

---

##  Project Structure

