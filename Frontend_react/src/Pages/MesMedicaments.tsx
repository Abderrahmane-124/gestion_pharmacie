import { useEffect, useState } from "react";
import axios from "axios";
import "../Styles/MesMedicaments.css";
import { useNavigate } from "react-router-dom";
import { FaShoppingCart } from "react-icons/fa";
import { Button } from "react-bootstrap";
import { ArrowLeft } from "react-bootstrap-icons";

interface Medicament {
  id: number;
  nom: string;
  prix_hospitalier: number;
  quantite: number;
  date_expiration: string;
  en_vente: boolean;
  prix_public?: number;
}

interface Alerte {
  id: number;
  message: string;
  minimumQuantite: number;
  medicaments: Medicament[];
}

interface LignePanier {
  id: number;
  quantite: number;
  medicament: Medicament;
  panierId: number;
}

// Define sort options type
type SortOption = 'alphabetical' | 'price-asc' | 'price-desc';

export default function MesMedicaments() {
  const navigate = useNavigate();
  const [medicaments, setMedicaments] = useState<Medicament[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAlertes, setShowAlertes] = useState<number | null>(null);
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [showNewAlerteForm, setShowNewAlerteForm] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('alphabetical');
  const [cartItemsCount, setCartItemsCount] = useState<number>(0);
  const [newAlerte, setNewAlerte] = useState({
    message: '',
    minimumQuantite: 1,
    medicamentIds: [] as number[]
  });

  useEffect(() => {
    const fetchMyMedicaments = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get("http://localhost:8080/medicaments/my-medicaments", {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setMedicaments(response.data);
      } catch (error) {
        console.error("Error fetching my medicaments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyMedicaments();
  }, []);

  const refreshMedicaments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get("http://localhost:8080/medicaments/my-medicaments", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setMedicaments(response.data);
    } catch (error) {
      console.error("Error fetching my medicaments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshMedicaments();
  }, []);

  useEffect(() => {
    const fetchAlertes = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get("http://localhost:8080/api/alertes", {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setAlertes(response.data);
      } catch (error) {
        console.error("Error fetching alertes:", error);
      }
    };

    if (showAlertes !== null) {
      fetchAlertes();
    }
  }, [showAlertes]);

  const handleQuantityChange = (id: number, value: string) => {
    const num = parseInt(value, 10);
    setQuantities(q => ({ ...q, [id]: isNaN(num) ? 1 : num }));
  };

  // New function to fetch cart items count
  const fetchCartItemsCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/lignepaniers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (Array.isArray(response.data)) {
        setCartItemsCount(response.data.length);
      }
    } catch (error) {
      console.error("Error fetching cart items:", error);
    }
  };

  // Call this function when the component mounts and after adding to cart
  useEffect(() => {
    fetchCartItemsCount();
  }, []);

  const handleAddToPanier = async (med: Medicament) => {
    setMessage(null);
    setError(null);
    const quantite = quantities[med.id] || 1;
    
    if (quantite < 1 || quantite > med.quantite) {
      setError("Quantité invalide");
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        "http://localhost:8080/api/lignepaniers",
        { medicamentId: med.id, quantite },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setMessage(`Ajouté au panier: ${med.nom} (x${quantite})`);
      // Refresh the medicaments list to update quantities
      refreshMedicaments();
      // Update cart count after adding to cart
      fetchCartItemsCount();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Erreur lors de l'ajout au panier");
    }
  };

  const handleCreateAlerte = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        "http://localhost:8080/api/alertes",
        {
          ...newAlerte,
          medicamentIds: [showAlertes]
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      setShowNewAlerteForm(false);
      setNewAlerte({ message: '', minimumQuantite: 1, medicamentIds: [] });
      // Refresh alertes
      const response = await axios.get("http://localhost:8080/api/alertes", {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setAlertes(response.data);
    } catch (error) {
      console.error("Error creating alerte:", error);
    }
  };

  const handleAddToAlerte = async (alerteId: number) => {
    try {
      const token = localStorage.getItem('token');
      const currentMedicament = medicaments.find(m => m.id === showAlertes);
      
      // Get current alerte data
      const alerte = alertes.find(a => a.id === alerteId);
      if (!alerte) return;
      
      // Create updated medicament IDs list
      const medicamentIds = [...alerte.medicaments.map(m => m.id), showAlertes as number];
      
      // Update the alerte
      await axios.put(
        `http://localhost:8080/api/alertes/${alerteId}`,
        {
          message: alerte.message,
          minimumQuantite: alerte.minimumQuantite,
          medicamentIds: medicamentIds
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      // Refresh alertes
      const response = await axios.get("http://localhost:8080/api/alertes", {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setAlertes(response.data);
      
      // Show success message
      setMessage(`Ajouté à l'alerte: ${currentMedicament?.nom}`);
    } catch (error) {
      console.error("Error adding to alerte:", error);
      setError("Erreur lors de l'ajout à l'alerte");
    }
  };

  // Add this function to normalize text for searching
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[-\s]/g, ""); // Remove spaces and hyphens
  };

  // Add this function to filter and sort medicaments
  const getFilteredAndSortedMedicaments = () => {
    const filtered = medicaments.filter(med =>
      normalizeText(med.nom).includes(normalizeText(searchTerm))
    );

    // Apply sorting based on current sortOption
    return [...filtered].sort((a, b) => {
      switch (sortOption) {
        case 'alphabetical':
          return normalizeText(a.nom).localeCompare(normalizeText(b.nom));
        case 'price-asc':
          return a.prix_hospitalier - b.prix_hospitalier;
        case 'price-desc':
          return b.prix_hospitalier - a.prix_hospitalier;
        default:
          return 0;
      }
    });
  };

  // Get the filtered and sorted medicaments
  const filteredAndSortedMedicaments = getFilteredAndSortedMedicaments();

  const handleCardClick = (medicamentId: number) => {
    navigate(`/medicament/${medicamentId}`);
  };

  return (
    <div className="mes-medicaments-container fade-in">
      <div className="cart-icon-container" onClick={() => navigate('/panier')}>
        <FaShoppingCart className="cart-icon" />
        {cartItemsCount > 0 && (
          <span className="cart-badge">{cartItemsCount}</span>
        )}
      </div>
      
      <Button 
        variant="success" 
        className="home-button"
        onClick={() => navigate('/dashboard-pharmacien')}
        size="sm"
      >
        <ArrowLeft className="me-2" /> Page d'accueil
      </Button>
      
      <h2 className="mes-medicaments-title">Mes Médicaments</h2>
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
      
      <div className="filters-container">
        {/* Search bar */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Rechercher un médicament..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        {/* Sort options */}
        <div className="sort-container">
          <span className="sort-label">Trier par:</span>
          <div className="sort-options">
            <button 
              className={`sort-option ${sortOption === 'alphabetical' ? 'active' : ''}`}
              onClick={() => setSortOption('alphabetical')}
            >
              Alphabétique
            </button>
            <button 
              className={`sort-option ${sortOption === 'price-asc' ? 'active' : ''}`}
              onClick={() => setSortOption('price-asc')}
            >
              Prix ↑
            </button>
            <button 
              className={`sort-option ${sortOption === 'price-desc' ? 'active' : ''}`}
              onClick={() => setSortOption('price-desc')}
            >
              Prix ↓
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <div>
          {filteredAndSortedMedicaments.length === 0 ? (
            <p className="no-medicaments">Aucun médicament trouvé.</p>
          ) : (
            <div className="medicaments-list">
              {filteredAndSortedMedicaments.map(med => (
                <div 
                  className="medicament-card" 
                  key={med.id}
                  onClick={(e) => {
                    // Only navigate if the click is on the card itself, not on child interactive elements
                    if (e.target === e.currentTarget || 
                        e.target instanceof HTMLElement && 
                        ['DIV', 'SPAN', 'STRONG'].includes(e.target.tagName) &&
                        !e.target.closest('.vendre-actions') && 
                        !e.target.closest('.alerte-btn')) {
                      handleCardClick(med.id);
                    }
                  }}
                >
                  <div className="medicament-card-header">
                    <button 
                      className="alerte-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAlertes(showAlertes === med.id ? null : med.id);
                      }}
                    >
                      {showAlertes === med.id ? (
                        <>
                          <span style={{ marginRight: '4px' }}>✕</span> Fermer
                        </>
                      ) : (
                        <>
                          <span style={{ marginRight: '4px' }}>🔔</span> Alertes
                        </>
                      )}
                    </button>
                  </div>
                  <div className="medicament-content">
                    <div className="medicament-name center">{med.nom}</div>
                    <div className="medicament-info medicament-quantite">
                      <strong>Quantité:</strong> <span className="quantite-value">{med.quantite}</span>
                    </div>
                    <div className="medicament-info">
                      <strong>Prix public:</strong> {med.prix_public || med.prix_hospitalier} DH
                    </div>
                    <div className="medicament-exp">
                      <strong>Expiration:</strong> {med.date_expiration}
                    </div>
                    <div className="vendre-actions">
                      <input
                        type="number"
                        min={1}
                        max={med.quantite}
                        placeholder="Qté"
                        className="vendre-amount-input"
                        value={quantities[med.id] || ""}
                        onChange={e => handleQuantityChange(med.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()} // Prevent card click
                      />
                      <button 
                        className="vendre-btn" 
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click
                          handleAddToPanier(med);
                        }}
                      >
                        Ajouter aux panier
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showAlertes !== null && (
        <>
          <div className="modal-overlay" onClick={() => setShowAlertes(null)} />
          <div className="alertes-container">
            <h3>Alertes pour {medicaments.find(m => m.id === showAlertes)?.nom}</h3>
            {alertes.length === 0 ? (
              <p>Aucune alerte pour ce médicament</p>
            ) : (
              alertes.map(alerte => {
                // Check if current medicament is already in this alerte
                const isAlreadyInAlerte = alerte.medicaments.some(m => m.id === showAlertes);
                
                return (
                  <div key={alerte.id} className="alerte-item">
                    <p><strong>Message:</strong> {alerte.message}</p>
                    <p><strong>Quantité minimale:</strong> {alerte.minimumQuantite}</p>
                    <p><strong>Médicaments concernés:</strong></p>
                    <ul>
                      {alerte.medicaments.map(m => (
                        <li key={m.id}>{m.nom}</li>
                      ))}
                    </ul>
                    
                    {!isAlreadyInAlerte && (
                      <button 
                        className="add-to-alerte-btn"
                        onClick={() => handleAddToAlerte(alerte.id)}
                      >
                        Ajouter à cette alerte
                      </button>
                    )}
                    {isAlreadyInAlerte && (
                      <div className="already-in-alerte">✓ Déjà dans cette alerte</div>
                    )}
                  </div>
                );
              })
            )}
            
            {!showNewAlerteForm ? (
              <button 
                className="create-alerte-btn"
                onClick={() => setShowNewAlerteForm(true)}
              >
                Créer une nouvelle alerte
              </button>
            ) : (
              <div className="new-alerte-form">
                <input
                  type="text"
                  placeholder="Message de l'alerte"
                  value={newAlerte.message}
                  onChange={(e) => setNewAlerte({...newAlerte, message: e.target.value})}
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Quantité minimale"
                  value={newAlerte.minimumQuantite}
                  onChange={(e) => setNewAlerte({...newAlerte, minimumQuantite: parseInt(e.target.value) || 1})}
                />
                <div className="form-buttons">
                  <button onClick={handleCreateAlerte}>Créer l'alerte</button>
                  <button onClick={() => setShowNewAlerteForm(false)}>Annuler</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}