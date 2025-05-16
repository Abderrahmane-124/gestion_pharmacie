import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/PharmacienDashboard.css";
import { FaSearch } from "react-icons/fa";
import axios from "axios";
import { IoMdWarning } from "react-icons/io";

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

interface Commande {
  id: number;
  dateCreation: string;
  statut: string;
  fournisseur: {
    id: number;
    nom: string;
    prenom: string;
  };
}

interface Alerte {
  id: number;
  message: string;
  minimumQuantite: number;
  medicaments: Medicament[];
}

export default function PharmacienDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<"medicament" | "fournisseur">("medicament");
  const [activeView, setActiveView] = useState<"medicaments" | "fournisseurs">("medicaments");
  const [medicamentsEnVente, setMedicamentsEnVente] = useState<Medicament[]>([]);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [loading, setLoading] = useState(false);
  const [quantities, setQuantities] = useState<{[key: number]: number}>({});
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [showCommandes, setShowCommandes] = useState(false);
  const [selectedMedicament, setSelectedMedicament] = useState<Medicament | null>(null);
  const [alerteNotifications, setAlerteNotifications] = useState<{
    medicament: Medicament;
    alerte: Alerte;
  }[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Enlève les accents
      .replace(/[-\s]/g, ''); // Enlève les tirets et espaces
  };

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
      
      // Remove the initialization of quantities
      setQuantities({});
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
  
  const fetchCommandes = async () => {
    try {
      const token = localStorage.getItem('token');
      
      
      
      // Ensure token exists
      if (!token) {
        console.error('No token found in localStorage');
        alert('Session expirée. Veuillez vous reconnecter.');
        navigate('/login'); // Redirect to login page
        return;
      }

      // Remove any "Bearer " prefix if it exists in the token
      const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
      
      const response = await axios.get("http://localhost:8080/commandes/current_pharmacien", {
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      
      // Check if response.data exists and is not null
      if (!response.data) {
        console.log('Response data is empty or null');
        setCommandes([]);
        return;
      }
      
      // Ensure response.data is an array
      const commandesData = Array.isArray(response.data) ? response.data : 
                           (response.data.content ? response.data.content : []);
      
      // Filter commandes with status EN_COURS_DE_CREATION
      const filteredCommandes = commandesData.filter(
        (cmd: Commande) => cmd.statut === "EN_COURS_DE_CREATION"
      );
      
      console.log('Filtered commandes:', filteredCommandes);
      setCommandes(filteredCommandes);
    } catch (error: any) {
      console.error("Error fetching commandes:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response,
        status: error.response?.status
      });

      // Handle specific error cases
      if (error.response?.status === 401) {
        alert('Session expirée. Veuillez vous reconnecter.');
        navigate('/login');
      } else {
        alert('Erreur lors de la récupération des commandes');
      }
      
      setCommandes([]);
    }
  };

  const checkAlertes = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // First fetch all alertes
      const alertesResponse = await axios.get("http://localhost:8080/api/alertes", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const alertes: Alerte[] = alertesResponse.data;
      
      // Then check each alerte against medicaments in stock
      const notifications = [];
      
      for (const alerte of alertes) {
        for (const med of alerte.medicaments) {
          // Check if medicament quantity is at or below the minimum threshold
          if (med.quantite <= alerte.minimumQuantite) {
            notifications.push({
              medicament: med,
              alerte: alerte
            });
          }
        }
      }
      
      setAlerteNotifications(notifications);
    } catch (error) {
      console.error("Error checking alertes:", error);
    }
  };

  useEffect(() => {
    if (activeView === "medicaments") {
      fetchMedicamentsEnVente();
    } else {
      fetchFournisseurs();
    }
  }, [activeView]);

  useEffect(() => {
    checkAlertes();
    
    // Set up a timer to check alertes periodically (every 5 minutes)
    const interval = setInterval(checkAlertes, 300000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleQuantityChange = (medicamentId: number, value: number) => {
    setQuantities(prev => ({
      ...prev,
      [medicamentId]: value
    }));
  };

  const handleAddToCommande = (medicament: Medicament) => {
    const requestedQuantity = quantities[medicament.id];
    
    if (requestedQuantity <= 0) {
      alert("Veuillez sélectionner une quantité valide");
      return;
    }
    
    if (requestedQuantity > medicament.quantite) {
      alert(`Quantité insuffisante. Stock disponible: ${medicament.quantite}`);
      return;
    }
    
    setSelectedMedicament(medicament);
    fetchCommandes();
    setShowCommandes(true);
  };

  const handleCommandeSelect = async (commandeId: number) => {
    if (!selectedMedicament) return;
    
    try {
      const token = localStorage.getItem('token');
      
      // First check if the commande's fournisseur matches the medicament's fournisseur
      const selectedCommande = commandes.find(cmd => cmd.id === commandeId);
      if (!selectedCommande) {
        alert("Commande non trouvée");
        return;
      }

      if (selectedCommande.fournisseur.id !== selectedMedicament.utilisateur.id) {
        alert("Cette commande appartient à un autre fournisseur. Vous ne pouvez ajouter que des produits du même fournisseur.");
        return;
      }

      const response = await axios.post(
        `http://localhost:8080/lignes-commande/commande/${commandeId}`,
        {
          medicamentId: selectedMedicament.id,
          quantite: quantities[selectedMedicament.id]
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.status === 200 || response.status === 201) {
        alert("Médicament ajouté à la commande avec succès");
        setShowCommandes(false);
        setSelectedMedicament(null);
        // Optionally refresh the commandes list
        fetchCommandes();
      }
    } catch (error: any) {
      console.error("Error adding medicament to commande:", error);
      if (error.response) {
        // Handle specific error messages from the backend
        switch (error.response.status) {
          case 400:
            alert("Données invalides. Veuillez vérifier la quantité.");
            break;
          case 403:
            alert("Vous n'êtes pas autorisé à modifier cette commande.");
            break;
          case 404:
            alert("Commande ou médicament non trouvé.");
            break;
          default:
            alert("Erreur lors de l'ajout du médicament à la commande");
        }
      } else {
        alert("Erreur lors de l'ajout du médicament à la commande");
      }
    }
  };

  const handleCreateNewCommande = async () => {
    if (!selectedMedicament) return;
    
    try {
      const token = localStorage.getItem('token');
      
      console.log('Creating new commande with fournisseurId:', selectedMedicament.utilisateur.id);
      
      // Create new commande with the medicament's fournisseur and include the ligne commande
      const response = await axios.post(
        'http://localhost:8080/commandes',
        {
          fournisseurId: selectedMedicament.utilisateur.id,
          lignesCommande: [
            {
              medicamentId: selectedMedicament.id,
              quantite: quantities[selectedMedicament.id]
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Commande creation response:', response);

      if (response.status === 200 || response.status === 201) {
        alert("Nouvelle commande créée avec succès");
        setShowCommandes(false);
        setSelectedMedicament(null);
        // Refresh the commandes list
        fetchCommandes();
      }
    } catch (error: any) {
      console.error("Error creating new commande:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });

      if (error.response) {
        switch (error.response.status) {
          case 400:
            alert("Données invalides. Veuillez vérifier les informations.");
            break;
          case 403:
            alert("Vous n'êtes pas autorisé à créer une commande.");
            break;
          default:
            alert(`Erreur lors de la création de la commande: ${error.response.data?.message || 'Erreur inconnue'}`);
        }
      } else {
        alert("Erreur lors de la création de la commande");
      }
    }
  };

  const handleCardClick = (medicamentId: number) => {
    navigate(`/medicament/${medicamentId}`);
  };

  const filteredMedicaments = medicamentsEnVente.filter((m) =>
    normalizeText(m.nom).includes(normalizeText(searchTerm))
  );

  const filteredFournisseurs = fournisseurs.filter((f) =>
    normalizeText(`${f.nom}${f.prenom}`).includes(normalizeText(searchTerm))
  );

  return (
    <div className="dashboard-container">
      {alerteNotifications.length > 0 && (
        <div className="alertes-icon-container">
          <div className="alertes-icon" onClick={() => setShowNotifications(!showNotifications)}>
            <IoMdWarning />
            <span className="alerte-count">{alerteNotifications.length}</span>
          </div>
          
          {showNotifications && (
            <>
              <div className="alertes-overlay" onClick={() => setShowNotifications(false)}></div>
              <div className="alertes-dropdown">
                <h4>Alertes de stock</h4>
                {alerteNotifications.map((notification, index) => (
                  <div key={index} className="alerte-notification-item">
                    <div className="notification-header">
                      <strong>{notification.alerte.message}</strong>
                    </div>
                    <div className="notification-medicament">
                      <p className="med-name">
                        <strong>{notification.medicament.nom}</strong>
                      </p>
                      <p className="med-quantity">
                        Stock actuel: <span className="quantity-value">{notification.medicament.quantite}</span>
                      </p>
                      <p className="alerte-min">
                        Seuil d'alerte: <span className="threshold-value">{notification.alerte.minimumQuantite}</span>
                      </p>
                    </div>
                    <button className="view-med-btn" onClick={() => navigate(`/medicament/${notification.medicament.id}`)}>
                      Voir détails
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      
      <aside className="sidebar">
        <div className="profile"></div>
        <nav className="menu">
          <button>🏠 Tableau de bord</button>
          <button onClick={() => navigate("/mes-medicaments")}>💊 Mes Médicaments</button>
          <button onClick={() => navigate("/Panier")}>🧺 Mon Panier</button>
          <button onClick={() => navigate("/Commandes_pharmacien")}>📦 Commandes</button>
          <button onClick={() => navigate("/alerte")}>🚨 Alertes</button>
          <button onClick={() => navigate("/historique-pharmacien")}>🧾 Historique</button>
        </nav>
      </aside>

      <main className="dashboard-main">
        <h2>Dashboard Pharmacien</h2>

        <div className="stats">
          <div className="card stock-card">
            <h3>En Stock</h3>
            <p className="value">
              0 <span>Unites</span>
            </p>
          </div>

          <div className="card command-card">
            <h3>Commandes</h3>
            <p className="value">{commandes.length} <span>En cours</span></p>
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
            <>
              <div className="search-bar">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Rechercher un médicament..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    backgroundColor: 'white',
                    color: 'black',
                    width: '100%'
                  }}
                />
              </div>
              <div className="medicaments-cards">
                {filteredMedicaments.length > 0 ? (
                  filteredMedicaments.map((med) => (
                    <div 
                      key={med.id} 
                      className="medicament-card"
                      onClick={(e) => {
                        // Only navigate if the click is on the card itself, not on child elements
                        if (e.target === e.currentTarget || 
                            e.target instanceof HTMLElement && 
                            e.target.classList.contains('medicament-card') ||
                            e.target instanceof HTMLElement && 
                            e.target.tagName === 'H3' ||
                            e.target instanceof HTMLElement && 
                            e.target.tagName === 'P' ||
                            e.target instanceof HTMLElement && 
                            e.target.className === 'medicament-details' ||
                            e.target instanceof HTMLElement && 
                            e.target.className === 'price' ||
                            e.target instanceof HTMLElement && 
                            e.target.className === 'quantity') {
                          handleCardClick(med.id);
                        }
                      }}
                    >
                      <h3>{med.nom}</h3>
                      <p className="fournisseur">
                        Fournisseur: {med.utilisateur?.nom} {med.utilisateur?.prenom}
                      </p>
                      <div className="medicament-details">
                        <span className="price">{med.prix_hospitalier} DH</span>
                        <span className="quantity">Stock: {med.quantite}</span>
                      </div>
                      <div className="order-controls">
                        <div className="quantity-input-container">
                          <input 
                            id={`quantity-${med.id}`}
                            type="number" 
                            min="1" 
                            max={med.quantite}
                            value={quantities[med.id] || ''}
                            onChange={(e) => handleQuantityChange(med.id, parseInt(e.target.value))}
                            className="quantity-input"
                            style={{ 
                              backgroundColor: 'white', 
                              color: 'black',
                              width: '100px'
                            }}
                            placeholder="Quantité"
                            onClick={(e) => e.stopPropagation()} // Prevent click from bubbling up to the card
                          />
                        </div>
                        <button 
                          className="add-to-cart"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent click from bubbling up to the card
                            handleAddToCommande(med);
                          }}
                        >
                          Ajouter a la commande
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-results">Aucun médicament en vente trouvé</p>
                )}
              </div>
            </>
          ) : (
            <div className="fournisseurs-table">
              <div className="search-bar">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Rechercher un fournisseur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    backgroundColor: 'white',
                    color: 'black',
                    width: '100%'
                  }}
                />
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Prénom</th>
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
                        <td>{f.telephone}</td>
                        <td>
                          <button onClick={() => navigate(`/fournisseur/${f.id}`)}>Voir produits</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4}>Aucun fournisseur trouvé</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showCommandes && (
          <div className="commandes-overlay">
            <div className="commandes-modal">
              <h3>Choisir une commande en cours</h3>
              <p className="important-note">
                Une commande peut contenir les produits du même fournisseur uniquement.
                Une commande ne peut pas contenir des produits provenant de différents fournisseurs.
              </p>
              {commandes.length > 0 ? (
                <ul className="commandes-list">
                  {commandes.map(cmd => (
                    <li key={cmd.id} onClick={() => handleCommandeSelect(cmd.id)}>
                      <p>Commande #{cmd.id}</p>
                      <p>Date: {new Date(cmd.dateCreation).toLocaleDateString()}</p>
                      <p>Fournisseur: {cmd.fournisseur.nom} {cmd.fournisseur.prenom}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Aucune commande en cours de création trouvée</p>
              )}
              
              <div className="new-commande-section">
                <h1>Ou créer une nouvelle commande</h1>
                <button 
                  className="create-commande-btn"
                  onClick={handleCreateNewCommande}
                >
                  Créer une nouvelle commande
                </button>
              </div>

              <button className="close-modal" onClick={() => setShowCommandes(false)}>
                Fermer
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
