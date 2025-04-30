import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/PharmacienDashboard.css";
import { FaSearch } from "react-icons/fa";

export default function PharmacienDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<"medicament" | "fournisseur">("medicament");
  const navigate = useNavigate();

  const medicaments = [
    { nom: "Aspirine", prix: "16.70dhs", quantite: 120, exp: "06/26" },
    { nom: "Advil", prix: "33.00dhs", quantite: 170, exp: "08/26" },
    { nom: "Valium", prix: "22.70dhs", quantite: 16, exp: "07/26" },
    { nom: "Dafalgan", prix: "14.90dhs", quantite: 140, exp: "06/26" },
  ];

  const fournisseurs = [
    { nom: "Hind", contact: "06 23 45 67 89" },
    { nom: "Abderrahmane", contact: "06 23 45 67 90" },
    { nom: "Robert", contact: "06 23 45 67 91" },
    { nom: "Asma", contact: "06 23 45 67 92" },
  ];

  const filteredMedicaments = medicaments.filter((m) =>
    m.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFournisseurs = fournisseurs.filter((f) =>
    f.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="profile"></div>
        <nav className="menu">
          <button>🏠 Tableau de bord</button>
          <button onClick={() => navigate("/mes-medicaments")}>💊 Mes Médicaments</button>
          <button onClick={() => navigate("/Panier")}>🧺 Mon Panier</button>
          <button>📦 Commandes</button>
          <button>🧾 Historique</button>
        </nav>
      </aside>

      <main className="dashboard-main">
        <h2>Dashboard Pharmacien</h2>

        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder={`Rechercher ${searchType === "medicament" ? "un médicament" : "un fournisseur"}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="search-options">
          <button onClick={() => setSearchType("medicament")}>Recherche Médicament</button>
          <button onClick={() => setSearchType("fournisseur")}>Recherche Fournisseur</button>
        </div>

        <div className="stats">
          <div className="card stock-card">
            <h3>En Stock</h3>
            <p className="value">779 <span>Produits</span></p>
          </div>

          <div className="card command-card">
            <h3>Commandes</h3>
            <p className="value">79 <span>En cours</span></p>
          </div>
        </div>

        <h3 className="section-title">
          {searchType === "medicament" ? "Médicaments Récents" : "Fournisseurs"}
        </h3>

        <table className="medicament-table">
          <thead>
            <tr>
              <th>{searchType === "medicament" ? "Nom" : "Fournisseur"}</th>
              <th>{searchType === "medicament" ? "Prix" : "Contact"}</th>
              {searchType === "medicament" && (
                <>
                  <th>Qté</th>
                  <th>Exp</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {searchType === "medicament"
              ? filteredMedicaments.map((m, idx) => (
                  <tr key={idx}>
                    <td>{m.nom}</td>
                    <td>{m.prix}</td>
                    <td>{m.quantite}</td>
                    <td>{m.exp}</td>
                  </tr>
                ))
              : filteredFournisseurs.map((f, idx) => (
                  <tr key={idx}>
                    <td>{f.nom}</td>
                    <td>{f.contact}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
