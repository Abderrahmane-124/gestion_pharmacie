import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/Commandes_pharmacien.css";
import axios from "axios";
import { FaSearch } from "react-icons/fa";

interface Commande {
  id: number;
  dateCommande: string;
  statut: string;
  fournisseur: {
    id: number;
    nom: string;
    prenom: string;
  };
  lignesCommande: {
    id: number;
    quantite: number;
    medicament: {
      id: number;
      nom: string;
      prix_unitaire: number;
      prix_hospitalier?: number;
    };
  }[];
}

export default function Commandes_pharmacien() {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("TOUS");
  const navigate = useNavigate();

  const fetchCommandes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get("http://localhost:8080/commandes/current_pharmacien", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Sort commandes in LIFO order (newest first)
      const sortedCommandes = response.data.sort((a: Commande, b: Commande) => 
        new Date(b.dateCommande).getTime() - new Date(a.dateCommande).getTime()
      );
      
      setCommandes(sortedCommandes);
    } catch (error) {
      console.error("Error fetching commandes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommandes();
  }, []);

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case "EN_ATTENTE":
        return "status-waiting";
      case "EN_COURS_DE_LIVRAISON":
        return "status-delivering";
      case "LIVREE":
        return "status-delivered";
      default:
        return "";
    }
  };

  const getStatusDisplay = (statut: string) => {
    switch (statut) {
      case "EN_ATTENTE":
        return "Commande envoyée";
      case "EN_COURS_DE_LIVRAISON":
        return "En Cours De Livraison";
      case "LIVREE":
        return "Livrée";
      case "EN_COURS_DE_CREATION":
        return "En cours de création";
      default:
        return statut.replace(/_/g, ' ');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSendCommande = async (commandeId: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:8080/commandes/${commandeId}/status`,
        { status: "EN_ATTENTE" },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      // Refresh the commands list after updating
      fetchCommandes();
    } catch (error) {
      console.error("Error sending command:", error);
      alert("Erreur lors de l'envoi de la commande");
    }
  };

  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[-\s]/g, '');
  };

  // Filtrer les commandes selon le terme de recherche et le statut sélectionné
  const filteredCommandes = commandes.filter((cmd) => {
    const matchesSearch = 
      searchTerm === "" || 
      cmd.id.toString().includes(searchTerm) || 
      normalizeText(`${cmd.fournisseur.nom} ${cmd.fournisseur.prenom}`).includes(normalizeText(searchTerm));
    
    const matchesStatus = 
      statusFilter === "TOUS" || 
      cmd.statut === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate total for a commande
  const calculateTotal = (commande: Commande) => {
    return commande.lignesCommande.reduce(
      (total, ligne) => total + ((ligne.medicament.prix_hospitalier || ligne.medicament.prix_unitaire) * ligne.quantite),
      0
    ).toFixed(2);
  };

  if (loading) {
    return <div className="loading">Chargement des commandes...</div>;
  }

  return (
    <div className="commandes-container">
      <div className="commandes-header">
        <h1>Mes Commandes</h1>
        <button className="back-btn" onClick={() => navigate('/dashboard-pharmacien')}>
          Retour au tableau de bord
        </button>
      </div>

      <div className="search-filter-container">
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher par n° commande ou fournisseur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="status-filter">
          <label htmlFor="status-select">Filtrer par statut:</label>
          <select
            id="status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="TOUS">Tous les statuts</option>
            <option value="EN_COURS_DE_CREATION">En cours de création</option>
            <option value="EN_ATTENTE">Commande envoyée</option>
            <option value="EN_COURS_DE_LIVRAISON">En cours de livraison</option>
            <option value="LIVREE">Livrée</option>
          </select>
        </div>
      </div>

      {filteredCommandes.length === 0 ? (
        <div className="no-results">Aucune commande trouvée</div>
      ) : (
        <div className="commandes-grid">
          {filteredCommandes.map((commande) => (
            <div key={commande.id} className="commande-card">
              <div className="commande-header">
                <h3>Commande #{commande.id}</h3>
                <span className={`status-badge ${getStatusColor(commande.statut)}`}>
                  {getStatusDisplay(commande.statut)}
                </span>
              </div>
              
              <div className="commande-info">
                <p className="date">
                  Date: {formatDate(commande.dateCommande)}
                </p>
                <p className="fournisseur" title={`${commande.fournisseur.nom} ${commande.fournisseur.prenom}`}>
                  Fournisseur: {commande.fournisseur.nom} {commande.fournisseur.prenom}
                </p>
              </div>

              <div className="commande-items">
                <h4>Produits commandés:</h4>
                <ul>
                  {commande.lignesCommande.map((ligne) => (
                    <li key={ligne.id}>
                      <span className="item-name" title={ligne.medicament.nom}>
                        {ligne.medicament.nom}
                      </span>
                      <span className="item-quantity">x{ligne.quantite}</span>
                      <span className="item-price">
                        {((ligne.medicament.prix_hospitalier || ligne.medicament.prix_unitaire) * ligne.quantite).toFixed(2)} DH
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="commande-total">
                <p>Total: {calculateTotal(commande)} DH</p>
              </div>

              {commande.statut === "EN_COURS_DE_CREATION" && (
                <button 
                  className="send-btn"
                  onClick={() => handleSendCommande(commande.id)}
                >
                  Envoyer la commande
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 