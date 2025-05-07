import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/Commandes_fournisseur.css";
import axios from "axios";

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
    };
  }[];
}

export default function Commandes() {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
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
    } catch (error) {
      console.error("Error fetching commandes:", error);
    } finally {
      setLoading(false);
    }
  };

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
        <button className="back-btn" onClick={() => navigate('/dashboard-fournisseur')}>
          Retour au tableau de bord
        </button>
      </div>

      <div className="commandes-grid">
        {commandes.map((commande) => (
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
                    <span className="item-price">{ligne.medicament.prix_unitaire * ligne.quantite} DH</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="commande-total">
              <p>Total: {
                commande.lignesCommande.reduce(
                  (total, ligne) => total + (ligne.medicament.prix_unitaire * ligne.quantite),
                  0
                )
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