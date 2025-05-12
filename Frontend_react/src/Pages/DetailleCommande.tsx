import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Row, Col, Badge, Table } from 'react-bootstrap';
import { ArrowLeft, Clock, Person, Truck, CheckCircle } from 'react-bootstrap-icons';
import { useNavigate, useParams } from 'react-router-dom';
import '../Styles/DetailleCommande.css';

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
      prix_public: number;
      prix_hospitalier: number;
    };
  }[];
  montant: number;
}

const DetailleCommande: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [commande, setCommande] = useState<Commande | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommandeDetails = async () => {
      if (!id) {
        setError('ID de commande non trouvé');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        
        console.log('Fetching command details for ID:', id);
        
        const response = await fetch(`http://localhost:8080/commandes/${id}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          const errorData = await response.text();
          console.error('Error response:', errorData);
          throw new Error(`Erreur lors de la récupération des détails de la commande: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received data:', data);

        // Calculate total amount using prix_hospitalier instead of prix_public
        const totalAmount = data.lignesCommande.reduce((sum: number, ligne: any) => {
          const prix = ligne.medicament.prix_hospitalier || 0;
          return sum + (ligne.quantite * prix);
        }, 0);

        const processedData: Commande = {
          ...data,
          montant: totalAmount
        };

        console.log('Processed data:', processedData);
        setCommande(processedData);
      } catch (error) {
        console.error('Error fetching command details:', error);
        setError(error instanceof Error ? error.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchCommandeDetails();
  }, [id]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      console.log('Updating command status:', { id, newStatus });
      
      const response = await fetch(`http://localhost:8080/commandes/${id}/status`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error response:', errorData);
        throw new Error(`Erreur lors de la mise à jour du statut: ${response.status}`);
      }

      // Refresh command details
      const updatedResponse = await fetch(`http://localhost:8080/commandes/${id}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        const totalAmount = updatedData.lignesCommande.reduce((sum: number, ligne: any) => 
          sum + (ligne.quantite * ligne.medicament.prix_hospitalier), 0);
        
        setCommande({
          ...updatedData,
          montant: totalAmount
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setError(error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="commande-details-container">
        <Container fluid className="main-container pt-4">
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
            <p className="mt-3">Chargement des détails de la commande...</p>
          </div>
        </Container>
      </div>
    );
  }

  if (error) {
    return (
      <div className="commande-details-container">
        <Container fluid className="main-container pt-4">
          <div className="text-center">
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
            <Button variant="primary" onClick={() => navigate(-1)}>Retour</Button>
          </div>
        </Container>
      </div>
    );
  }

  if (!commande) {
    return (
      <div className="commande-details-container">
        <Container fluid className="main-container pt-4">
          <div className="text-center">
            <div className="alert alert-warning" role="alert">
              Commande non trouvée
            </div>
            <Button variant="primary" onClick={() => navigate(-1)}>Retour</Button>
          </div>
        </Container>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "EN_ATTENTE":
        return <Badge bg="warning" className="status-badge"><Clock className="me-1" /> En Attente</Badge>;
      case "EN_COURS_DE_LIVRAISON":
        return <Badge bg="info" className="status-badge"><Truck className="me-1" /> Expédiée</Badge>;
      case "LIVREE":
        return <Badge bg="success" className="status-badge"><CheckCircle className="me-1" /> Livré</Badge>;
      default:
        return <Badge bg="secondary" className="status-badge">{status}</Badge>;
    }
  };

  return (
    <div className="commande-details-container">
      <div className="commande-header">
        <Container fluid>
          <div className="d-flex justify-content-between align-items-center">
            <Button 
              variant="link" 
              className="back-button"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="me-2" /> Retour
            </Button>
            <h2 className="commande-title">Détails de la commande #{commande.id}</h2>
          </div>
        </Container>
      </div>
      
      <Container fluid className="main-container pt-4">
        <Row>
          <Col lg={{ span: 10, offset: 1 }}>
            <Card className="info-card mb-4">
              <Card.Body>
                <Row>
                  <Col md={4}>
                    <div className="info-section">
                      <h4><Person className="me-2" />Pharmacien</h4>
                      <p className="info-value">{commande.pharmacien.prenom} {commande.pharmacien.nom}</p>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="info-section">
                      <h4><Clock className="me-2" />Date de commande</h4>
                      <p className="info-value">
                        {new Date(commande.dateCommande).toLocaleDateString('fr-FR')} à{' '}
                        {new Date(commande.dateCommande).toLocaleTimeString('fr-FR')}
                      </p>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="info-section">
                      <h4>Statut</h4>
                      <div className="info-value">
                        {getStatusBadge(commande.statut)}
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="products-card mb-4">
              <Card.Body>
                <h3 className="card-title mb-4">Produits commandés</h3>
                <Table responsive hover className="products-table">
                  <thead>
                    <tr>
                      <th>Produit</th>
                      <th className="text-center">Quantité</th>
                      <th className="text-end">Prix Hospitalier unitaire</th>
                      <th className="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commande.lignesCommande.map((ligne) => {
                      const prixUnitaire = ligne.medicament.prix_hospitalier || 0;
                      const total = prixUnitaire * ligne.quantite;
                      return (
                        <tr key={ligne.id}>
                          <td>{ligne.medicament.nom}</td>
                          <td className="text-center">{ligne.quantite}</td>
                          <td className="text-end">{prixUnitaire.toFixed(2)} DHS</td>
                          <td className="text-end">{total.toFixed(2)} DHS</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="text-end"><strong>Total</strong></td>
                      <td className="text-end"><strong>{commande.montant.toFixed(2)} DHS</strong></td>
                    </tr>
                  </tfoot>
                </Table>
              </Card.Body>
            </Card>

            {commande.statut === "EN_ATTENTE" && (
              <Card className="actions-card">
                <Card.Body>
                  <h4 className="mb-4">Actions</h4>
                  <div className="d-flex justify-content-center">
                    <Button 
                      variant="info" 
                      size="lg"
                      onClick={() => handleUpdateStatus("EN_COURS_DE_LIVRAISON")}
                    >
                      <Truck className="me-2" />
                      Expédier
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default DetailleCommande; 