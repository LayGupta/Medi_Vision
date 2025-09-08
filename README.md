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

<img width="1920" height="1200" alt="image" src="https://github.com/user-attachments/assets/3eb47288-7b45-4349-b9be-5e62b58f7dcd" />


---

##  Project Structure

