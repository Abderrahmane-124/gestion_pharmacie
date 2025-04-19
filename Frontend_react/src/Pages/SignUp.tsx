import { useState } from "react";
import { useNavigate } from "react-router-dom"; // 🧭 pour redirection
import "../Styles/SignUp.css";

export default function SignUp() {
  const [role, setRole] = useState("Fournisseur");
  const navigate = useNavigate(); // 🔁

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 👉 logiques selon le rôle
    if (role === "Pharmacien") {
      navigate("/dashboard-pharmacien");
    } else {
      navigate("/dashboard-fournisseur");
    }
  };

  return (
    <div className="signup-container">
      <h1>Sign Up</h1>

      <div className="toggle-buttons">
        <button className="inactive">Connexion</button>
        <button className="active">Inscription</button>
      </div>

      <form className="signup-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <input type="text" placeholder="Nom" required />
          <input type="text" placeholder="Prénom" required />
        </div>

        <input type="email" placeholder="Email" required />
        <input type="password" placeholder="Mot de passe" required />

        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="Fournisseur">Fournisseur</option>
          <option value="Pharmacien">Pharmacien</option>
        </select>

        <input type="text" placeholder="Ville" required />
        <input type="text" placeholder="Numéro" required />

        <button type="submit" className="submit-btn">Sign Up</button>
      </form>
    </div>
  );
}
