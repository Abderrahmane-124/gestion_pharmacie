import { useNavigate } from "react-router-dom";
<<<<<<< HEAD
import { useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../Styles/Homepage.css";
import pharmacyLogo from "../assets/preview.jpg"; // Assurez-vous que le chemin est correct
import appLogo from "../assets/preview.jpg";
=======
import "../Styles/HomePage.css";
>>>>>>> 569dc12c9fb99d66c5aa08c3909d7a6af37325ab

export default function Homepage() {
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      createFloatingPill();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const createFloatingPill = () => {
    const pillsContainer = document.querySelector(".pills-animation");
    if (!pillsContainer) return;

    const pill = document.createElement("div");
    pill.className = "floating-pill";

    const posX = Math.random() * 100;
    pill.style.left = `${posX}%`;

    const pillTypes = ["round-blue", "capsule-red", "oval-green", "round-white"];
    const pillType = pillTypes[Math.floor(Math.random() * pillTypes.length)];
    pill.classList.add(pillType);

    pillsContainer.appendChild(pill);

    setTimeout(() => {
      pill.remove();
    }, 15000);
  };

  return (
    <div className="homepage-wrapper">
      {/* Navigation */}
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-logo">
            <img src={appLogo} alt="Pharma App Logo" className="app-logo" />
            <span style={{ marginLeft: "10px", fontWeight: "bold" }}>Pharma App</span>
          </div>
          
          <ul className="navbar-links">
            <li><a href="#">Accueil</a></li>
            <li><a href="#">Services</a></li>
            <li><a href="#">À propos</a></li>
            <li>                        </li>
            
          </ul>
          
          <a href="#" className="navbar-cta" onClick={(e) => { e.preventDefault(); navigate("/login"); }}>
            Prendre Rendez-vous
          </a>
        </div>
      </nav>
      
      {/* Hero Section with Pills Animation */}
      <section className="hero-section">
        <div className="pills-animation"></div>
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">Votre santé est notre priorité</h1>
            <p className="hero-subtitle">Gérez vos médicaments et vos ordonnances facilement avec notre solution de gestion pharmaceutique.</p>
            <button className="hero-cta" onClick={() => navigate("/login")}>
              Se connecter
            </button>
          </div>
          
          <div className="hero-image">
            <img src={pharmacyLogo} alt="Équipe pharmaceutique" />
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <div className="features-grid">
         
            
            
           
          </div>
        </div>
      </section>
    </div>
  );
}
