// VentePharmacien.tsx
import React, { useState, useEffect } from 'react';
import '../Styles/VentePharmacien.css';
import 'bootstrap/dist/css/bootstrap.min.css';

interface Medication {
  id: number;
  name: string;
  price: number;
  boxSize: number;
  stock: number;
  category: string;
  quantity: number;
}

interface CartItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

const VentePharmacien: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('Analgésique');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [selectedMeds, setSelectedMeds] = useState<Medication[]>([
    {
      id: 1,
      name: 'Doliprane 1000mg',
      price: 16.70,
      boxSize: 8,
      stock: 145,
      category: 'Analgésique',
      quantity: 2
    },
    {
      id: 2,
      name: 'Aspirine 500mg',
      price: 22.30,
      boxSize: 20,
      stock: 120,
      category: 'Anti-inflammatoire',
      quantity: 0
    },
    {
      id: 3,
      name: 'Dafalgan 500mg',
      price: 18.50,
      boxSize: 16,
      stock: 78,
      category: 'Analgésique',
      quantity: 0
    }
  ]);

  const categories = [
    'Analgésique',
    'Anti-inflammatoire',
    'Antibiotique',
    'Anxiolytique',
    'Antiallergique',
    'Vitamines'
  ];

  useEffect(() => {
    calculateTotal();
  }, [selectedMeds]);

  const handleQuantityChange = (id: number, value: string) => {
    const numValue = parseInt(value) || 0;
    const updatedMeds = selectedMeds.map(med => 
      med.id === id ? { ...med, quantity: numValue } : med
    );
    setSelectedMeds(updatedMeds);
    
    // Update cart
    const updatedCart = updatedMeds
      .filter(med => med.quantity > 0)
      .map(med => ({
        id: med.id,
        name: med.name,
        quantity: med.quantity,
        price: med.price,
        totalPrice: med.price * med.quantity
      }));
    
    setCart(updatedCart);
  };

  const addToCart = (id: number) => {
    const med = selectedMeds.find(med => med.id === id);
    if (med && med.quantity > 0) {
      handleQuantityChange(id, med.quantity.toString());
    }
  };

  const calculateTotal = () => {
    const newTotal = selectedMeds.reduce((sum, med) => {
      return sum + (med.price * med.quantity);
    }, 0);
    setTotal(newTotal);
  };

  const handleSale = () => {
    alert('Vente enregistrée avec succès!');
    // Reset quantities
    const resetMeds = selectedMeds.map(med => ({ ...med, quantity: 0 }));
    setSelectedMeds(resetMeds);
    setCart([]);
    setTotal(0);
  };

  const filteredMeds = selectedMeds.filter(med => 
    med.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (activeCategory === 'Tous' || med.category === activeCategory)
  );

  return (
    <div className="pharmacy-container">
      <div className="container py-4">
        {/* Animated background elements */}
        <div className="background-shape shape-1"></div>
        <div className="background-shape shape-2"></div>
        <div className="background-shape shape-3"></div>
        
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="main-card">
              <div className="search-container mb-4">
                <div className="input-group">
                  <span className="input-group-text search-icon">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control search-input"
                    placeholder="Rechercher un médicament..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="category-nav mb-4">
                {categories.map((category) => (
                  <button
                    key={category}
                    className={`category-btn ${activeCategory === category ? 'active' : ''}`}
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
              
              <h4 className="section-title mb-4">
                <i className="bi bi-capsule me-2"></i>
                Médicaments sélectionnés
              </h4>
              
              <div className="meds-list">
                {filteredMeds.map(med => (
                  <div 
                    key={med.id} 
                    className={`med-card ${med.category === activeCategory ? 'highlight' : ''}`}
                  >
                    <div className="row align-items-center">
                      <div className="col-md-6">
                        <h5 className="med-name">{med.name}</h5>
                        <p className="med-details mb-1">
                          <i className="bi bi-box me-1"></i>
                          Boîte de {med.boxSize} comprimés
                        </p>
                        <p className="med-details">
                          <i className="bi bi-archive me-1"></i>
                          Stock: {med.stock}
                        </p>
                      </div>
                      <div className="col-md-2">
                        <input
                          type="number"
                          min="0"
                          className="form-control quantity-input"
                          value={med.quantity}
                          onChange={(e) => handleQuantityChange(med.id, e.target.value)}
                        />
                      </div>
                      <div className="col-md-2">
                        <span className="med-price">{med.price.toFixed(2)} dhs</span>
                      </div>
                      <div className="col-md-2 text-end">
                        <button 
                          className="btn add-btn"
                          onClick={() => addToCart(med.id)}
                        >
                          <i className="bi bi-plus-circle me-1"></i> Ajouter
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="col-lg-4">
            <div className="cart-card">
              <div className="cart-header">
                <h4 className="cart-title">
                  <i className="bi bi-receipt me-2"></i>
                  Récapitulatif
                </h4>
                <span className="sparkle-icon">
                  <i className="bi bi-stars"></i>
                </span>
              </div>
              
              <div className="cart-items">
                {cart.length > 0 ? (
                  cart.map((item) => (
                    <div key={item.id} className="cart-item">
                      <div className="item-info">
                        <h6 className="item-name">{item.name}</h6>
                        <p className="item-details">({item.quantity} × {item.price.toFixed(2)} DHS)</p>
                      </div>
                      <div className="item-price">{item.totalPrice.toFixed(2)} DHS</div>
                    </div>
                  ))
                ) : (
                  <p className="empty-cart">Aucun produit sélectionné</p>
                )}
              </div>
              
              <div className="cart-total">
                <h5>Total vente:</h5>
                <h5 className="total-amount">{total.toFixed(2)} DHS</h5>
              </div>
              
              <button 
                className="btn checkout-btn"
                onClick={handleSale}
                disabled={cart.length === 0}
              >
                <i className="bi bi-bag-check me-2"></i>
                Enregistrer la vente
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VentePharmacien;