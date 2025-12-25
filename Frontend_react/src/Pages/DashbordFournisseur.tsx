// DashboardFournisseur.tsx
import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Badge, Tabs, Tab, Modal, InputGroup, ListGroup } from 'react-bootstrap';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, BarElement } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';
import { FaPills, FaClipboardList, FaTruck, FaWarehouse, FaSearch, FaEdit, FaTrash, FaPlus, FaFilter } from 'react-icons/fa';
import { MessageCircle, Send, Bot, X } from 'lucide-react';
import '../Styles/dashboardFournisseur.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title,
  BarElement
);

const DashboardFournisseur = () => {
  // États pour gérer les données et l'UI
  const [medicaments, setMedicaments] = useState<Medicament[]>([]);
  const [filteredMedicaments, setFilteredMedicaments] = useState<Medicament[]>([]);
  const [commandes, setCommandes] = useState<Order[]>([]);
  const [filteredCommandes, setFilteredCommandes] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchMedicament, setSearchMedicament] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchCommandeTerm, setSearchCommandeTerm] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'available' | 'invisible'>('all');
  interface Medicament {
    id: number;
    nom: string;
    categorie: string;
    quantite: number;
    prix: number;
    dateExpiration: string;
    natureDuProduit?: string;
    code_ATC?: string;
    dosage?: string;
    presentation?: string;
    prix_public?: number;
    prix_hospitalier?: number;
    prix_conseille?: number;
    composition?: string;
    classe_therapeutique?: string;
    indications?: string;
    tableau?: string;
    en_vente?: boolean;
  }

  const [currentMedicament, setCurrentMedicament] = useState<Medicament | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  interface Order {
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
        prix_unitaire: number;
        prix_hospitalier?: number;
        quantite: number;
      }
    }[];
    montant: number;
  }
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Chatbot states
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Bonjour ! Je suis votre assistant virtuel. Comment puis-je vous aider aujourd'hui ?", sender: 'bot', time: '10:30' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Add the navigate hook near the other hooks
  const navigate = useNavigate();

  // Add a new state to control the active tab
  const [activeTab, setActiveTab] = useState('stock');

  // Replace the mock data useEffect with API call
  useEffect(() => {
    const fetchMedicaments = async () => {
      try {
        setLoading(true);
        console.log("Attempting to fetch medications...");
        
        // Try with a different approach without credentials
        const url = 'http://localhost:8080/medicaments/my-medicaments';
        console.log("Fetching from:", url);
        
        // Get token from localStorage if you have it
        const token = localStorage.getItem('token');
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        
        console.log("Response status:", response.status);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Raw data received:", data);
        
        // Ensure data has the expected structure with ALL properties
        const processedData = Array.isArray(data) ? data.map(item => ({
          id: item.id || Math.random(),
          nom: item.nom || item.name || "Sans nom",
          categorie: item.categorie || item.category || "Non classé",
          quantite: item.quantite || item.quantity || 0,
          prix: item.prix_unitaire || item.prix || item.price || 0,
          dateExpiration: item.date_expiration ? new Date(item.date_expiration).toISOString().split('T')[0] : item.dateExpiration || "Non définie",
          natureDuProduit: item.natureDuProduit || item.nature || "Non spécifié",
          // Add all additional properties 
          code_ATC: item.code_ATC || "",
          dosage: item.dosage || "",
          presentation: item.presentation || "",
          prix_public: item.prix_public || 0,
          prix_hospitalier: item.prix_hospitalier || 0,
          prix_conseille: item.prix_conseille || 0,
          composition: item.composition || "",
          classe_therapeutique: item.classe_therapeutique || "",
          indications: item.indications || "",
          tableau: item.tableau || "",
          en_vente: item.en_vente || false
        })) : [];
        
        console.log("Processed data:", processedData);
        setMedicaments(processedData);
        
        // Fetch commandes data from the API
        try {
          console.log("Attempting to fetch commandes...");
          const commandesUrl = 'http://localhost:8080/commandes/current_fournisseur';
          console.log("Fetching from:", commandesUrl);
          
          const commandesResponse = await fetch(commandesUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
          });
          
          console.log("Commandes response status:", commandesResponse.status);
          
          if (!commandesResponse.ok) {
            throw new Error(`API error: ${commandesResponse.status}`);
          }
          
          const commandesData = await commandesResponse.json();
          console.log("Raw commandes data received:", commandesData);
          
          // Process all commandes data (not just EN_ATTENTE)
          const processedCommandes = Array.isArray(commandesData) ? commandesData.map(item => ({
            id: item.id,
            dateCommande: item.dateCommande,
            statut: item.statut,
            pharmacien: item.pharmacien,
            fournisseur: item.fournisseur,
            lignesCommande: item.lignesCommande,
            montant: item.lignesCommande.reduce((total: number, ligne: any) => {
              const prix = ligne.medicament.prix_hospitalier || ligne.medicament.prix_unitaire || 0;
              return total + (ligne.quantite * prix);
            }, 0)
          })) : [];
          
          // Store all commandes in state
          setCommandes(processedCommandes);
          
          // Filter only EN_ATTENTE orders for the table display
          const pendingOrders = processedCommandes.filter(item => item.statut === "EN_ATTENTE");
          setFilteredCommandes(pendingOrders);
        } catch (error) {
          console.error("Error fetching commandes:", error);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching medications:", error);
        
        setLoading(false);
      }
    };
    
    fetchMedicaments();
  }, []);

  // Process chart data from commandes data
  const processCommandesChartData = () => {
    const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    const monthlyData = Array(12).fill(0);
    
    if (commandes.length > 0) {
      commandes.forEach(commande => {
        if (commande.dateCommande) {
          const date = new Date(commande.dateCommande);
          const month = date.getMonth();
          monthlyData[month] += commande.montant;
        }
      });
    }
    
    // Find the first and last months with data
    let firstMonthWithData = 0;
    let lastMonthWithData = 11;
    for (let i = 0; i < 12; i++) {
      if (monthlyData[i] > 0) {
        firstMonthWithData = i;
        break;
      }
    }
    for (let i = 11; i >= 0; i--) {
      if (monthlyData[i] > 0) {
        lastMonthWithData = i;
        break;
      }
    }
    
    // Ensure we display at least 4 months of data, or all months if we have data for less than 4
    if (lastMonthWithData - firstMonthWithData < 3) {
      if (firstMonthWithData <= 8) {
        lastMonthWithData = Math.min(firstMonthWithData + 3, 11);
      } else {
        firstMonthWithData = Math.max(lastMonthWithData - 3, 0);
      }
    }
    
    // Extract relevant months range for display
    const labels = months.slice(firstMonthWithData, lastMonthWithData + 1);
    const data = monthlyData.slice(firstMonthWithData, lastMonthWithData + 1);
    
    return { labels, data };
  };

  // Update the stockData to show medication names and their quantities
  const stockData = {
    labels: medicaments.length > 0 
      ? medicaments.map(med => med.nom || "Sans nom")
      : ['Aucune donnée'],
    datasets: [
      {
        data: medicaments.length > 0 
          ? medicaments.map(med => med.quantite || 0)
          : [1],
        backgroundColor: [
          '#8e44ad', '#9b59b6', '#af7ac5', '#bb8fce', '#d2b4de', '#e8daef',
          '#3498db', '#2980b9', '#1abc9c', '#16a085', '#27ae60', '#2ecc71',
          '#f1c40f', '#f39c12', '#e67e22', '#d35400', '#e74c3c', '#c0392b'
        ],
        borderWidth: 1,
      },
    ],
  };

  const { labels: commandesLabels, data: commandesMonthlyData } = processCommandesChartData();

  const commandesData = {
    labels: commandesLabels.length > 0 ? commandesLabels : ['Janvier', 'Février', 'Mars', 'Avril'],
    datasets: [
      {
        label: 'Commandes (DHS)',
        data: commandesMonthlyData.length > 0 ? commandesMonthlyData : [12000, 9800, 14500, 15850],
        fill: true,
        backgroundColor: 'rgba(84, 181, 95, 0.2)',
        borderColor: '#8e44ad',
        tension: 0.4,
      },
    ],
  };

  // Function to search medicaments from web scraping - improved version
  const searchMedicamentsFromWeb = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const token = localStorage.getItem('token');
      
      // Use the new progressive search endpoint
      const response = await fetch(`http://localhost:8080/medicaments/progressive-search?query=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
      });
      
      if (!response.ok) {
        throw new Error(`Error searching medicaments: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Progressive search results:", data);
      setSearchResults(data || []);
    } catch (error) {
      console.error("Error searching medicaments:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Function to fetch detailed medicament information from the scraper
  const fetchDetailedMedicamentInfo = async (medicamentName: string) => {
    try {
      const token = localStorage.getItem('token');
      
      // First try to search for the URL if we only have a name
      if (!medicamentName.includes('http')) {
        const searchResponse = await fetch(`http://localhost:8080/medicaments/progressive-search?query=${encodeURIComponent(medicamentName)}`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
        });
        
        if (searchResponse.ok) {
          const results = await searchResponse.json();
          // Get first result's URL if available
          if (results && results.length > 0 && results[0].url) {
            medicamentName = results[0].url;
          } else {
            throw new Error("Couldn't find medication URL");
          }
        }
      }
      
      // Now make the detailed-scrape request with the URL
      const response = await fetch(`http://localhost:8080/medicaments/detailed-scrape`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ url: medicamentName })
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching detailed information: ${response.status}`);
      }
      
      const data = await response.json();
      updateFormWithDetailedData(data);
    } catch (error) {
      console.error("Error fetching detailed medicament information:", error);
      
      // Remove loading indicators
      const loadingIndicator = document.querySelector('.modal-body .position-absolute');
      if (loadingIndicator) {
        loadingIndicator.remove();
      }
    }
  };
  
  // Function to populate form with basic data
  const populateFormWithBasicData = (med: any) => {
    // Get form and set fields
    const form = document.querySelector('.modal-body form');
    if (!form) {
      console.error("Form not found");
      return;
    }

    // Set field helper function
    const setField = (id: string, value: any) => {
      const input = document.getElementById(id) as HTMLInputElement;
      if (input) {
        if (value !== null && value !== undefined) {
          input.value = value.toString();
          // Add a visual indicator that the field was populated
          input.style.backgroundColor = "#f8f9fa";
          setTimeout(() => input.style.backgroundColor = "", 500);
        }
      } else {
        console.warn(`Element with id ${id} not found`);
      }
    };
    
    // Set the name initially with full title
    setField('med-nom', med.nom || '');
    
    // Default quantity to 1
    setField('med-quantite', 1);
    
    // Leave date d'expiration empty - will be filled from scraped data if available
    // Don't set a default value
    
    console.log("Form prepared for detailed data");
  };
  
  // Handle selecting a medication from search results
  const handleSelectMedicament = (med: any) => {
    console.log("Selected medicament:", med);
    
    // Populate minimal information first
    populateFormWithBasicData(med);
    
    // Then fetch detailed information from scraper
    // Use the URL from tableau field if available
    fetchDetailedMedicamentInfo(med.tableau || med.nom);
  };
  
  // Update form with detailed data
  const updateFormWithDetailedData = (data: any) => {
    const setField = (id: string, value: any) => {
      const input = document.getElementById(id) as HTMLInputElement;
      if (input && value !== null && value !== undefined && value !== '') {
        input.value = value.toString();
        // Give different color to show it's updated with detailed data
        input.style.backgroundColor = "#e6f7ff";
        setTimeout(() => input.style.backgroundColor = "", 800);
      }
    };
    
    // Debug the received data
    console.log("Detailed medicament data:", data);
    
    if (data) {
      // Make sure to set the full title name
      setField('med-nom', data.nom);
      setField('med-code-atc', data.code_ATC);
      setField('med-dosage', data.dosage);
      setField('med-presentation', data.presentation);
      setField('med-prix-public', data.prix_public);
      setField('med-prix-hospitalier', data.prix_hospitalier);
      
      // Try multiple possible field names for prix_Conseillé
      const prixConseille = data.ppc || data.prix_Conseillé || data.prix_conseille || 
                            data.prixConseille || data.prix_conseil || data.PPC || 
                            (data.prix_public ? data.prix_public : null);
      
      console.log("Prix conseillé found:", prixConseille);
      setField('med-prix-Conseillé', prixConseille);
      
      setField('med-composition', data.composition);
      setField('med-classe', data.classe_therapeutique);
      setField('med-indications', data.indications);
      setField('med-nature', data.natureDuProduit);
      setField('med-tableau', data.tableau);
      
      // Set date_expiration if it exists in the data
      if (data.date_expiration) {
        setField('med-date-expiration', data.date_expiration);
      }
    }
  };

  // Debounce search to prevent too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchMedicament) {
        searchMedicamentsFromWeb(searchMedicament);
      }
    }, 100); // Reduced timeout to make search more responsive
    
    return () => clearTimeout(timer);
  }, [searchMedicament]);

  // Add a utility function to normalize text
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/['-]/g, '') // Remove apostrophes and hyphens
      .replace(/\s+/g, ' '); // Normalize spaces
  };

  // Add useEffect to handle search filtering
  useEffect(() => {
    if (searchTerm.trim() === '') {
      // Appliquer le filtre de visibilité
      const filtered = medicaments.filter(med => {
        if (visibilityFilter === 'all') return true;
        if (visibilityFilter === 'available') return med.en_vente;
        if (visibilityFilter === 'invisible') return !med.en_vente;
        return true;
      });
      setFilteredMedicaments(filtered);
    } else {
      const normalizedSearchTerm = normalizeText(searchTerm);
      const filtered = medicaments.filter(med => {
        const matchesSearch = normalizeText(med.nom).includes(normalizedSearchTerm) ||
          (med.natureDuProduit && normalizeText(med.natureDuProduit).includes(normalizedSearchTerm));
        
        // Appliquer le filtre de visibilité
        if (visibilityFilter === 'all') return matchesSearch;
        if (visibilityFilter === 'available') return matchesSearch && med.en_vente;
        if (visibilityFilter === 'invisible') return matchesSearch && !med.en_vente;
        return matchesSearch;
      });
      setFilteredMedicaments(filtered);
    }
  }, [searchTerm, medicaments, visibilityFilter]);

  // Add useEffect to handle commandes search filtering
  useEffect(() => {
    if (searchCommandeTerm.trim() === '') {
      // If search is empty, show only EN_ATTENTE orders
      setFilteredCommandes(commandes.filter(cmd => cmd.statut === "EN_ATTENTE"));
    } else {
      const filtered = commandes.filter(cmd => 
        cmd.statut === "EN_ATTENTE" && 
        cmd.pharmacien && 
        `${cmd.pharmacien.nom} ${cmd.pharmacien.prenom}`.toLowerCase().includes(searchCommandeTerm.toLowerCase())
      );
      setFilteredCommandes(filtered);
    }
  }, [searchCommandeTerm, commandes]);

  // Gestion des modals
  const handleAddMedicament = async () => {
    try {
      // Format date properly for Java backend
      const dateInput = document.getElementById('med-date-expiration') as HTMLInputElement;
      let dateExpiration = null;
      if (dateInput.value) {
        // Convert date string to ISO format
        dateExpiration = new Date(dateInput.value).toISOString();
      }
      
      // Helper function to truncate text to 1000 characters
      const truncateText = (text: string) => {
        return text ? text.substring(0, 1000) : '';
      };
      
      // Get values from form inputs and truncate text fields
      const medicament = {
        nom: truncateText((document.getElementById('med-nom') as HTMLInputElement).value),
        code_ATC: truncateText((document.getElementById('med-code-atc') as HTMLInputElement).value),
        dosage: truncateText((document.getElementById('med-dosage') as HTMLInputElement).value),
        presentation: truncateText((document.getElementById('med-presentation') as HTMLInputElement).value),
        prix_hospitalier: parseFloat((document.getElementById('med-prix-hospitalier') as HTMLInputElement).value) || 0,
        prix_public: parseFloat((document.getElementById('med-prix-public') as HTMLInputElement).value) || 0,
        prix_conseille: parseFloat((document.getElementById('med-prix-Conseillé') as HTMLInputElement).value) || 0,
        composition: truncateText((document.getElementById('med-composition') as HTMLInputElement).value),
        classe_therapeutique: truncateText((document.getElementById('med-classe') as HTMLInputElement).value),
        quantite: parseInt((document.getElementById('med-quantite') as HTMLInputElement).value) || 0,
        date_expiration: dateExpiration,
        indications: truncateText((document.getElementById('med-indications') as HTMLInputElement).value),
        natureDuProduit: truncateText((document.getElementById('med-nature') as HTMLInputElement).value),
        tableau: truncateText((document.getElementById('med-tableau') as HTMLInputElement).value)
      };
      
      console.log("Sending medicament data:", medicament);
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      // Send POST request to add medicament
      const response = await fetch('http://localhost:8080/medicaments', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(medicament)
      });
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        throw new Error(`Error adding medicament: ${response.status}`);
      }
      
      // Close the modal
      setShowAddModal(false);
      
      // Refresh the page instead of showing an alert
      window.location.reload();
    } catch (error) {
      console.error('Error saving medicament:', error);
      alert('Erreur lors de l\'ajout du médicament');
    }
  };

  const handleEditMedicament = (medicament: Medicament) => {
    setCurrentMedicament(medicament);
    setShowEditModal(true);
  };

  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      
      // Call the API to update the order status
      const response = await fetch(`http://localhost:8080/commandes/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error(`Error updating order status: ${response.status}`);
      }

      // Update local state by removing the order from the list since it's no longer EN_ATTENTE
      setCommandes(prevCommandes => prevCommandes.filter(commande => commande.id !== orderId));
      setFilteredCommandes(prevFiltered => prevFiltered.filter(commande => commande.id !== orderId));
      
      // Show success message
      alert('Statut de la commande mis à jour avec succès');
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Erreur lors de la mise à jour du statut de la commande');
    }
  };

  // Update the stats calculation
  const stats = {
    totalMedicaments: medicaments.length,
    totalStock: medicaments.reduce((sum, med) => sum + med.quantite, 0),
    // Filter out EN_COURS_DE_CREATION orders from total count
    totalCommandes: commandes.filter(cmd => cmd.statut !== "EN_COURS_DE_CREATION").length,
    enAttenteCommandes: commandes.filter(cmd => cmd.statut === "EN_ATTENTE").length,
  };

  // Add a handler function to navigate to medication details
  const handleMedicamentClick = (medicamentId: number) => {
    navigate(`/medicament/${medicamentId}`);
  };

  const handleDeleteMedicament = (medicamentId: number) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce médicament ?")) {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      // Show loading state
      setLoading(true);
      
      // Send DELETE request to remove medicament
      fetch(`http://localhost:8080/medicaments/${medicamentId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      })
      .then(response => {
        setLoading(false);
        
        if (response.ok) {
          // Update local state by filtering out the deleted medicament
          setMedicaments(medicaments.filter(med => med.id !== medicamentId));
          alert('Médicament supprimé avec succès');
        } else if (response.status === 401 || response.status === 403) {
          throw new Error('Vous n\'êtes pas autorisé à supprimer ce médicament');
        } else if (response.status === 404) {
          throw new Error('Médicament non trouvé');
        } else {
          throw new Error('Erreur lors de la suppression');
        }
      })
      .catch(error => {
        setLoading(false);
        console.error('Error deleting medicament:', error);
        alert(error.message || 'Erreur lors de la suppression du médicament');
      });
    }
  };

  const handleUpdateMedicament = async () => {
    if (!currentMedicament) return;
    
    try {
      // Format date properly
      const dateInput = document.getElementById('edit-med-date-expiration') as HTMLInputElement;
      let dateExpiration = null;
      if (dateInput.value) {
        dateExpiration = new Date(dateInput.value).toISOString();
      }
      
      // Get values from form inputs
      const updatedMedicament = {
        id: currentMedicament.id,
        nom: (document.getElementById('edit-med-nom') as HTMLInputElement).value,
        code_ATC: (document.getElementById('edit-med-code-atc') as HTMLInputElement).value,
        dosage: (document.getElementById('edit-med-dosage') as HTMLInputElement).value,
        presentation: (document.getElementById('edit-med-presentation') as HTMLInputElement).value,
        prix_hospitalier: parseFloat((document.getElementById('edit-med-prix-hospitalier') as HTMLInputElement).value) || 0,
        prix_public: parseFloat((document.getElementById('edit-med-prix-public') as HTMLInputElement).value) || 0,
        prix_conseille: parseFloat((document.getElementById('edit-med-prix-Conseillé') as HTMLInputElement).value) || 0,
        composition: (document.getElementById('edit-med-composition') as HTMLInputElement).value,
        classe_therapeutique: (document.getElementById('edit-med-classe') as HTMLInputElement).value,
        quantite: parseInt((document.getElementById('edit-med-quantite') as HTMLInputElement).value) || 0,
        date_expiration: dateExpiration,
        indications: (document.getElementById('edit-med-indications') as HTMLInputElement).value,
        natureDuProduit: (document.getElementById('edit-med-nature') as HTMLInputElement).value,
        tableau: (document.getElementById('edit-med-tableau') as HTMLInputElement).value
      };
      
      console.log("Sending updated medicament data:", updatedMedicament);
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      // The API endpoint is already correct: http://localhost:8080/medicaments/{id}
      const response = await fetch(`http://localhost:8080/medicaments/${currentMedicament.id}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(updatedMedicament)
      });
      
      if (!response.ok) {
        throw new Error(`Error updating medicament: ${response.status}`);
      }
      
      // Close the modal
      setShowEditModal(false);
      
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Error updating medicament:', error);
      alert('Erreur lors de la modification du médicament');
    }
  };

  const handleToggleVente = async (medicamentId: number, currentEnVente: boolean) => {
    try {
      const token = localStorage.getItem('token');
      setLoading(true);
      
      // Include the enVente parameter with the opposite of current value
      const response = await fetch(`http://localhost:8080/medicaments/${medicamentId}/toggle-vente?enVente=${!currentEnVente}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      setMedicaments(medicaments.map(med => 
        med.id === medicamentId ? { ...med, en_vente: !med.en_vente } : med
      ));
      
      setLoading(false);
    } catch (error) {
      console.error('Error toggling visibility:', error);
      setLoading(false);
      alert('Erreur lors du changement de visibilité');
    }
  };

  // Add new function to toggle all medications visibility
  const handleToggleAllVisibility = async (makeVisible: boolean) => {
    try {
      const token = localStorage.getItem('token');
      setLoading(true);
      
      // Get all medications that need to be updated
      const medicationsToUpdate = medicaments.filter(med => med.en_vente !== makeVisible);
      
      // Update each medication
      for (const med of medicationsToUpdate) {
        const response = await fetch(`http://localhost:8080/medicaments/${med.id}/toggle-vente?enVente=${makeVisible}`, {
          method: 'PUT',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
      }
      
      // Update local state
      setMedicaments(medicaments.map(med => ({ ...med, en_vente: makeVisible })));
      
      setLoading(false);
      alert(`Tous les médicaments sont maintenant ${makeVisible ? 'disponibles' : 'invisibles'}`);
    } catch (error) {
      console.error('Error toggling all visibility:', error);
      setLoading(false);
      alert('Erreur lors du changement de visibilité');
    }
  };

  // Update the handleCommandesClick function
  const handleCommandesClick = () => {
    navigate('/Commandes_fournisseur');
  };

  // Chatbot message handler
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
      const response = await axios.post('http://localhost:8080/api/rag/chat', {
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

  return (
    <div className="dashboard-fournisseur">
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Chargement du tableau de bord...</p>
        </div>
      ) : (
        <Container fluid>
          <Row className="header">
            <Col>
              <h1><FaPills className="icon-header"/> Espace Fournisseur</h1>
              <p>Gérez votre stock et vos commandes</p>
            </Col>
          </Row>
          
          <Row className="stats-container">
            <Col md={3} sm={6}>
              <Card className="stat-card animate-card">
                <Card.Body>
                  <div className="stat-icon"><FaPills /></div>
                  <h3>{stats.totalMedicaments}</h3>
                  <p>Médicaments</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6}>
              <Card className="stat-card animate-card">
                <Card.Body>
                  <div className="stat-icon"><FaWarehouse /></div>
                  <h3>{stats.totalStock}</h3>
                  <p>Unités en stock</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6}>
              <Card 
                className="stat-card animate-card" 
                onClick={handleCommandesClick}
                style={{ cursor: 'pointer' }}
              >
                <Card.Body>
                  <div className="stat-icon"><FaClipboardList /></div>
                  <h3>{stats.totalCommandes}</h3>
                  <p>Toutes les Commandes</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6}>
              <Card 
                className="stat-card animate-card" 
                onClick={() => {
                  setActiveTab('commandes');
                }}
                style={{ cursor: 'pointer' }}
              >
                <Card.Body>
                  <div className="stat-icon"><FaTruck /></div>
                  <h3>{stats.enAttenteCommandes}</h3>
                  <p>En attente</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <Row className="main-content">
            <Col lg={12}>
              <Tabs 
                activeKey={activeTab} 
                onSelect={(k) => setActiveTab(k || 'stock')} 
                id="dashboard-tabs" 
                className="mb-4"
              >
                <Tab eventKey="stock" title={<span><FaWarehouse /> Stock de Médicaments</span>}>
                  <Card className="content-card">
                    <Card.Body>
                      <div className="d-flex justify-content-between mb-4">
                        <h2>Gestion du Stock</h2>
                        <Button variant="primary" onClick={() => setShowAddModal(true)}>
                          <FaPlus /> Ajouter un médicament
                        </Button>
                      </div>
                      
                      <Row>
                        <Col lg={4} md={12}>
                          <div className="chart-container">
                            <h4>Répartition du Stock</h4>
                            {medicaments.length > 0 ? (
                              <Pie data={stockData} options={{ plugins: { legend: { display: false } } }} />
                            ) : (
                              <>
                                <Pie data={stockData} options={{ 
                                  plugins: { 
                                    legend: { display: false },
                                    tooltip: { enabled: false }
                                  }
                                }} />
                                <div className="text-center mt-3 text-muted">
                                  <p>Aucun médicament disponible</p>
                                </div>
                              </>
                            )}
                          </div>
                        </Col>
                        
                        <Col lg={8} md={12}>
                          <InputGroup className="mb-3">
                            <InputGroup.Text><FaSearch /></InputGroup.Text>
                            <Form.Control 
                              placeholder="Rechercher un médicament par nom ou nature du produit" 
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </InputGroup>
                          
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <div className="d-flex align-items-center">
                              <span className="me-2 fw-bold">Filtrer:</span>
                              <div className="d-flex gap-1">
                                <Button 
                                  variant={visibilityFilter === 'all' ? 'primary' : 'outline-primary'}
                                  size="sm"
                                  onClick={() => setVisibilityFilter('all')}
                                >
                                  Tous
                                </Button>
                                <Button 
                                  variant={visibilityFilter === 'available' ? 'success' : 'outline-success'}
                                  size="sm"
                                  onClick={() => setVisibilityFilter('available')}
                                  className={visibilityFilter === 'available' ? '' : 'btn-custom-gray'}
                                >
                                  Disponibles
                                </Button>
                                <Button 
                                  variant="outline-secondary"
                                  size="sm"
                                  onClick={() => setVisibilityFilter('invisible')}
                                  className={`btn-invisible ${visibilityFilter === 'invisible' ? 'active' : ''}`}
                                >
                                  Invisibles
                                </Button>
                              </div>
                            </div>
                            <div className="d-flex gap-1">
                              <Button 
                                variant="success" 
                                size="sm"
                                onClick={() => handleToggleAllVisibility(true)}
                              >
                                Tout disponible
                              </Button>
                              <Button 
                                variant="outline-secondary" 
                                size="sm"
                                className="btn-custom-gray"
                                onClick={() => handleToggleAllVisibility(false)}
                              >
                                Tout invisible
                              </Button>
                            </div>
                          </div>
                          
                          <div className="table-responsive">
                            <Table striped hover>
                              <thead>
                                <tr>
                                  <th style={{textAlign: 'left'}}>Nom</th>
                                  <th style={{textAlign: 'left'}}>Quantité</th>
                                  <th style={{textAlign: 'left'}}>Nature du Produit</th>
                                  <th style={{textAlign: 'left'}}>Prix Hospitalier</th>
                                  <th style={{textAlign: 'right'}}>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredMedicaments.map(med => (
                                  <tr 
                                    key={med.id} 
                                    className="table-row-animate"
                                  >
                                    <td style={{textAlign: 'left'}} onClick={() => handleMedicamentClick(med.id)}>{med.nom}</td>
                                    <td style={{textAlign: 'left'}} onClick={() => handleMedicamentClick(med.id)}>{med.quantite}</td>
                                    <td style={{textAlign: 'left'}} onClick={() => handleMedicamentClick(med.id)}>{med.natureDuProduit || 'Non spécifié'}</td>
                                    <td style={{textAlign: 'left'}} onClick={() => handleMedicamentClick(med.id)}>{med.prix_hospitalier || 'N/A'} {med.prix_hospitalier ? 'DHS' : ''}</td>
                                    <td style={{textAlign: 'right'}}>
                                      <Button variant="outline-primary" size="sm" className="me-1" onClick={() => handleEditMedicament(med)}>
                                        <FaEdit /> Modifier
                                      </Button>
                                      <Button 
                                        variant={med.en_vente ? "success" : "outline-secondary"} 
                                        size="sm" 
                                        className={`me-1 ${!med.en_vente ? 'btn-custom-gray' : ''}`}
                                        onClick={() => handleToggleVente(med.id, med.en_vente || false)}
                                      >
                                        {med.en_vente ? "Disponible" : "Invisible"}
                                      </Button>
                                      <Button variant="outline-danger" size="sm" onClick={() => handleDeleteMedicament(med.id)}>
                                        <FaTrash /> Supprimer
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Tab>
                
                <Tab eventKey="commandes" title={<span><FaClipboardList /> Commandes en attente</span>}>
                  <Card className="content-card">
                    <Card.Body>
                      <h2>Commandes en attente des Pharmacies</h2>
                      
                      <Row className="mb-4">
                        <Col lg={12}>
                          <InputGroup>
                            <InputGroup.Text><FaSearch /></InputGroup.Text>
                            <Form.Control 
                              placeholder="Rechercher par pharmacien..." 
                              onChange={(e) => setSearchCommandeTerm(e.target.value)}
                            />
                          </InputGroup>
                        </Col>
                      </Row>
                      
                      <Row>
                        <Col lg={8} md={12}>
                          <div className="table-responsive">
                            <Table striped hover>
                              <thead>
                                <tr>
                                  <th>ID</th>
                                  <th>Pharmacien</th>
                                  <th>Date</th>
                                  <th>Statut</th>
                                  <th>Montant (DHS)</th>
                                  <th>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredCommandes.map(commande => (
                                  <tr key={commande.id} className="table-row-animate">
                                    <td>{commande.id}</td>
                                    <td>{commande.pharmacien ? `${commande.pharmacien.nom} ${commande.pharmacien.prenom}` : 'N/A'}</td>
                                    <td>{commande.dateCommande ? new Date(commande.dateCommande).toLocaleDateString() : 'N/A'}</td>
                                    <td>
                                      <Badge bg={
                                        commande.statut === "EN_ATTENTE" ? "warning" :
                                        commande.statut === "EN_COURS_DE_LIVRAISON" ? "info" : "success"
                                      }>
                                        {commande.statut === "EN_ATTENTE" ? "En Attente" :
                                         commande.statut === "EN_COURS_DE_LIVRAISON" ? "En Cours De Livraison" :
                                         commande.statut === "LIVREE" ? "Livré" : commande.statut}
                                      </Badge>
                                    </td>
                                    <td>{commande.montant.toFixed(1)} DHS</td>
                                    <td>
                                      <Button 
                                        variant="outline-primary" 
                                        size="sm" 
                                        className="me-1" 
                                        onClick={() => navigate(`/detaille-commande/${commande.id}`)}
                                      >
                                        Détails
                                      </Button>
                                      {commande.statut === "EN_ATTENTE" && (
                                        <Button 
                                          variant="outline-info" 
                                          size="sm"
                                          onClick={() => handleUpdateOrderStatus(commande.id, "EN_COURS_DE_LIVRAISON")}
                                        >
                                          Expédier
                                        </Button>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </div>
                        </Col>
                        
                        <Col lg={4} md={12}>
                          <div className="chart-container">
                            <h4>Évolution des Commandes</h4>
                            <Line data={commandesData} />
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Tab>
              </Tabs>
            </Col>
          </Row>
        </Container>
      )}
      
      {/* Modal pour ajouter un médicament */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Ajouter un médicament</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Rechercher un médicament</Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="Saisir le nom du médicament..." 
                  value={searchMedicament}
                  onChange={(e) => setSearchMedicament(e.target.value)}
                />
              </Form.Group>
              
              <p className="text-muted small mb-3">
                <em>Tous les médicaments recherchés proviennent du site <a href="https://medicament.ma/listing-des-medicaments/" target="_blank" rel="noopener noreferrer">medicament.ma</a>. Si par malheur la barre de recherche ne fonctionne plus correctement, vous pouvez consulter le site directement.</em>
              </p>
              
              {isSearching && (
                <div className="text-center my-2">
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Recherche en cours...</span>
                  </div>
                </div>
              )}
              
              {searchResults.length > 0 && (
                <div className="search-results-container mb-3" style={{overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px'}}>
                  <ListGroup>
                    {searchResults.map((med, index) => (
                      <ListGroup.Item 
                        key={index} 
                        action 
                        onClick={() => handleSelectMedicament(med)}
                        className="py-2"
                      >
                        <div><strong>{med.nom}</strong></div>
                        {med.description && <small>{med.description}</small>}
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </div>
              )}
              
              {searchMedicament && searchResults.length === 0 && !isSearching && (
                <p className="text-muted">Aucun médicament trouvé</p>
              )}
            </Col>
            
            <Col md={6}>
              <Form onSubmit={(e) => e.preventDefault()}>
                <Form.Group className="mb-3">
                  <Form.Label>Nom du médicament</Form.Label>
                  <Form.Control type="text" placeholder="Entrez le nom" id="med-nom" />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Code ATC</Form.Label>
                  <Form.Control type="text" placeholder="Code ATC" id="med-code-atc" />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Dosage</Form.Label>
                  <Form.Control type="text" placeholder="Dosage" id="med-dosage" />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Présentation</Form.Label>
                  <Form.Control type="text" placeholder="Présentation" id="med-presentation" />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Prix Public (DHS)</Form.Label>
                  <Form.Control type="number" min="0" step="0.01" placeholder="Prix public" id="med-prix-public" />
                  <Form.Text className="text-muted">Prix officiel de vente au public en pharmacie.</Form.Text>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Prix Hospitalier (DHS)</Form.Label>
                  <Form.Control type="number" min="0" step="0.01" placeholder="Prix hospitalier" id="med-prix-hospitalier" />
                  <Form.Text className="text-muted">Prix spécifique pour les établissements hospitaliers.</Form.Text>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Prix Conseillé (DHS)</Form.Label>
                  <Form.Control type="number" min="0" step="0.01" placeholder="Prix Conseillé" id="med-prix-Conseillé" />
                  <Form.Text className="text-muted">Prix recommandé par le fabricant pour la revente.</Form.Text>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Composition</Form.Label>
                  <Form.Control type="text" placeholder="Composition" id="med-composition" />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Classe Thérapeutique</Form.Label>
                  <Form.Control type="text" placeholder="Classe thérapeutique" id="med-classe" />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Quantité</Form.Label>
                  <Form.Control type="number" min="1" placeholder="Quantité" id="med-quantite" />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Date d'expiration</Form.Label>
                  <Form.Control type="date" id="med-date-expiration" />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Indications</Form.Label>
                  <Form.Control as="textarea" rows={2} placeholder="Indications" id="med-indications" />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Nature du Produit</Form.Label>
                  <Form.Control type="text" placeholder="Nature du produit" id="med-nature" />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Tableau</Form.Label>
                  <Form.Control type="text" placeholder="Tableau" id="med-tableau" />
                </Form.Group>
              </Form>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Annuler
          </Button>
          <Button 
            variant="primary" 
            onClick={(e) => {
              e.preventDefault(); // Prevent default behavior
              handleAddMedicament();
            }}
            type="button" // Explicitly set as button type, not submit
          >
            Ajouter
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Modal pour éditer un médicament */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Modifier le médicament</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentMedicament && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Nom du médicament</Form.Label>
                <Form.Control type="text" id="edit-med-nom" defaultValue={currentMedicament.nom} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Code ATC</Form.Label>
                <Form.Control type="text" id="edit-med-code-atc" defaultValue={currentMedicament.code_ATC || ''} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Dosage</Form.Label>
                <Form.Control type="text" id="edit-med-dosage" defaultValue={currentMedicament.dosage || ''} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Présentation</Form.Label>
                <Form.Control type="text" id="edit-med-presentation" defaultValue={currentMedicament.presentation || ''} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Prix Public (DHS)</Form.Label>
                <Form.Control type="number" min="0" step="0.01" id="edit-med-prix-public" defaultValue={currentMedicament.prix_public || currentMedicament.prix} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Prix Hospitalier (DHS)</Form.Label>
                <Form.Control type="number" min="0" step="0.01" id="edit-med-prix-hospitalier" defaultValue={currentMedicament.prix_hospitalier || ''} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Prix Conseillé (DHS)</Form.Label>
                <Form.Control type="number" min="0" step="0.01" id="edit-med-prix-Conseillé" defaultValue={currentMedicament.prix_conseille || ''} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Composition</Form.Label>
                <Form.Control type="text" id="edit-med-composition" defaultValue={currentMedicament.composition || ''} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Classe Thérapeutique</Form.Label>
                <Form.Control type="text" id="edit-med-classe" defaultValue={currentMedicament.classe_therapeutique || currentMedicament.categorie} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Quantité</Form.Label>
                <Form.Control type="number" min="1" id="edit-med-quantite" defaultValue={currentMedicament.quantite} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Date d'expiration</Form.Label>
                <Form.Control type="date" id="edit-med-date-expiration" defaultValue={currentMedicament.dateExpiration} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Indications</Form.Label>
                <Form.Control as="textarea" rows={2} id="edit-med-indications" defaultValue={currentMedicament.indications || ''} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Nature du Produit</Form.Label>
                <Form.Control type="text" id="edit-med-nature" defaultValue={currentMedicament.natureDuProduit || ''} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Tableau</Form.Label>
                <Form.Control type="text" id="edit-med-tableau" defaultValue={currentMedicament.tableau || ''} />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleUpdateMedicament}>
            Enregistrer
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Modal pour les détails d'une commande */}
      <Modal show={showOrderDetails} onHide={() => setShowOrderDetails(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Détails de la commande #{selectedOrder?.id}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <>
              <Row className="mb-4">
                <Col md={6}>
                  <p><strong>Pharmacien:</strong> {selectedOrder.pharmacien ? `${selectedOrder.pharmacien.nom} ${selectedOrder.pharmacien.prenom}` : 'N/A'}</p>
                  <p><strong>Date:</strong> {selectedOrder.dateCommande ? new Date(selectedOrder.dateCommande).toLocaleDateString() : 'N/A'}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Statut:</strong> 
                    <Badge bg={
                      selectedOrder.statut === "EN_ATTENTE" ? "warning" :
                      selectedOrder.statut === "EN_COURS_DE_LIVRAISON" ? "info" : "success"
                    } className="ms-2">
                      {selectedOrder.statut === "EN_ATTENTE" ? "En Attente" :
                       selectedOrder.statut === "EN_COURS_DE_LIVRAISON" ? "En Cours De Livraison" :
                       selectedOrder.statut === "LIVREE" ? "Livré" : selectedOrder.statut}
                    </Badge>
                  </p>
                  <p><strong>Montant Total:</strong> {selectedOrder.montant.toFixed(1)} DHS</p>
                </Col>
              </Row>
              
              <h5>Produits commandés</h5>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Quantité</th>
                    <th>Prix unitaire (DHS)</th>
                    <th>Total (DHS)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.lignesCommande.map((ligne) => {
                    const prixUnitaire = ligne.medicament.prix_hospitalier || ligne.medicament.prix_unitaire || 0;
                    return (
                      <tr key={ligne.id}>
                        <td>{ligne.medicament.nom}</td>
                        <td>{ligne.quantite}</td>
                        <td>{prixUnitaire.toFixed(1)} DHS</td>
                        <td>{(ligne.quantite * prixUnitaire).toFixed(1)} DHS</td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
              
              {selectedOrder.statut === "EN_ATTENTE" && (
                <div className="mt-4">
                  <h5>Mettre à jour le statut</h5>
                  <div className="d-flex gap-2">
                    <Button 
                      variant="info" 
                      onClick={() => {
                        handleUpdateOrderStatus(selectedOrder.id, "EN_COURS_DE_LIVRAISON");
                        setShowOrderDetails(false);
                      }}
                    >
                      Marquer comme En Cours De Livraison
                    </Button>
                    <Button 
                      variant="success" 
                      onClick={() => {
                        handleUpdateOrderStatus(selectedOrder.id, "LIVREE");
                        setShowOrderDetails(false);
                      }}
                    >
                      Marquer comme Livré
                    </Button>
                  </div>
                </div>
              )}
              
              {selectedOrder.statut === "EN_COURS_DE_LIVRAISON" && (
                <div className="mt-4">
                  <h5>Mettre à jour le statut</h5>
                  <Button 
                    variant="success" 
                    onClick={() => {
                      handleUpdateOrderStatus(selectedOrder.id, "LIVREE");
                      setShowOrderDetails(false);
                    }}
                  >
                    Marquer comme Livré
                  </Button>
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowOrderDetails(false)}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Chatbot Button */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="client-chat-button"
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#8e44ad',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
          zIndex: 1000
        }}
      >
        {chatOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </button>

      {/* Chatbot Window */}
      {chatOpen && (
        <div className="client-chat-window" style={{
          position: 'fixed',
          bottom: '100px',
          right: '2rem',
          width: '380px',
          height: '500px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          overflow: 'hidden'
        }}>
          {/* Chat Header */}
          <div className="client-chat-header" style={{
            padding: '1rem',
            backgroundColor: '#8e44ad',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div className="client-chat-bot-icon" style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bot size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Assistant Pharmacie</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.9 }}>En ligne</p>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="client-chat-messages" style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem',
            backgroundColor: '#f8f9fa'
          }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{
                display: 'flex',
                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '1rem'
              }}>
                <div style={{
                  maxWidth: '75%',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  backgroundColor: msg.sender === 'user' ? '#8e44ad' : 'white',
                  color: msg.sender === 'user' ? 'white' : '#1f2937',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5' }}>{msg.text}</p>
                  <span style={{
                    display: 'block',
                    marginTop: '0.25rem',
                    fontSize: '0.7rem',
                    opacity: 0.7
                  }}>
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}
            {isSendingMessage && (
              <div style={{
                display: 'flex',
                justifyContent: 'flex-start',
                marginBottom: '1rem'
              }}>
                <div style={{
                  padding: '0.75rem',
                  borderRadius: '12px',
                  backgroundColor: 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>
                    <span style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>●</span>
                    <span style={{ animation: 'pulse 1.5s ease-in-out infinite', animationDelay: '0.2s' }}>●</span>
                    <span style={{ animation: 'pulse 1.5s ease-in-out infinite', animationDelay: '0.4s' }}>●</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div style={{
            padding: '1rem',
            backgroundColor: 'white',
            borderTop: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center'
            }}>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isSendingMessage && handleSendMessage()}
                placeholder="Tapez votre message..."
                disabled={isSendingMessage}
                style={{
                  flex: 1,
                  padding: '0.625rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none',
                  height: '40px'
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={isSendingMessage || inputMessage.trim() === ''}
                style={{
                  padding: '0.5rem',
                  backgroundColor: '#8e44ad',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  opacity: (isSendingMessage || inputMessage.trim() === '') ? 0.5 : 1,
                  transition: 'opacity 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '40px',
                  height: '40px'
                }}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardFournisseur;