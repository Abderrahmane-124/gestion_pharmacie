import React, { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, User, Bell, Package, Clock, MapPin, Phone, Mail, Menu, X, MessageCircle, Send, Bot, Store, Map } from 'lucide-react';
import '../Styles/Client.css';

import pharmacyLogo from "../assets/preview.jpg"; // Assurez-vous que le chemin est correct
import appLogo from "../assets/preview.jpg";
import clientBg from "../assets/client.jpg";


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

  const lastScrollY = useRef(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

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

  const medications = [
    { id: 1, name: 'Paracétamol 500mg', price: 25, stock: 150, category: 'Analgésiques', image: '💊', pharmacy: 'Pharmacie Centrale' },
    { id: 2, name: 'Ibuprofène 400mg', price: 35, stock: 80, category: 'Anti-inflammatoires', image: '💊', pharmacy: 'Pharmacie de la Gare' },
    { id: 3, name: 'Amoxicilline 1g', price: 120, stock: 45, category: 'Antibiotiques', image: '💊', pharmacy: 'Pharmacie Centrale' },
    { id: 4, name: 'Vitamine C 1000mg', price: 45, stock: 200, category: 'Vitamines', image: '🔶', pharmacy: 'Pharmacie du Coin' },
    { id: 5, name: 'Aspirine 100mg', price: 18, stock: 120, category: 'Analgésiques', image: '💊', pharmacy: 'Pharmacie de la Gare' },
    { id: 6, name: 'Oméprazole 20mg', price: 55, stock: 60, category: 'Gastro-intestinal', image: '💊', pharmacy: 'Pharmacie Centrale' }
  ];

  const pharmacies = [
    { 
      id: 1, 
      name: 'Pharmacie Centrale', 
      address: 'Boulevard Mohammed V, Casablanca',
      phone: '+212 522-123456',
      hours: '8h - 22h',
      distance: '0.5 km',
      rating: 4.8,
      image: '🏥'
    },
    { 
      id: 2, 
      name: 'Pharmacie de la Gare', 
      address: 'Avenue des FAR, Casablanca',
      phone: '+212 522-234567',
      hours: '24h/24',
      distance: '1.2 km',
      rating: 4.6,
      image: '⚕️'
    },
    { 
      id: 3, 
      name: 'Pharmacie du Coin', 
      address: 'Rue Oujda, Casablanca',
      phone: '+212 522-345678',
      hours: '9h - 21h',
      distance: '2.0 km',
      rating: 4.7,
      image: '💊'
    },
  ];

  const filteredMeds = medications.filter(med =>
    med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    med.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPharmacies = pharmacies.filter(pharmacy =>
    pharmacy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pharmacy.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (inputMessage.trim() === '') return;

    const newMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, newMessage]);
    setInputMessage('');

    // Simulation de réponse du bot
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        text: getBotResponse(inputMessage),
        sender: 'bot',
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const getBotResponse = (message: string) => {
    const msg = message.toLowerCase();
    if (msg.includes('prix') || msg.includes('coût')) {
      return "Les prix de nos médicaments varient selon le produit. Vous pouvez consulter notre catalogue pour voir les prix détaillés. Cherchez-vous un médicament en particulier ?";
    } else if (msg.includes('stock') || msg.includes('disponible')) {
      return "Pour vérifier la disponibilité d'un médicament, consultez notre section Médicaments. Le stock est mis à jour en temps réel. Quel médicament recherchez-vous ?";
    } else if (msg.includes('pharmacie') || msg.includes('adresse')) {
      return "Nous avons plusieurs pharmacies à Casablanca. Consultez l'onglet 'Pharmacies' pour voir les adresses, horaires et distances. Puis-je vous aider à trouver la plus proche ?";
    } else if (msg.includes('horaire') || msg.includes('ouvert')) {
      return "Nos pharmacies ont des horaires variables. La Pharmacie de la Gare est ouverte 24h/24. Consultez l'onglet Pharmacies pour plus de détails.";
    } else if (msg.includes('commande') || msg.includes('commander')) {
      return "Pour commander, ajoutez les médicaments à votre panier et cliquez sur 'Commander'. Vous pouvez suivre vos commandes dans l'onglet 'Mes Commandes'.";
    } else if (msg.includes('bonjour') || msg.includes('salut')) {
      return "Bonjour ! Comment puis-je vous aider aujourd'hui ? Je peux vous renseigner sur nos médicaments, pharmacies, prix et disponibilités.";
    } else {
      return "Je suis là pour vous aider ! Posez-moi des questions sur nos médicaments, pharmacies, prix ou disponibilités. Comment puis-je vous assister ?";
    }
  };

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
            {filteredMeds.map((med) => (
              <div key={med.id} className="client-med-card">
                <div className="client-med-card-content">
                  <div className="client-med-card-header">
                    <div className="client-med-image">{med.image}</div>
                    <span className="client-med-category">
                      {med.category}
                    </span>
                  </div>
                  <h3 className="client-med-name">{med.name}</h3>
                  <div className="client-med-pharmacy">
                    <Store size={16} />
                    <span>{med.pharmacy}</span>
                  </div>
                  <div className="client-med-footer">
                    <span className="client-med-price">{med.price} DH</span>
                  </div>
                  <button className="client-med-button">
                    <ShoppingCart size={18} />
                    <span>Voir les détails</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pharmacies Tab */}
        {activeTab === 'pharmacies' && (
          <div className="client-pharmacies-grid">
            {filteredPharmacies.map((pharmacy) => (
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
            ))}
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
          </div>

          {/* Chat Input */}
          <div className="client-chat-input-container">
            <div className="client-chat-input">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Tapez votre message..."
                className="client-chat-input-field"
              />
              <button
                onClick={handleSendMessage}
                className="client-chat-send-button"
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
