import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Tabs, Tab, Alert } from 'react-bootstrap';
import axios from 'axios';
import '../Styles/HistoriquePharmacien.css';

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
    };
  }[];
}

export default function HistoriquePharmacien() {
  const [paniers, setPaniers] = useState<Panier[]>([]);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const calculateTotal = (lignesPanier: Panier['lignesPanier']) => {
    return lignesPanier.reduce((total, ligne) => 
      total + (ligne.medicament.prix_hospitalier * ligne.quantite), 0
    );
  };

  const calculateTotalCommande = (lignesCommande: Commande['lignesCommande']) => {
    return lignesCommande.reduce((total, ligne) => 
      total + (ligne.medicament.prix_hospitalier * ligne.quantite), 0
    );
  };

  // Rename the variables to be more descriptive
  const paniersVendus = paniers?.filter(panier => panier && panier.vendu) || [];
  const paniersEnCours = paniers?.filter(panier => panier && !panier.vendu) || [];

  return (
    <div className="historique-container">
      <Container fluid>
        <h2 className="historique-title">Historique des Commandes et Ventes</h2>
        
        {error && <Alert variant="danger">{error}</Alert>}
        
        {loading ? (
          <div className="loading-spinner">Chargement...</div>
        ) : (
          <Tabs defaultActiveKey="ventes" className="mb-3">
            <Tab eventKey="ventes" title={`Ventes (${paniers.length})`}>
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
                              <span>{ligne.medicament?.nom || 'Médicament inconnu'}</span>
                              <span>x{ligne.quantite}</span>
                              <span>{(ligne.medicament?.prix_hospitalier || 0) * ligne.quantite} DHS</span>
                            </div>
                          ))}
                        </div>
                        <div className="total-row">
                          <strong>Total:</strong>
                          <strong>{calculateTotal(panier.lignesPanier || [])} DHS</strong>
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}
            </Tab>
            <Tab eventKey="commandes" title={`Commandes (${commandes.length})`}>
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
                              <span>{ligne.medicament?.nom || 'Médicament inconnu'}</span>
                              <span>x{ligne.quantite}</span>
                              <span>{(ligne.medicament?.prix_hospitalier || 0) * ligne.quantite} DHS</span>
                            </div>
                          ))}
                        </div>
                        <div className="total-row">
                          <strong>Total:</strong>
                          <strong>{calculateTotalCommande(commande.lignesCommande || [])} DHS</strong>
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              )}
            </Tab>
          </Tabs>
        )}
      </Container>
    </div>
  );
} 