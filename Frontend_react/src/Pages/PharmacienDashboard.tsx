import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/PharmacienDashboard.css";
import { FaSearch } from "react-icons/fa";
import axios from "axios";

interface Medicament {
  id: number;
  nom: string;
  prix_hospitalier: number;
  quantite: number;
  date_expiration: string;
  en_vente: boolean;
  utilisateur: {
    id: number;
    nom: string;
    prenom: string;
  };
}

interface Fournisseur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
}

export default function PharmacienDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<"medicament" | "fournisseur">("medicament");
  const [activeView, setActiveView] = useState<"medicaments" | "fournisseurs">("medicaments");
  const [medicamentsEnVente, setMedicamentsEnVente] = useState<Medicament[]>([]);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchMedicamentsEnVente = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get("http://localhost:8080/medicaments/en-vente", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setMedicamentsEnVente(response.data);
    } catch (error) {
      console.error("Error fetching medicaments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFournisseurs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get("http://localhost:8080/api/utilisateurs/fournisseurs", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setFournisseurs(response.data);
    } catch (error) {
      console.error("Error fetching fournisseurs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeView === "medicaments") {
      fetchMedicamentsEnVente();
    } else {
      fetchFournisseurs();
    }
  }, [activeView]);

  const filteredMedicaments = medicamentsEnVente.filter((m) =>
    m.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFournisseurs = fournisseurs.filter((f) =>
    (f.nom + " " + f.prenom).toLowerCase().includes(searchTerm.toLowerCase())
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

        <div className="catalog-section">
          <div className="view-toggle">
            <button 
              className={activeView === "medicaments" ? "active" : ""}
              onClick={() => setActiveView("medicaments")}
            >
              Médicaments en vente
            </button>
            <button 
              className={activeView === "fournisseurs" ? "active" : ""}
              onClick={() => setActiveView("fournisseurs")}
            >
              Fournisseurs
            </button>
          </div>

          {loading ? (
            <p>Chargement...</p>
          ) : activeView === "medicaments" ? (
            <div className="medicaments-cards">
              {filteredMedicaments.length > 0 ? (
                filteredMedicaments.map((med) => (
                  <div key={med.id} className="medicament-card" onClick={() => navigate(`/medicament/${med.id}`)}>
                    <h3>{med.nom}</h3>
                    <p className="fournisseur">
                      Fournisseur: {med.utilisateur?.nom} {med.utilisateur?.prenom}
                    </p>
                    <div className="medicament-details">
                      <span className="price">{med.prix_hospitalier} DH</span>
                      <span className="quantity">Stock: {med.quantite}</span>
                    </div>
                    <button className="add-to-cart">Ajouter au panier</button>
                  </div>
                ))
              ) : (
                <p className="no-results">Aucun médicament en vente trouvé</p>
              )}
            </div>
          ) : (
            <div className="fournisseurs-table">
              <table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Prénom</th>
                    <th>Email</th>
                    <th>Téléphone</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFournisseurs.length > 0 ? (
                    filteredFournisseurs.map((f) => (
                      <tr key={f.id}>
                        <td>{f.nom}</td>
                        <td>{f.prenom}</td>
                        <td>{f.email}</td>
                        <td>{f.telephone}</td>
                        <td>
                          <button onClick={() => navigate(`/fournisseur/${f.id}`)}>Voir produits</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5}>Aucun fournisseur trouvé</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
