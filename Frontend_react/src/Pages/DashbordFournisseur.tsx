// DashboardFournisseur.tsx
import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Badge, Tabs, Tab, Modal, InputGroup } from 'react-bootstrap';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, BarElement } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';
import { FaPills, FaClipboardList, FaTruck, FaWarehouse, FaSearch, FaEdit, FaTrash, FaPlus, FaFilter } from 'react-icons/fa';
import '../Styles/dashboardFournisseur.css';

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
  const [commandes, setCommandes] = useState<Order[]>([]);
  const [filteredCommandes, setFilteredCommandes] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Toutes');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  interface Medicament {
    id: number;
    nom: string;
    categorie: string;
    quantite: number;
    prix: number;
    dateExpiration: string;
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
        quantite: number;
      }
    }[];
    montant: number;
  }
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

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
          // Don't use credentials: 'include' which is causing CORS issues
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            // If you have a token-based auth system:
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        
        console.log("Response status:", response.status);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Raw data received:", data);
        
        // Ensure data has the expected structure
        const processedData = Array.isArray(data) ? data.map(item => ({
          id: item.id || Math.random(),
          nom: item.nom || item.name || "Sans nom",
          categorie: item.categorie || item.category || "Non classé",
          quantite: item.quantite || item.quantity || 0,
          prix: item.prix_unitaire || item.prix || item.price || 0,
          dateExpiration: item.date_expiration ? new Date(item.date_expiration).toISOString().split('T')[0] : item.dateExpiration || "Non définie"
        })) : [];
        
        console.log("Processed data:", processedData);
        setMedicaments(processedData);
        
        // Fetch commandes data from the API
        try {
          console.log("Attempting to fetch commandes...");
          const commandesUrl = 'http://localhost:8080/commandes/current_user';
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
          
          // Process the commandes data
          const processedCommandes = Array.isArray(commandesData) ? commandesData.map(item => ({
            id: item.id,
            dateCommande: item.dateCommande,
            statut: item.statut,
            pharmacien: item.pharmacien,
            fournisseur: item.fournisseur,
            lignesCommande: item.lignesCommande,
            // Calculate total amount
            montant: item.lignesCommande.reduce((total: number, ligne: any) => 
              total + (ligne.quantite * ligne.medicament.prix_unitaire), 0)
          })) : [];
          
          console.log("Processed commandes data:", processedCommandes);
          setCommandes(processedCommandes);
          setFilteredCommandes(processedCommandes);
        } catch (error) {
          console.error("Error fetching commandes:", error);
          // Fallback to mock commandes data
          const mockOrders: Order[] = [
            { 
              id: 1, 
              pharmacien: { id: 1, nom: "Pharmacie Centrale", prenom: "" }, 
              dateCommande: "2025-04-22", 
              statut: "EN_ATTENTE", 
              fournisseur: { id: 1, nom: "Fournisseur 1", prenom: "" },
              lignesCommande: [
                { id: 1, quantite: 50, medicament: { id: 1, nom: "Amoxicilline", prix_unitaire: 85, quantite: 50 } },
                { id: 2, quantite: 30, medicament: { id: 2, nom: "Doliprane", prix_unitaire: 25, quantite: 30 } }
              ],
              montant: 4250
            },
            { 
              id: 2, 
              pharmacien: { id: 2, nom: "Pharmacie du Soleil", prenom: "" }, 
              dateCommande: "2025-04-20", 
              statut: "EN_COURS_DE_LIVRAISON", 
              fournisseur: { id: 1, nom: "Fournisseur 1", prenom: "" },
              lignesCommande: [
                { id: 3, quantite: 20, medicament: { id: 3, nom: "Ventoline", prix_unitaire: 130, quantite: 20 } },
                { id: 4, quantite: 10, medicament: { id: 4, nom: "Kardégic", prix_unitaire: 75, quantite: 10 } }
              ],
              montant: 3600
            },
            { 
              id: 3, 
              pharmacien: { id: 3, nom: "Pharmacie Moderne", prenom: "" }, 
              dateCommande: "2025-04-18", 
              statut: "LIVREE", 
              fournisseur: { id: 1, nom: "Fournisseur 1", prenom: "" },
              lignesCommande: [
                { id: 5, quantite: 25, medicament: { id: 5, nom: "Spasfon", prix_unitaire: 40, quantite: 25 } },
                { id: 6, quantite: 30, medicament: { id: 6, nom: "Levothyrox", prix_unitaire: 60, quantite: 30 } }
              ],
              montant: 2900
            },
            { 
              id: 4, 
              pharmacien: { id: 4, nom: "Pharmacie des Alpes", prenom: "" }, 
              dateCommande: "2025-04-15", 
              statut: "LIVREE",
              fournisseur: { id: 1, nom: "Fournisseur 1", prenom: "" }, 
              lignesCommande: [
                { id: 7, quantite: 60, medicament: { id: 1, nom: "Amoxicilline", prix_unitaire: 85, quantite: 60 } }
              ],
              montant: 5100
            }
          ];
          console.log("Using mock commandes data as fallback");
          setCommandes(mockOrders);
          setFilteredCommandes(mockOrders);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching medications:", error);
        // Continue using mock data
        const mockMedicaments = [
          { id: 1, nom: "Amoxicilline", categorie: "Antibiotique", quantite: 200, prix: 85, dateExpiration: "2025-09-15" },
          { id: 2, nom: "Doliprane", categorie: "Analgésique", quantite: 350, prix: 25, dateExpiration: "2026-03-20" },
          { id: 3, nom: "Ventoline", categorie: "Respiratoire", quantite: 120, prix: 130, dateExpiration: "2025-11-10" },
          { id: 4, nom: "Spasfon", categorie: "Antispasmodique", quantite: 180, prix: 40, dateExpiration: "2026-01-05" },
          { id: 5, nom: "Kardégic", categorie: "Cardiovasculaire", quantite: 90, prix: 75, dateExpiration: "2025-08-22" },
          { id: 6, nom: "Levothyrox", categorie: "Hormonal", quantite: 110, prix: 60, dateExpiration: "2025-12-18" },
        ];
        
        console.log("Using mock data as fallback");
        setMedicaments(mockMedicaments);
        
        // Keep the rest of your code...
        setLoading(false);
      }
    };
    
    fetchMedicaments();
  }, []);

  // Filtrer les commandes
  useEffect(() => {
    let results = commandes;
    
    if (searchTerm) {
      results = results.filter(commande => 
        commande.pharmacien?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        commande.fournisseur?.nom.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterStatus !== 'Toutes') {
      results = results.filter(commande => commande.statut === filterStatus);
    }
    
    setFilteredCommandes(results);
  }, [searchTerm, filterStatus, commandes]);

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

  // Gestion des modals
  const handleAddMedicament = () => {
    setShowAddModal(false);
    // Logique pour ajouter un médicament
  };

  const handleEditMedicament = (medicament: Medicament) => {
    setCurrentMedicament(medicament);
    setShowEditModal(true);
  };

  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleUpdateOrderStatus = (orderId: number, newStatus: string) => {
    const updatedCommandes = commandes.map(commande =>
      commande.id === orderId ? { ...commande, statut: newStatus } : commande
    );
    setCommandes(updatedCommandes);
    setFilteredCommandes(
      filteredCommandes.map(commande =>
        commande.id === orderId ? { ...commande, statut: newStatus } : commande
      )
    );
  };

  // Calcul des statistiques
  const stats = {
    totalMedicaments: medicaments.length,
    totalStock: medicaments.reduce((sum, med) => sum + med.quantite, 0),
    totalCommandes: commandes.length,
    enAttenteCommandes: commandes.filter(cmd => cmd.statut === "EN_ATTENTE").length,
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
              <Card className="stat-card animate-card">
                <Card.Body>
                  <div className="stat-icon"><FaClipboardList /></div>
                  <h3>{stats.totalCommandes}</h3>
                  <p>Commandes totales</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} sm={6}>
              <Card className="stat-card animate-card">
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
              <Tabs defaultActiveKey="stock" id="dashboard-tabs" className="mb-4">
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
                              <Pie data={stockData} options={{ plugins: { legend: { position: 'bottom' } } }} />
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
                              placeholder="Rechercher un médicament..." 
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </InputGroup>
                          
                          <div className="table-responsive">
                            <Table striped hover>
                              <thead>
                                <tr>
                                  <th>Nom</th>
                                  <th>Quantité</th>
                                  <th>Prix (DHS)</th>
                                  <th>Date d'expiration</th>
                                  <th>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {medicaments.map(med => (
                                  <tr key={med.id} className="table-row-animate">
                                    <td>{med.nom}</td>
                                    <td>{med.quantite}</td>
                                    <td>{med.prix.toFixed(1)} DHS</td>
                                    <td>{med.dateExpiration}</td>
                                    <td>
                                      <Button variant="outline-primary" size="sm" className="me-1" onClick={() => handleEditMedicament(med)}>
                                        <FaEdit />
                                      </Button>
                                      <Button variant="outline-danger" size="sm">
                                        <FaTrash />
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
                
                <Tab eventKey="commandes" title={<span><FaClipboardList /> Commandes</span>}>
                  <Card className="content-card">
                    <Card.Body>
                      <h2>Commandes des Pharmacies</h2>
                      
                      <Row className="mb-4">
                        <Col lg={8} md={6}>
                          <InputGroup>
                            <InputGroup.Text><FaSearch /></InputGroup.Text>
                            <Form.Control 
                              placeholder="Rechercher par pharmacien..." 
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </InputGroup>
                        </Col>
                        <Col lg={4} md={6}>
                          <InputGroup>
                            <InputGroup.Text><FaFilter /></InputGroup.Text>
                            <Form.Select 
                              value={filterStatus}
                              onChange={(e) => setFilterStatus(e.target.value)}
                            >
                              <option value="Toutes">Toutes les commandes</option>
                              <option value="EN_ATTENTE">En Attente</option>
                              <option value="EN_COURS_DE_LIVRAISON">En Cours De Livraison</option>
                              <option value="LIVREE">Livré</option>
                            </Form.Select>
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
                                      <Button variant="outline-primary" size="sm" className="me-1" onClick={() => handleViewOrderDetails(commande)}>
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
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Ajouter un médicament</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nom du médicament</Form.Label>
              <Form.Control type="text" placeholder="Entrez le nom" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Catégorie</Form.Label>
              <Form.Select>
                <option>Antibiotique</option>
                <option>Analgésique</option>
                <option>Respiratoire</option>
                <option>Antispasmodique</option>
                <option>Cardiovasculaire</option>
                <option>Hormonal</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Quantité</Form.Label>
              <Form.Control type="number" min="1" placeholder="Quantité" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Prix (DHS)</Form.Label>
              <Form.Control type="number" min="0" step="0.01" placeholder="Prix unitaire" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Date d'expiration</Form.Label>
              <Form.Control type="date" />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleAddMedicament}>
            Ajouter
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Modal pour éditer un médicament */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Modifier le médicament</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentMedicament && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Nom du médicament</Form.Label>
                <Form.Control type="text" defaultValue={currentMedicament.nom} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Catégorie</Form.Label>
                <Form.Select defaultValue={currentMedicament.categorie}>
                  <option>Antibiotique</option>
                  <option>Analgésique</option>
                  <option>Respiratoire</option>
                  <option>Antispasmodique</option>
                  <option>Cardiovasculaire</option>
                  <option>Hormonal</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Quantité</Form.Label>
                <Form.Control type="number" min="1" defaultValue={currentMedicament.quantite} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Prix (DHS)</Form.Label>
                <Form.Control type="number" min="0" step="0.01" defaultValue={currentMedicament.prix} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Date d'expiration</Form.Label>
                <Form.Control type="date" defaultValue={currentMedicament.dateExpiration} />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={() => setShowEditModal(false)}>
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
                  {selectedOrder.lignesCommande.map((ligne) => (
                    <tr key={ligne.id}>
                      <td>{ligne.medicament.nom}</td>
                      <td>{ligne.quantite}</td>
                      <td>{ligne.medicament.prix_unitaire.toFixed(1)} DHS</td>
                      <td>{(ligne.quantite * ligne.medicament.prix_unitaire).toFixed(1)} DHS</td>
                    </tr>
                  ))}
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
    </div>
  );
};

export default DashboardFournisseur;