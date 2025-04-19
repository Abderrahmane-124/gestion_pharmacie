import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/Loginpage.css";
import { authService } from "../services/api";
import apiClient from "../services/api";
import { useAuth } from "../context/AuthContext";
import React from "react";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { setAuthInfo, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      // Clear any previous auth state
      logout();
      
      const response = await authService.login({
        email,
        motDePasse: password
      });
      
      // Get the token from the response
      const { token } = response.data;
      
      // Set the authorization header
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Make a simple GET request to verify the role
      try {
        const usersResponse = await apiClient.get('/api/utilisateurs');
        const users = usersResponse.data;
        
        // Find the current user by email
        let userRole = null;
        const currentUser = users.find((user: any) => user.email === email);
        
        if (currentUser && currentUser.role) {
          userRole = currentUser.role;
          console.log("User role:", userRole);
          
          // Create the user object
          const user = {
            email,
            role: userRole
          };
          
          // Set the auth info in context
          setAuthInfo(user, token);
          
          // Redirect based on role
          if (userRole === "PHARMACIEN") {
            navigate("/PharmacienDashboard");
          } else if (userRole === "FOURNISSEUR") {
            navigate("/FournisseurDashboard");
          } else {
            navigate("/");
          }
        } else {
          // Fallback if we can't determine the role
          setError("Unable to determine user role");
          setLoading(false);
        }
      } catch (error) {
        console.error("Error verifying user role:", error);
        setError("Error verifying user role");
        setLoading(false);
      }
    } catch (err) {
      setError("Invalid email or password");
      console.error("Login failed:", err);
      setLoading(false);
    }
  };

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

      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleLogin}>
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input 
          type="password" 
          placeholder="Mot de passe" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" className="primary" disabled={loading}>
          {loading ? "Connexion..." : "Se Connecter"}
        </button>
      </form>

      <div className="separator">OU</div>

      <div className="separator">Pas encore inscrit ?</div>
      <button className="secondary" onClick={() => navigate("/signup")}>
        Créer un compte
      </button>
    </div>
  );
}