import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaSearch } from "react-icons/fa";
import "../Styles/FournisseurMedicaments.css";

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

export default function FournisseurMedicaments() {
  const { fournisseurId } = useParams();
  const [medicaments, setMedicaments] = useState<Medicament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [quantities, setQuantities] = useState<{[key: number]: number}>({});
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [showCommandes, setShowCommandes] = useState(false);
  const [selectedMedicament, setSelectedMedicament] = useState<Medicament | null>(null);
  const navigate = useNavigate();

  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[-\s]/g, '');
  };

  const fetchMedicaments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8080/medicaments/fournisseur/${fournisseurId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const medicamentsEnVente = response.data.filter((med: Medicament) => med.en_vente);
      setMedicaments(medicamentsEnVente);
    } catch (error) {
      console.error("Error fetching medicaments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommandes = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No token found in localStorage');
        alert('Session expirée. Veuillez vous reconnecter.');
        navigate('/login');
        return;
      }

      const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
      
      const response = await axios.get("http://localhost:8080/commandes/current_pharmacien", {
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.data) {
        console.log('Response data is empty or null');
        setCommandes([]);
        return;
      }
      
      const commandesData = Array.isArray(response.data) ? response.data : 
                           (response.data.content ? response.data.content : []);
      
      const filteredCommandes = commandesData.filter(
        (cmd: Commande) => cmd.statut === "EN_COURS_DE_CREATION"
      );
      
      setCommandes(filteredCommandes);
    } catch (error: any) {
      console.error("Error fetching commandes:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response,
        status: error.response?.status
      });

      if (error.response?.status === 401) {
        alert('Session expirée. Veuillez vous reconnecter.');
        navigate('/login');
      } else {
        alert('Erreur lors de la récupération des commandes');
      }
      
      setCommandes([]);
    }
  };

  useEffect(() => {
    fetchMedicaments();
  }, [fournisseurId]);

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
        fetchCommandes();
      }
    } catch (error: any) {
      console.error("Error adding medicament to commande:", error);
      if (error.response) {
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

      if (response.status === 200 || response.status === 201) {
        alert("Nouvelle commande créée avec succès");
        setShowCommandes(false);
        setSelectedMedicament(null);
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

  const filteredMedicaments = medicaments.filter((m) =>
    normalizeText(m.nom).includes(normalizeText(searchTerm))
  );

  return (
    <div className="fournisseur-medicaments-container">
      <div className="header">
        <h2>Médicaments Disponibles</h2>
        <button className="back-button" onClick={() => navigate(-1)}>
          Retour
        </button>
      </div>

      <div className="search-bar">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Rechercher un médicament..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <div className="medicaments-grid">
          {filteredMedicaments.length > 0 ? (
            filteredMedicaments.map((med) => (
              <div 
                key={med.id} 
                className="medicament-card"
                onClick={(e) => {
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
                <div className="medicament-details">
                  <span className="price">{med.prix_hospitalier} DH</span>
                  <span className="quantity">Stock: {med.quantite}</span>
                </div>
                <div className="expiration">
                  Date d'expiration: {new Date(med.date_expiration).toLocaleDateString()}
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
            <p className="no-results">Aucun médicament disponible trouvé</p>
          )}
        </div>
      )}

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
    </div>
  );
} 