// frontend/src/App.js
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import PatientPage from "./pages/PatientPage";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <div className="shell">
        <header className="topbar">
          <Link to="/" className="brand">AI Risk Dashboard</Link>
          <nav>
            <Link to="/">Home</Link>
            <Link to="/dashboard">Dashboard</Link>
          </nav>
        </header>
        <main className="main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/patients/:id" element={<PatientPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <footer className="foot">© {new Date().getFullYear()} Health AI</footer>
      </div>
    </BrowserRouter>
  );
}
