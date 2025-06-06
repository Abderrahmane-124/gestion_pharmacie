import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/SignUp.css";
import { authService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import React from "react";

export default function SignUp() {
  const navigate = useNavigate();
  const { setAuthInfo } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    motDePasse: "",
    ville: "",
    adresse: "", 
    telephone: "",
    role: "FOURNISSEUR" 
  });
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const response = await authService.register(formData);
      
      // Get the token from the response
      const { token } = response.data;
      
      // Create user object with role from form data
      const user = {
        email: formData.email,
        role: formData.role
      };
      
      // Save auth info in context
      setAuthInfo(user, token);
      
      // Redirect based on role
      if (formData.role === "PHARMACIEN") {
        navigate("/dashboard-pharmacien");
      } else if (formData.role === "FOURNISSEUR") {
        navigate("/dashboard-Fornisseur");
      } else {
        // Default fallback
        navigate("/");
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.response?.data?.message || "Une erreur est survenue lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  const handleBackHome = () => {
    navigate('/');
  };

  return (
    <div className="signup-container">
      <button onClick={handleBackHome} className="back-home-btn">
        <span>&#8592;</span> Accueil
      </button>
      
      <h1>Sign Up</h1>

    

      {error && <div className="error-message">{error}</div>}

      <form className="signup-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <input 
            type="text" 
            placeholder="Nom" 
            name="nom" 
            value={formData.nom} 
            onChange={handleChange} 
            required 
          />
          <input 
            type="text" 
            placeholder="Prénom" 
            name="prenom" 
            value={formData.prenom} 
            onChange={handleChange} 
            required 
          />
        </div>

        <input 
          type="email" 
          placeholder="Email" 
          name="email" 
          value={formData.email} 
          onChange={handleChange} 
          required 
        />
        <input 
          type="password" 
          placeholder="Mot de passe" 
          name="motDePasse" 
          value={formData.motDePasse} 
          onChange={handleChange} 
          required 
        />

        <input 
          type="text" 
          placeholder="Adresse" 
          name="adresse" 
          value={formData.adresse} 
          onChange={handleChange} 
          required 
        />

        
        <input 
          type="text" 
          placeholder="Numéro de téléphone" 
          name="telephone" 
          value={formData.telephone} 
          onChange={handleChange} 
        />

        <select 
          name="role" 
          value={formData.role} 
          onChange={handleChange}
        >
          <option value="FOURNISSEUR">Fournisseur</option>
          <option value="PHARMACIEN">Pharmacien</option>
        </select>

        <button 
          type="submit" 
          className="submit-btn" 
          disabled={loading}
        >
          {loading ? "Inscription en cours..." : "Sign Up"}
        </button>
      </form>
    </div>
    
  );
}