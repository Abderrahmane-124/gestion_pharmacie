import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Row, Col } from 'react-bootstrap';
import { CheckCircleFill, Receipt, ArrowLeft, Shop } from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';
import '../Styles/ConfirmationCommande.css';

interface CartItem {
  id: number;
  name: string;
  dosage: string;
  price: number;
  quantity: number;
}

const ConfirmationCommande: React.FC = () => {
  const navigate = useNavigate();
  const currentDate = new Date().toLocaleDateString('fr-FR');
  const currentTime = new Date().toLocaleTimeString('fr-FR');
  const commandeId = Math.floor(100000 + Math.random() * 900000);
  
  const [purchasedItems, setPurchasedItems] = useState<CartItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    // Récupérer la dernière commande du sessionStorage (sauvegardée par le panier)
    const lastPurchase = sessionStorage.getItem('lastPharmacyPurchase');
    
    if (lastPurchase) {
      try {
        const purchaseData = JSON.parse(lastPurchase);
        setPurchasedItems(purchaseData.items || []);
        setTotalAmount(purchaseData.total || 0);
      } catch (error) {
        console.error("Erreur lors du chargement des données d'achat:", error);
      }
    }
    
    // Sauvegarder la commande dans l'historique
    saveOrderToHistory();
  }, []);
  
  // Fonction pour sauvegarder la commande dans l'historique
  const saveOrderToHistory = () => {
    const lastPurchase = sessionStorage.getItem('lastPharmacyPurchase');
    
    if (lastPurchase) {
      // Récupérer l'historique existant
      const historyString = localStorage.getItem('pharmacyOrderHistory');
      let history = historyString ? JSON.parse(historyString) : [];
      
      // Ajouter la nouvelle commande
      const newOrder = {
        id: commandeId,
        date: new Date().toISOString(),
        items: JSON.parse(lastPurchase).items || [],
        total: JSON.parse(lastPurchase).total || 0,
        paymentMethod: 'Espèces'
      };
      
      history.push(newOrder);
      
      // Sauvegarder l'historique mis à jour
      localStorage.setItem('pharmacyOrderHistory', JSON.stringify(history));
      
      // Nettoyer le dernier achat
      sessionStorage.removeItem('lastPharmacyPurchase');
    }
  };
  
  const handleNewOrder = () => {
    navigate('/mes-medicaments');
  };

  return (
    <div className="confirmation-container">
      <div className="panier-header">
        <Container fluid>
          <div className="d-flex justify-content-between align-items-center">
            <Button 
              variant="link" 
              className="back-button"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="me-2" /> Retour
            </Button>
          </div>
        </Container>
      </div>
      
      <Container fluid className="main-container pt-4">
        <div className="text-center mb-4">
          <CheckCircleFill size={60} className="text-success mb-3" />
          <h2 className="confirmation-title">Commande passée avec succès !</h2>
          <p className="confirmation-subtitle">Votre commande a été traitée avec succès</p>
        </div>

        <Row>
          <Col lg={{ span: 8, offset: 2 }}>
            <Card className="confirmation-card mb-4">
              <Card.Body>
                <h3 className="mb-4">Détails de la commande</h3>
                
                <Row className="mb-3">
                  <Col md={6}>
                    <p className="detail-label">Numéro de commande</p>
                    <p className="detail-value">#{commandeId}</p>
                  </Col>
                  <Col md={6}>
                    <p className="detail-label">Date & Heure</p>
                    <p className="detail-value">{currentDate} à {currentTime}</p>
                  </Col>
                </Row>
                
                <Row className="mb-3">
                  <Col md={6}>
                    <p className="detail-label">Montant total</p>
                    <p className="detail-value">{totalAmount.toFixed(2)} DHS</p>
                  </Col>
                  <Col md={6}>
                    <p className="detail-label">Méthode de paiement</p>
                    <p className="detail-value">Espèces</p>
                  </Col>
                </Row>
                
                <Row>
                  <Col md={12}>
                    <p className="detail-label">Status</p>
                    <p className="status-complete">
                      <CheckCircleFill className="me-2" /> Terminé
                    </p>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="confirmation-card mb-4">
              <Card.Body>
                <h3 className="mb-4">Récapitulatif de la commande</h3>
                
                <div className="product-summary">
                  {purchasedItems.length > 0 ? (
                    purchasedItems.map((item, index) => (
                      <div key={index} className="product-item">
                        <span>{item.name} {item.dosage} ({item.quantity})</span>
                        <span>{(item.price * item.quantity).toFixed(2)} DHS</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-3 text-muted">
                      <div>Aucun produit dans l'historique</div>
                    </div>
                  )}
                  
                  <div className="product-total">
                    <span>Total</span>
                    <span>{totalAmount.toFixed(2)} DHS</span>
                  </div>
                </div>
              </Card.Body>
            </Card>

            <div className="action-buttons text-center">
              <Button 
                variant="outline-primary" 
                className="action-button outline-primary" 
                onClick={() => navigate('/dashboard-pharmacien')}
                style={{ 
                  borderRadius: '8px',
                  borderWidth: '1px',
                  padding: '8px 16px'
                }}
              >
                <ArrowLeft className="me-2" /> Tableau de bord
              </Button>
              <Button 
                variant="outline-success" 
                className="action-button outline-success" 
                style={{ 
                  borderRadius: '8px',
                  borderWidth: '1px',
                  padding: '8px 16px'
                }}
              >
                <Receipt className="me-2" /> Imprimer facture
              </Button>
              <Button 
                variant="success" 
                className="action-button success" 
                onClick={handleNewOrder}
                style={{ 
                  borderRadius: '8px',
                  borderWidth: '1px',
                  padding: '8px 16px'
                }}
              >
                <Shop className="me-2" /> Nouvelle commande
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ConfirmationCommande; 