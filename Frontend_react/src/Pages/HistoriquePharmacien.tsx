import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Tabs, Tab, Alert, Button } from 'react-bootstrap';
import axios from 'axios';
import '../Styles/HistoriquePharmacien.css';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'react-bootstrap-icons';

interface Panier {
  id: number;
  dateCreation: string;
  vendu: boolean;
  lignesPanier: {
    id: number;
    quantite: number;
    medicament: {
      id: number;
      nom: string;
      prix_hospitalier: number;
      prix_public: number;
      quantite: number;
    };
  }[];
  pharmacien?: {
    id: number;
    nom: string;
    prenom: string;
  };
}

// Add this interface for Commandes
interface Commande {
  id: number;
  dateCreation: string;
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
      prix_hospitalier: number;
      prix_public?: number;
    };
  }[];
}

export default function HistoriquePharmacien() {
  const navigate = useNavigate();
  const [paniers, setPaniers] = useState<Panier[]>([]);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ventes' | 'commandes'>('ventes');

  const fetchPaniers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching paniers with token:', token); // Debug log

      const response = await axios.get('http://localhost:8080/api/paniers', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('API Response:', response.data); // Debug log

      // Check if response.data is an array
      if (Array.isArray(response.data)) {
        setPaniers(response.data);
      } else if (response.data && response.data.content) {
        // Handle paginated response
        setPaniers(response.data.content);
      } else {
        console.error('Unexpected response format:', response.data);
        setError("Format de réponse inattendu");
      }
    } catch (err: any) {
      console.error('Error fetching paniers:', err); // Debug log
      console.error('Error details:', {
        message: err.message,
        response: err.response,
        status: err.response?.status
      });
      
      if (err.response?.status === 401) {
        setError("Session expirée. Veuillez vous reconnecter.");
      } else {
        setError(err.response?.data?.message || "Erreur lors du chargement de l'historique");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCommandes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/commandes/current_pharmacien', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      // Filter only LIVREE status
      const commandesLivrees = response.data.filter((cmd: Commande) => cmd.statut === "LIVREE");
      setCommandes(commandesLivrees);
    } catch (err: any) {
      console.error('Error fetching commandes:', err);
      setError("Erreur lors du chargement des commandes");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchPaniers(), fetchCommandes()]);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Add this useEffect to log paniers state changes
  useEffect(() => {
    console.log('Current paniers state:', paniers);
  }, [paniers]);

  const calculateTotalHospitalier = (lignesPanier: Panier['lignesPanier']) => {
    return lignesPanier.reduce((total, ligne) => 
      total + ((ligne.medicament?.prix_hospitalier || 0) * ligne.quantite), 0
    );
  };

  const calculateTotalPublic = (lignesPanier: Panier['lignesPanier']) => {
    return lignesPanier.reduce((total, ligne) => 
      total + ((ligne.medicament?.prix_public || 0) * ligne.quantite), 0
    );
  };

  const calculateTotalCommandeHospitalier = (lignesCommande: Commande['lignesCommande']) => {
    return lignesCommande.reduce((total, ligne) => 
      total + ((ligne.medicament?.prix_hospitalier || 0) * ligne.quantite), 0
    );
  };

  const calculateTotalCommandePublic = (lignesCommande: Commande['lignesCommande']) => {
    return lignesCommande.reduce((total, ligne) => {
      const prixPublic = ligne.medicament?.prix_public || ligne.medicament?.prix_hospitalier || 0;
      return total + (prixPublic * ligne.quantite);
    }, 0);
  };

  // Rename the variables to be more descriptive
  const paniersVendus = paniers?.filter(panier => panier && panier.vendu) || [];
  const paniersEnCours = paniers?.filter(panier => panier && !panier.vendu) || [];

  return (
    <div className="historique-container">
      <Container fluid>
        <div className="header-card">
          <Button 
            variant="success" 
            className="home-button"
            onClick={() => navigate('/dashboard-pharmacien')}
            size="sm"
          >
            <ArrowLeft className="me-2" /> Page d'accueil
          </Button>
          
          <h2 className="historique-title centered">Historique des Commandes et Ventes</h2>
          
          {error && <Alert variant="danger">{error}</Alert>}
          
          {loading ? (
            <div className="loading-spinner">Chargement...</div>
          ) : (
            <>
              <div className="custom-tabs-container">
                <div className="custom-tabs-header">
                  <button 
                    className={`custom-tab ${activeTab === 'ventes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('ventes')}
                  >
                    Ventes ({paniers.length})
                  </button>
                  <button 
                    className={`custom-tab ${activeTab === 'commandes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('commandes')}
                  >
                    Commandes ({commandes.length})
                  </button>
                </div>
                
                <div className="custom-tabs-content">
                  {activeTab === 'ventes' && (
                    <div className="custom-tab-pane">
                      {paniers.length === 0 ? (
                        <Alert variant="info">Aucune vente effectuée</Alert>
                      ) : (
                        <div className="ventes-list">
                          {paniers.map(panier => (
                            <Card key={panier.id} className="commande-card">
                              <Card.Header>
                                <div className="d-flex justify-content-between align-items-center">
                                  <span>Vente #{panier.id}</span>
                                  <span>{new Date(panier.dateCreation).toLocaleDateString()}</span>
                                </div>
                              </Card.Header>
                              <Card.Body>
                                <div className="items-list">
                                  {panier.lignesPanier?.map(ligne => (
                                    <div key={ligne.id} className="item-row">
                                      <span className="item-name">{ligne.medicament?.nom || 'Médicament inconnu'}</span>
                                      <span className="item-quantity">x{ligne.quantite}</span>
                                      <div className="price-details">
                                        <div className="price-row">
                                          <span className="price-label">Prix hospitalier:</span>
                                          <span className="price-value">{(ligne.medicament?.prix_hospitalier || 0).toFixed(2)} DHS</span>
                                          <span className="total-value">{((ligne.medicament?.prix_hospitalier || 0) * ligne.quantite).toFixed(2)} DHS</span>
                                        </div>
                                        <div className="price-row">
                                          <span className="price-label">Prix public:</span>
                                          <span className="price-value">{(ligne.medicament?.prix_public || 0).toFixed(2)} DHS</span>
                                          <span className="total-value">{((ligne.medicament?.prix_public || 0) * ligne.quantite).toFixed(2)} DHS</span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="total-rows">
                                  <div className="total-row">
                                    <strong>Total hospitalier:</strong>
                                    <strong>{calculateTotalHospitalier(panier.lignesPanier || []).toFixed(2)} DHS</strong>
                                  </div>
                                  <div className="total-row">
                                    <strong>Total public:</strong>
                                    <strong>{calculateTotalPublic(panier.lignesPanier || []).toFixed(2)} DHS</strong>
                                  </div>
                                </div>
                              </Card.Body>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {activeTab === 'commandes' && (
                    <div className="custom-tab-pane">
                      {commandes.length === 0 ? (
                        <Alert variant="info">Aucune commande livrée</Alert>
                      ) : (
                        <div className="commandes-list">
                          {commandes.map(commande => (
                            <Card key={commande.id} className="commande-card">
                              <Card.Header>
                                <div className="d-flex justify-content-between align-items-center">
                                  <span>Commande #{commande.id}</span>
                                  <span>{new Date(commande.dateCreation).toLocaleDateString()}</span>
                                </div>
                                <div className="fournisseur-info">
                                  Fournisseur: {commande.fournisseur.nom} {commande.fournisseur.prenom}
                                </div>
                              </Card.Header>
                              <Card.Body>
                                <div className="items-list">
                                  {commande.lignesCommande?.map(ligne => (
                                    <div key={ligne.id} className="item-row">
                                      <span className="item-name">{ligne.medicament?.nom || 'Médicament inconnu'}</span>
                                      <span className="item-quantity">x{ligne.quantite}</span>
                                      <div className="price-details">
                                        <div className="price-row">
                                          <span className="price-label">Prix hospitalier:</span>
                                          <span className="price-value">{(ligne.medicament?.prix_hospitalier || 0).toFixed(2)} DHS</span>
                                          <span className="total-value">{((ligne.medicament?.prix_hospitalier || 0) * ligne.quantite).toFixed(2)} DHS</span>
                                        </div>
                                        <div className="price-row">
                                          <span className="price-label">Prix public:</span>
                                          <span className="price-value">
                                            {(ligne.medicament?.prix_public || ligne.medicament?.prix_hospitalier || 0).toFixed(2)} DHS
                                          </span>
                                          <span className="total-value">
                                            {((ligne.medicament?.prix_public || ligne.medicament?.prix_hospitalier || 0) * ligne.quantite).toFixed(2)} DHS
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="total-row">
                                  <strong>Total hospitalier:</strong>
                                  <strong>{calculateTotalCommandeHospitalier(commande.lignesCommande || []).toFixed(2)} DHS</strong>
                                </div>
                                <div className="total-row">
                                  <strong>Total public:</strong>
                                  <strong>{calculateTotalCommandePublic(commande.lignesCommande || []).toFixed(2)} DHS</strong>
                                </div>
                              </Card.Body>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </Container>
    </div>
  );
} 