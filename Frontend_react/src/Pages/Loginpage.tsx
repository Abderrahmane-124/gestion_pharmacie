import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/Loginpage.css";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState("login");
  const navigate = useNavigate(); // Initialize the navigation function

  return (
    <div className="login-container">
      <h1>Connexion / Inscription</h1>

      <div className="toggle-buttons">
        <button className={activeTab === "login" ? "active" : ""} onClick={() => setActiveTab("login")}>
          Connexion
        </button>
        <button className={activeTab === "register" ? "active" : ""} onClick={() => setActiveTab("register")}>
          Inscription
        </button>
      </div>

      <input type="email" placeholder="Email" />
      <input type="password" placeholder="Mot de passe" />

      <button className="primary">Se Connecter</button>

      <div className="separator">OU</div>

      <div className="separator">Pas encore inscrit ?</div>
      <button className="secondary" onClick={() => navigate("/signup")}>
        Créer un compte
      </button>
    </div>
  );
}