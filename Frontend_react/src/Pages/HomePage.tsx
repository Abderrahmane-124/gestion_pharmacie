import { useNavigate } from "react-router-dom";
import "../Styles/HomePage.css";

export default function Homepage() {
  const navigate = useNavigate();

  return (
    <div className="homepage-wrapper">
      <div className="homepage-overlay">
        <div className="homepage-card">
          <h1 className="homepage-title">Bienvenue sur Pharma App</h1>
          <p className="homepage-subtitle">Votre solution pour gérer vos médicaments facilement</p>
          <button
            className="homepage-button"
            onClick={() => navigate("/login")}
          >
            Se connecter
          </button>
        </div>
      </div>
    </div>
  );
}
