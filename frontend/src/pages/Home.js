// frontend/src/pages/Home.js
import { Link } from "react-router-dom";
import "./../styles/Home.css";

export default function Home() {
  return (
    <section className="home">
      <div className="home-card">
        <h1>MEDI-VISION an AI-Driven Risk Prediction Engine</h1>
        <p>
          Identify high-risk patients early. Visualize drivers of risk, monitor vitals trends,
          and act on clear, evidence-based recommendations.
        </p>
        <div className="home-cta">
          <Link to="/dashboard" className="btn">Open Dashboard</Link>
        </div>
      </div>
    </section>
  );
}
