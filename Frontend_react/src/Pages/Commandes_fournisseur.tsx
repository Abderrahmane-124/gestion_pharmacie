import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/Commandes_fournisseur.css";
import axios from "axios";
import { FaSearch, FaFilter } from "react-icons/fa";

interface Commande {
  id: number;
  dateCommande: string;
  statut: string;
  pharmacien: {
    id: number;
    nom: string;
    prenom: string;
  };
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

export default function Commandes() {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [filteredCommandes, setFilteredCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("EN_COURS_DE_LIVRAISON");
  const navigate = useNavigate();

  const fetchCommandes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get("http://localhost:8080/commandes/current_fournisseur", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      // Filter out orders with status EN_COURS_DE_CREATION
      const filteredCommandes = response.data.filter(
        (commande: Commande) => commande.statut !== "EN_COURS_DE_CREATION"
      );
      setCommandes(filteredCommandes);
      setFilteredCommandes(filteredCommandes);
    } catch (error) {
      console.error("Error fetching commandes:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add useEffect for filtering
  useEffect(() => {
    let filtered = commandes;

    // Filter by status
    if (selectedStatus !== "ALL") {
      filtered = filtered.filter(commande => commande.statut === selectedStatus);
    }

    // Filter by search term
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(commande => 
        `${commande.pharmacien.nom} ${commande.pharmacien.prenom}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        commande.id.toString().includes(searchTerm)
      );
    }

    setFilteredCommandes(filtered);
  }, [commandes, selectedStatus, searchTerm]);

  const handleUpdateStatus = async (commandeId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:8080/commandes/${commandeId}/status`,
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      // Refresh the commands list after updating
      fetchCommandes();
    } catch (error) {
      console.error("Error updating command status:", error);
    }
  };

  const handleMarkAsDelivered = async (commandeId: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:8080/commandes/${commandeId}/livree`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      // Refresh the commands list after updating
      await fetchCommandes();
    } catch (error) {
      console.error("Error marking command as delivered:", error);
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
        return "En Attente";
      case "EN_COURS_DE_LIVRAISON":
        return "En Cours De Livraison";
      case "LIVREE":
        return "Livrée";
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

  if (loading) {
    return <div className="loading">Chargement des commandes...</div>;
  }

  return (
    <div className="commandes-container">
      <div className="commandes-header">
        <h1>Commandes Reçues</h1>
        <button className="back-btn" onClick={() => navigate('/dashboard-Fornisseur')}>
          Retour au tableau de bord
        </button>
      </div>

      <div className="commandes-sidebar">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher par pharmacien ou numéro de commande..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-section">
          <h3><FaFilter /> Filtrer par statut</h3>
          <div className="status-filters">
            <button
              className={`status-filter-btn ${selectedStatus === "ALL" ? "active" : ""}`}
              onClick={() => setSelectedStatus("ALL")}
            >
              Toutes les commandes
            </button>
            <button
              className={`status-filter-btn ${selectedStatus === "EN_ATTENTE" ? "active" : ""}`}
              onClick={() => setSelectedStatus("EN_ATTENTE")}
            >
              En attente
            </button>
            <button
              className={`status-filter-btn ${selectedStatus === "EN_COURS_DE_LIVRAISON" ? "active" : ""}`}
              onClick={() => setSelectedStatus("EN_COURS_DE_LIVRAISON")}
            >
              En cours de livraison
            </button>
            <button
              className={`status-filter-btn ${selectedStatus === "LIVREE" ? "active" : ""}`}
              onClick={() => setSelectedStatus("LIVREE")}
            >
              Livrées
            </button>
          </div>
        </div>
      </div>

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
              <p className="date">Date: {formatDate(commande.dateCommande)}</p>
              <p className="pharmacien">Pharmacien: {commande.pharmacien.prenom} {commande.pharmacien.nom}</p>
            </div>

            <div className="commande-items">
              <h4>Produits commandés:</h4>
              <ul>
                {commande.lignesCommande.map((ligne) => (
                  <li key={ligne.id}>
                    <span className="item-name">{ligne.medicament.nom}</span>
                    <span className="item-quantity">x{ligne.quantite}</span>
                    <span className="item-price">
                      {ligne.medicament.prix_hospitalier 
                        ? (ligne.medicament.prix_hospitalier * ligne.quantite).toFixed(2) 
                        : (ligne.medicament.prix_unitaire * ligne.quantite).toFixed(2)} DH
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="commande-total">
              <p>Total: {
                commande.lignesCommande.reduce(
                  (total, ligne) => total + (
                    ligne.medicament.prix_hospitalier 
                      ? ligne.medicament.prix_hospitalier * ligne.quantite
                      : ligne.medicament.prix_unitaire * ligne.quantite
                  ),
                  0
                ).toFixed(2)
              } DH</p>
            </div>

            {commande.statut === "EN_ATTENTE" && (
              <button 
                className="expedier-btn"
                onClick={() => handleUpdateStatus(commande.id, "EN_COURS_DE_LIVRAISON")}
              >
                Expédier
              </button>
            )}
            {commande.statut === "EN_COURS_DE_LIVRAISON" && (
              <button 
                className="livrer-btn"
                onClick={() => handleMarkAsDelivered(commande.id)}
              >
                Marquer comme Livré
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 