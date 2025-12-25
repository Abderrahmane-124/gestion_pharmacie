import React, { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, User, Bell, Package, Clock, MapPin, Phone, Mail, Menu, X, MessageCircle, Send, Bot, Store, Map } from 'lucide-react';
import '../Styles/Client.css';
import axios from 'axios';

import pharmacyLogo from "../assets/preview.jpg"; // Assurez-vous que le chemin est correct
import appLogo from "../assets/preview.jpg";
import clientBg from "../assets/client.jpg";

const API_URL = 'http://localhost:8080';

// Types
interface Medicament {
  id: number;
  nom: string;
  prixVente: number;
  quantiteStock: number;
  categorie?: string;
  description?: string;
  utilisateur?: {
    nom: string;
    prenom: string;
  };
}

interface Pharmacien {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  adresse?: string;
  inpe?: string;
}


export default function ClientPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('medicaments');
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Bonjour ! Je suis votre assistant virtuel. Comment puis-je vous aider aujourd'hui ?", sender: 'bot', time: '10:30' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [medications, setMedications] = useState<Medicament[]>([]);
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const lastScrollY = useRef(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Fetch medicaments from API
  useEffect(() => {
    const fetchMedicaments = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/medicaments/en-vente`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setMedications(response.data);
      } catch (err: any) {
        console.error('Erreur lors du chargement des médicaments:', err);
        setError('Erreur lors du chargement des médicaments');
      } finally {
        setLoading(false);
      }
    };

    fetchMedicaments();
  }, []);

  // Fetch pharmaciens from API
  useEffect(() => {
    const fetchPharmaciens = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/api/utilisateurs/pharmaciens`, {
          headers: token ? {
            'Authorization': `Bearer ${token}`
          } : {}
        });
        const pharmaciensData = response.data.map((pharmacien: Pharmacien, index: number) => ({
          id: pharmacien.id,
          name: `Pharmacie ${pharmacien.prenom} ${pharmacien.nom}`,
          address: pharmacien.adresse || 'Adresse non disponible',
          phone: pharmacien.telephone || 'Téléphone non disponible',
          hours: '8h - 22h',
          distance: `${(Math.random() * 5).toFixed(1)} km`,
          rating: (4.5 + Math.random() * 0.5).toFixed(1),
          image: ['🏥', '⚕️', '💊'][index % 3],
          email: pharmacien.email,
          inpe: pharmacien.inpe
        }));
        setPharmacies(pharmaciensData);
      } catch (err: any) {
        console.error('Erreur lors du chargement des pharmaciens:', err);
        setError('Erreur lors du chargement des pharmaciens');
      } finally {
        setLoading(false);
      }
    };

    fetchPharmaciens();
  }, []);

  useEffect(() => {
    // initialize lastScrollY to current position to avoid jump
    lastScrollY.current = (window.scrollY || 0);

    const getScrollY = () => {
      if (containerRef.current) return containerRef.current.scrollTop || 0;
      return window.scrollY || 0;
    };

    const handleScroll = () => {
      const currentY = getScrollY();
      const THRESHOLD = 5; // disappear almost immediately on small scroll
      if (currentY > lastScrollY.current && currentY > THRESHOLD) {
        // scrolling down -> hide header and disable compact
        setHeaderHidden(true);
        setIsCompact(false);
      } else if (currentY < lastScrollY.current) {
        // scrolling up -> show header in compact mode if not at top
        setHeaderHidden(false);
        if (currentY > 20) {
          setIsCompact(true);
        } else {
          setIsCompact(false);
        }
      }

      // at very top, ensure header is expanded
      if (currentY === 0) {
        setIsCompact(false);
      }

      lastScrollY.current = currentY;
    };

    // attach listener to the scrolling container if present, otherwise to window
    const scrollTarget: EventTarget | null = containerRef.current || window;
    const options = { passive: true } as AddEventListenerOptions;
    // Type narrowing: element vs window
    if (containerRef.current) {
      containerRef.current.addEventListener('scroll', handleScroll, options);
      return () => {
        if (containerRef.current) {
          containerRef.current.removeEventListener('scroll', handleScroll);
        }
      };
    } else {
      window.addEventListener('scroll', handleScroll, options);
      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

  const filteredMeds = medications.filter(med =>
    med.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (med.categorie && med.categorie.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredPharmacies = pharmacies.filter(pharmacy =>
    pharmacy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pharmacy.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = async () => {
    if (inputMessage.trim() === '' || isSendingMessage) return;

    const userMessageText = inputMessage;
    const newMessage = {
      id: messages.length + 1,
      text: userMessageText,
      sender: 'user',
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, newMessage]);
    setInputMessage('');
    setIsSendingMessage(true);

    try {
      const token = localStorage.getItem('token');
      
      // Call the RAG API
      const response = await axios.post(`${API_URL}/api/rag/chat`, {
        message: userMessageText,
        max_new_tokens: 512,
        temperature: 0.7,
        top_p: 0.9
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Extract the AI response
      const aiResponseText = response.data.answer || response.data.response || "Désolé, je n'ai pas pu générer une réponse.";
      
      const botResponse = {
        id: messages.length + 2,
        text: aiResponseText,
        sender: 'bot',
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, botResponse]);
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi du message:', error);
      
      // Fallback to local response if API fails
      const botResponse = {
        id: messages.length + 2,
        text: "Désolé, je rencontre des difficultés à me connecter au serveur. Veuillez réessayer plus tard.",
        sender: 'bot',
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botResponse]);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Old local bot response logic (replaced by AI API)
  // const getBotResponse = (message: string) => {
  //   const msg = message.toLowerCase();
  //   if (msg.includes('prix') || msg.includes('coût')) {
  //     return "Les prix de nos médicaments varient selon le produit...";
  //   }
  //   ...
  // };

  return (
    <div
      className="client-container"
      style={{
        backgroundImage: `linear-gradient(rgba(2,6,23,0.45), rgba(15,23,42,0.15)), url(${clientBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Header */}
      <header className={`client-header ${headerHidden ? 'client-header-hidden' : ''} ${isCompact ? 'client-header-compact' : ''}`}>
        <div className="client-header-content">
          <div className="client-header-logo">
            <img src={appLogo} alt="Pharma App Logo" className="client-logo-icon" />
            <div>
              <h1 className="client-logo-title">Pharma App</h1>
              <p className="client-logo-subtitle">Votre santé, notre priorité</p>
            </div>
          </div>
          
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="client-menu-toggle"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <nav className="client-nav-desktop">
            <button
              onClick={() => setActiveTab('medicaments')}
              className={`client-nav-button ${
                activeTab === 'medicaments' ? 'client-nav-button-active' : ''
              }`}
            >
              <Package size={20} />
              <span>Médicaments</span>
            </button>
            <button
              onClick={() => setActiveTab('pharmacies')}
              className={`client-nav-button ${
                activeTab === 'pharmacies' ? 'client-nav-button-active' : ''
              }`}
            >
              <Store size={20} />
              <span>Pharmacies</span>
            </button>
          </nav>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <nav className="client-nav-mobile">
            <button
              onClick={() => { setActiveTab('medicaments'); setMenuOpen(false); }}
              className={`client-mobile-button ${
                activeTab === 'medicaments' ? 'client-mobile-button-active' : ''
              }`}
            >
              <Package size={20} />
              <span>Médicaments</span>
            </button>
            <button
              onClick={() => { setActiveTab('pharmacies'); setMenuOpen(false); }}
              className={`client-mobile-button ${
                activeTab === 'pharmacies' ? 'client-mobile-button-active' : ''
              }`}
            >
              <Store size={20} />
              <span>Pharmacies</span>
            </button>
          </nav>
        )}
      </header>

      <div className="client-content">
        {/* Search Bar */}
        <div className="client-search-container">
          <div className="client-search-box">
            <Search className="client-search-icon" size={20} />
            <input
              type="text"
              placeholder={activeTab === 'medicaments' ? "Rechercher un médicament..." : "Rechercher une pharmacie..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="client-search-input"
            />
          </div>
        </div>

        {/* Médicaments Tab */}
        {activeTab === 'medicaments' && (
          <div className="client-meds-grid">
            {loading ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', color: 'white' }}>
                <p>Chargement des médicaments...</p>
              </div>
            ) : error ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', color: '#ef4444' }}>
                <p>{error}</p>
              </div>
            ) : filteredMeds.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', color: 'white' }}>
                <p>Aucun médicament disponible</p>
              </div>
            ) : (
              filteredMeds.map((med) => (
                <div key={med.id} className="client-med-card">
                  <div className="client-med-card-content">
                    <div className="client-med-card-header">
                      <div className="client-med-image">💊</div>
                      <span className="client-med-category">
                        {med.categorie || 'Médicament'}
                      </span>
                    </div>
                    <h3 className="client-med-name">{med.nom}</h3>
                    <div className="client-med-pharmacy">
                      <Store size={16} />
                      <span>{med.utilisateur ? `${med.utilisateur.prenom} ${med.utilisateur.nom}` : 'Pharmacie'}</span>
                    </div>
                    <div className="client-med-footer">
                      <span className="client-med-price">{med.prixVente} DH</span>
                      <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Stock: {med.quantiteStock}</span>
                    </div>
                    <button className="client-med-button">
                      <ShoppingCart size={18} />
                      <span>Voir les détails</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Pharmacies Tab */}
        {activeTab === 'pharmacies' && (
          <div className="client-pharmacies-grid">
            {loading ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', color: 'white' }}>
                <p>Chargement des pharmacies...</p>
              </div>
            ) : error ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', color: '#ef4444' }}>
                <p>{error}</p>
              </div>
            ) : filteredPharmacies.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', color: 'white' }}>
                <p>Aucune pharmacie disponible</p>
              </div>
            ) : (
              filteredPharmacies.map((pharmacy) => (
                <div key={pharmacy.id} className="client-pharmacy-card">
                <div className="client-pharmacy-card-content">
                  <div className="client-pharmacy-card-header">
                    <div className="client-pharmacy-info">
                      <div className="client-pharmacy-image">{pharmacy.image}</div>
                      <div>
                        <h3 className="client-pharmacy-name">{pharmacy.name}</h3>
                        <div className="client-pharmacy-rating">
                          <span className="client-rating-star">★</span>
                          <span className="client-rating-value">{pharmacy.rating}</span>
                        </div>
                      </div>
                    </div>
                    <span className="client-pharmacy-distance">
                      {pharmacy.distance}
                    </span>
                  </div>

                  <div className="client-pharmacy-details">
                    <div className="client-pharmacy-detail">
                      <MapPin size={18} className="client-detail-icon" />
                      <span className="client-detail-text">{pharmacy.address}</span>
                    </div>
                    <div className="client-pharmacy-detail">
                      <Phone size={18} className="client-detail-icon" />
                      <span className="client-detail-text">{pharmacy.phone}</span>
                    </div>
                    <div className="client-pharmacy-detail">
                      <Clock size={18} className="client-detail-icon" />
                      <span className="client-detail-text">{pharmacy.hours}</span>
                    </div>
                  </div>

                  <div className="client-pharmacy-buttons">
                    <button className="client-pharmacy-button client-pharmacy-button-blue">
                      <Map size={18} />
                      <span>Itinéraire</span>
                    </button>
                    <button className="client-pharmacy-button client-pharmacy-button-green">
                      <Phone size={18} />
                      <span>Appeler</span>
                    </button>
                  </div>
                </div>
              </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Chatbot Button */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="client-chat-button"
      >
        {chatOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </button>

      {/* Chatbot Window */}
      {chatOpen && (
        <div className="client-chat-window">
          {/* Chat Header */}
          <div className="client-chat-header">
            <div className="client-chat-bot-icon">
              <Bot size={24} className="client-chat-bot-icon-inner" />
            </div>
            <div>
              <h3 className="client-chat-bot-title">Assistant Pharmacie</h3>
              <p className="client-chat-bot-status">En ligne</p>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="client-chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`client-chat-message client-chat-message-${msg.sender}`}>
                <div className={`client-chat-bubble client-chat-bubble-${msg.sender}`}>
                  <p className="client-chat-text">{msg.text}</p>
                  <span className="client-chat-time">
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}
            {isSendingMessage && (
              <div className="client-chat-message client-chat-message-bot">
                <div className="client-chat-bubble client-chat-bubble-bot">
                  <p className="client-chat-text">
                    <span style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>●</span>
                    <span style={{ animation: 'pulse 1.5s ease-in-out infinite', animationDelay: '0.2s' }}>●</span>
                    <span style={{ animation: 'pulse 1.5s ease-in-out infinite', animationDelay: '0.4s' }}>●</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="client-chat-input-container">
            <div className="client-chat-input">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isSendingMessage && handleSendMessage()}
                placeholder="Tapez votre message..."
                className="client-chat-input-field"
                disabled={isSendingMessage}
              />
              <button
                onClick={handleSendMessage}
                className="client-chat-send-button"
                disabled={isSendingMessage || inputMessage.trim() === ''}
                style={{ opacity: (isSendingMessage || inputMessage.trim() === '') ? 0.5 : 1 }}
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
