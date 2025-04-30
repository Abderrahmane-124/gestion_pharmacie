import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Form, InputGroup, Badge } from 'react-bootstrap';
import { ExclamationTriangle, Dash, Plus, CartFill, ArrowLeft, Cash, CartXFill, Trash } from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';
import '../Styles/Panier.css';

interface CartItem {
  id: number;
  name: string;
  dosage: string;
  price: number;
  quantity: number;
  packaging: string;
  supplier: string;
}

const Panier: React.FC = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCheckoutAnimation, setShowCheckoutAnimation] = useState(false);

  useEffect(() => {
    // Récupérer les données du panier depuis le localStorage
    setIsLoading(true);
    
    setTimeout(() => {
      const savedCart = localStorage.getItem('pharmacieCart');
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          setCartItems(parsedCart);
        } catch (error) {
          console.error("Erreur lors du chargement du panier:", error);
          setCartItems([]);
        }
      } else {
        setCartItems([]);
      }
      
      setIsLoading(false);
      
      // Animation d'entrée des éléments
      setTimeout(() => {
        const itemElements = document.querySelectorAll('.cart-item');
        itemElements.forEach((item, index) => {
          setTimeout(() => {
            item.classList.add('fade-in-slide');
          }, 100 * index);
        });
      }, 100);
    }, 500);
  }, []);

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity < 1) return; // Empêcher les quantités négatives
    
    // Mettre à jour le panier local
    const updatedItems = cartItems.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    );
    
    setCartItems(updatedItems);
    
    // Mettre à jour le localStorage
    localStorage.setItem('pharmacieCart', JSON.stringify(updatedItems));
  };

  const removeItem = (id: number) => {
    // Ajouter une animation de sortie avant de supprimer l'élément
    const itemElement = document.getElementById(`cart-item-${id}`);
    if (itemElement) {
      itemElement.classList.add('fade-out-slide');
      
      setTimeout(() => {
        const updatedItems = cartItems.filter(item => item.id !== id);
        setCartItems(updatedItems);
        
        // Mettre à jour le localStorage
        localStorage.setItem('pharmacieCart', JSON.stringify(updatedItems));
      }, 300);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCheckout = () => {
    setShowCheckoutAnimation(true);
    
    // Enregistrer les données d'achat dans sessionStorage pour la page de confirmation
    const purchaseData = {
      items: cartItems,
      total: calculateTotal(),
      date: new Date().toISOString()
    };
    
    sessionStorage.setItem('lastPharmacyPurchase', JSON.stringify(purchaseData));
    
    setTimeout(() => {
      // Vider le panier après l'achat
      localStorage.removeItem('pharmacieCart');
      // Rediriger vers la page de confirmation
      navigate('/confirmation-commande');
    }, 1000);
  };

  const clearCart = () => {
    if (window.confirm('Êtes-vous sûr de vouloir vider le panier ?')) {
      localStorage.removeItem('pharmacieCart');
      setCartItems([]);
    }
  };

  return (
    <div className={`panier-container ${showCheckoutAnimation ? 'checkout-animation' : ''}`}>
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
                {cartItems.length}
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
            
            {cartItems.length > 0 && (
              <Button 
                variant="outline-danger" 
                className="clear-cart-btn ms-auto" 
                onClick={clearCart}
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
                <Trash className="me-1" /> Vider le panier
              </Button>
            )}
          </Col>
        </Row>
        
        {isLoading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Chargement de votre panier...</p>
          </div>
        ) : (
          <>
            {cartItems.length > 0 && cartItems[0].supplier && (
              <Row className="mb-4">
                <Col>
                  <Alert variant="warning" className="supplier-alert fade-in">
                    <ExclamationTriangle className="me-2" /> Fournisseur: {cartItems[0].supplier}
                  </Alert>
                </Col>
              </Row>
            )}
            
            {cartItems.length === 0 ? (
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
                      {cartItems.map(item => (
                        <div key={item.id} id={`cart-item-${item.id}`} className="cart-item">
                          <div className="item-details">
                            <h4>{item.name} {item.dosage}</h4>
                            <p className="item-packaging">{item.packaging}</p>
                          </div>
                          
                          <div className="item-controls">
                            <div className="quantity-control">
                              <InputGroup>
                                <Button 
                                  variant="outline-secondary" 
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="btn-quantity"
                                >
                                  <Dash />
                                </Button>
                                <Form.Control 
                                  type="number" 
                                  min="1" 
                                  value={item.quantity}
                                  onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                                  className="text-center quantity-input"
                                />
                                <Button 
                                  variant="outline-secondary" 
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="btn-quantity"
                                >
                                  <Plus />
                                </Button>
                              </InputGroup>
                            </div>
                            
                            <div className="item-price">
                              {item.price.toFixed(2)} DHS
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
                        {cartItems.map(item => (
                          <div key={item.id} className="summary-item">
                            <div className="summary-item-name">
                              {item.name} {item.dosage} ({item.quantity})
                            </div>
                            <div className="summary-item-price">
                              {(item.price * item.quantity).toFixed(2)} DHS
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
                        disabled={cartItems.length === 0}
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