import { useNavigate } from "react-router-dom"; // Assure-toi d'importer useNavigate
import "../Styles/PharmacienDashboard.css";
import { useState } from "react";

export default function PharmacienDashboard() {
  const navigate = useNavigate(); // Déclarer useNavigate pour la redirection

  const [searchTerm, setSearchTerm] = useState("");
  const [searchType] = useState("medicament");

  // Données fictives des médicaments récents
  const medicaments = [
    { id: 1, nom: "Aspirine", prix: "16.70dhs", quantite: 120, exp: "06/26" },
    { id: 2, nom: "Advil", prix: "33.00dhs", quantite: 170, exp: "08/26" },
    { id: 3, nom: "Valium", prix: "22.70dhs", quantite: 16, exp: "07/26" },
    { id: 4, nom: "Dafalgan", prix: "14.90dhs", quantite: 140, exp: "06/26" },
  ];

  // Filtrer les médicaments en fonction du terme de recherche
  const filteredMedicaments = medicaments.filter((medicament) =>
    medicament.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="profile"></div>
        <nav className="menu">
          <button>🏠 Tableau de bord</button>
          {/* Rediriger vers la page "Mes Médicaments" lorsque l'utilisateur clique */}
          <button onClick={() => navigate('/mes-medicaments')}>💊 Mes Médicaments</button>
          <button>🧺 Mon Panier</button>
          <button>📦 Commandes</button>
          <button>🧾 Historique</button>
        </nav>
      </aside>

      <main className="dashboard-main">
        <h2>Dashbord Pharmacien</h2>

        <div className="search-bar">
          <input
            type="text"
            placeholder={`Rechercher ${searchType === "medicament" ? "un médicament" : "un fournisseur"}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
              ? filteredMedicaments.map((m) => (
                  <tr key={m.id}>
                    <td
                      onClick={() => navigate(`/mes-medicaments/${m.id}`)} // Redirige vers le détail du médicament
                      style={{ cursor: "pointer", color: "#007bff" }}
                    >
                      {m.nom}
                    </td>
                    <td>{m.prix}</td>
                    <td>{m.quantite}</td>
                    <td>{m.exp}</td>
                  </tr>
                ))
              : null // Tu peux ajouter ici le rendu des fournisseurs si nécessaire
            }
          </tbody>
        </table>
      </main>
    </div>
  );
}
