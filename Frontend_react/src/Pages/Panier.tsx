import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Form, InputGroup, Badge } from 'react-bootstrap';
import { ExclamationTriangle, Dash, Plus, CartFill, ArrowLeft, Cash, Trash } from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../Styles/Panier.css';

interface Medicament {
  id: number;
  nom: string;
  prix_hospitalier: number;
  prix_public: number;
  quantite: number;
}

interface LignePanier {
  id: number;
  quantite: number;
  medicament: Medicament;
  panierId: number;
}

const Panier: React.FC = () => {
  const navigate = useNavigate();
  const [lignesPanier, setLignesPanier] = useState<LignePanier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchLignesPanier = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/lignepaniers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setLignesPanier(response.data);
    } catch (err: any) {
      setError("Erreur lors du chargement du panier");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLignesPanier();
  }, []);

  const updateQuantity = async (id: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    setError(null);
    try {
      const token = localStorage.getItem('token');
      
      // First, get the current ligne panier to know the old quantity
      const currentLigne = lignesPanier.find(l => l.id === id);
      if (!currentLigne) return;
      
      // Check if we're increasing the quantity
      if (newQuantity > currentLigne.quantite) {
        // Check if enough stock is available
        const response = await axios.get(`http://localhost:8080/medicaments/${currentLigne.medicament.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const availableStock = response.data.quantite;
        const additionalNeeded = newQuantity - currentLigne.quantite;
        
        if (availableStock < additionalNeeded) {
          setError(`Stock insuffisant. Quantité disponible: ${availableStock}`);
          return;
        }
      }

      // If we have enough stock or we're decreasing quantity, proceed with update
      await axios.put(`http://localhost:8080/api/lignepaniers/${id}`, 
        { quantite: newQuantity }, 
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      setLignesPanier(lignesPanier.map(l => l.id === id ? { ...l, quantite: newQuantity } : l));
      setMessage('Quantité mise à jour');
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de la mise à jour de la quantité");
    }
  };

  const removeItem = async (id: number) => {
    setError(null);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8080/api/lignepaniers/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setLignesPanier(lignesPanier.filter(l => l.id !== id));
      setMessage('Médicament retiré du panier');
    } catch (err: any) {
      setError("Erreur lors de la suppression");
    }
  };

  const calculateTotal = () => {
    return lignesPanier.reduce((total, l) => total + (l.medicament.prix_hospitalier * l.quantite), 0);
  };

  const handleCheckout = async () => {
    setError(null);
    setMessage(null);
    try {
      const token = localStorage.getItem('token');
      
      // Close the current panier
      const response = await axios.post('http://localhost:8080/api/paniers/close', {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 200) {
        setMessage('Commande validée avec succès !');
        // Clear the panier
        setLignesPanier([]);
        // Navigate to historique page
        navigate('/historique-pharmacien');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de la validation du panier");
    }
  };

  return (
    <div className="panier-container">
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
            <div className="cart-icon-container">
              <CartFill size={24} />
              <Badge bg="success" pill className="cart-badge">
                {lignesPanier.length}
              </Badge>
            </div>
          </div>
        </Container>
      </div>
      <Container fluid className="main-container">
        <Row className="mb-4">
          <Col className="d-flex justify-content-between align-items-center">
            <h2 className="panier-title">
              <span className="title-icon"><CartFill className="me-2" /></span>
              Mon Panier
            </h2>
          </Col>
        </Row>
        {message && <Alert variant="success">{message}</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}
        {isLoading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Chargement de votre panier...</p>
          </div>
        ) : (
          <>
            {lignesPanier.length === 0 ? (
              <div className="empty-cart fade-in">
                <div className="empty-cart-icon">
                  <CartFill size={60} />
                </div>
                <h3>Votre panier est vide</h3>
                <p>Ajoutez des médicaments pour commencer une commande</p>
                <Button 
                  variant="primary"
                  onClick={() => navigate('/mes-medicaments')}
                  size="sm"
                  style={{ 
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                    borderRadius: '8px',
                    borderWidth: '1px',
                    padding: '8px 16px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  Parcourir les médicaments
                </Button>
              </div>
            ) : (
              <Row>
                <Col lg={8}>
                  <Card className="cart-items-card fade-in">
                    <Card.Body>
                      {lignesPanier.map(item => (
                        <div key={item.id} id={`cart-item-${item.id}`} className="cart-item fade-in-slide">
                          <div className="item-details">
                            <h4>{item.medicament.nom}</h4>
                          </div>
                          <div className="item-controls">
                            <div className="quantity-control">
                              <InputGroup>
                                <Button 
                                  variant="outline-secondary" 
                                  onClick={() => updateQuantity(item.id, item.quantite - 1)}
                                  className="btn-quantity"
                                >
                                  <Dash />
                                </Button>
                                <Form.Control 
                                  type="number" 
                                  min="1" 
                                  value={item.quantite}
                                  onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                                  className="text-center quantity-input"
                                />
                                <Button 
                                  variant="outline-secondary" 
                                  onClick={() => updateQuantity(item.id, item.quantite + 1)}
                                  className="btn-quantity"
                                >
                                  <Plus />
                                </Button>
                              </InputGroup>
                            </div>
                            <div className="item-price">
                              {item.medicament.prix_hospitalier.toFixed(2)} DHS
                            </div>
                            <Button 
                              variant="danger" 
                              className="remove-button"
                              onClick={() => removeItem(item.id)}
                              size="sm"
                              style={{ 
                                transition: 'all 0.3s ease',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                                borderRadius: '8px',
                                borderWidth: '1px'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                              Supprimer
                            </Button>
                          </div>
                          <hr />
                        </div>
                      ))}
                    </Card.Body>
                  </Card>
                </Col>
                <Col lg={4}>
                  <Card className="summary-card fade-in">
                    <Card.Body>
                      <h3 className="summary-title">Récapitulatif</h3>
                      <div className="summary-items">
                        {lignesPanier.map(item => (
                          <div key={item.id} className="summary-item">
                            <div className="summary-item-name">
                              {item.medicament.nom} ({item.quantite})
                            </div>
                            <div className="summary-item-price">
                              {(item.medicament.prix_hospitalier * item.quantite).toFixed(2)} DHS
                            </div>
                          </div>
                        ))}
                      </div>
                      <hr />
                      <div className="total-row">
                        <div className="total-label">Total</div>
                        <div className="total-amount">{calculateTotal().toFixed(2)} DHS</div>
                      </div>
                      <Button 
                        variant="success" 
                        className="mt-3" 
                        onClick={handleCheckout}
                        disabled={lignesPanier.length === 0}
                        style={{ 
                          transition: 'all 0.3s ease',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                          borderRadius: '8px',
                          borderWidth: '1px',
                          padding: '10px 20px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <Cash className="me-2" /> Passer commande
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}
          </>
        )}
      </Container>
    </div>
  );
};

export default Panier; 