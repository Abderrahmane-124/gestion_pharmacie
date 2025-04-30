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
    pharmacie: string;
    date: string;
    statut: string;
    montant: number;
    produits: { nom: string; quantite: number; prix: number }[];
  }
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Données factices pour la démo
  useEffect(() => {
    // Simuler le chargement des données depuis une API
    setTimeout(() => {
      const mockMedicaments = [
        { id: 1, nom: "Amoxicilline", categorie: "Antibiotique", quantite: 200, prix: 85, dateExpiration: "2025-09-15" },
        { id: 2, nom: "Doliprane", categorie: "Analgésique", quantite: 350, prix: 25, dateExpiration: "2026-03-20" },
        { id: 3, nom: "Ventoline", categorie: "Respiratoire", quantite: 120, prix: 130, dateExpiration: "2025-11-10" },
        { id: 4, nom: "Spasfon", categorie: "Antispasmodique", quantite: 180, prix: 40, dateExpiration: "2026-01-05" },
        { id: 5, nom: "Kardégic", categorie: "Cardiovasculaire", quantite: 90, prix: 75, dateExpiration: "2025-08-22" },
        { id: 6, nom: "Levothyrox", categorie: "Hormonal", quantite: 110, prix: 60, dateExpiration: "2025-12-18" },
      ];
      
      const mockCommandes = [
        { id: 1, pharmacie: "Pharmacie Centrale", date: "2025-04-22", statut: "En Attente", montant: 4250, produits: [
          { nom: "Amoxicilline", quantite: 50, prix: 85 },
          { nom: "Doliprane", quantite: 30, prix: 25 }
        ] },
        { id: 2, pharmacie: "Pharmacie du Soleil", date: "2025-04-20", statut: "En Cours De Livraison", montant: 3600, produits: [
          { nom: "Ventoline", quantite: 20, prix: 130 },
          { nom: "Kardégic", quantite: 10, prix: 75 }
        ] },
        { id: 3, pharmacie: "Pharmacie Moderne", date: "2025-04-18", statut: "Livré", montant: 2900, produits: [
          { nom: "Spasfon", quantite: 25, prix: 40 },
          { nom: "Levothyrox", quantite: 30, prix: 60 }
        ] },
        { id: 4, pharmacie: "Pharmacie des Alpes", date: "2025-04-15", statut: "Livré", montant: 5100, produits: [
          { nom: "Amoxicilline", quantite: 60, prix: 85 }
        ] }
      ];
      
      setMedicaments(mockMedicaments);
      setCommandes(mockCommandes);
      setFilteredCommandes(mockCommandes);
      setLoading(false);
    }, 1500);
  }, []);

  // Filtrer les commandes
  useEffect(() => {
    let results = commandes;
    
    if (searchTerm) {
      results = results.filter(commande => 
        commande.pharmacie.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterStatus !== 'Toutes') {
      results = results.filter(commande => commande.statut === filterStatus);
    }
    
    setFilteredCommandes(results);
  }, [searchTerm, filterStatus, commandes]);

  // Données pour les graphiques
  const stockData = {
    labels: ['Antibiotique', 'Analgésique', 'Respiratoire', 'Antispasmodique', 'Cardiovasculaire', 'Hormonal'],
    datasets: [
      {
        data: [200, 350, 120, 180, 90, 110],
        backgroundColor: [
          '#8e44ad',
          '#9b59b6',
          '#af7ac5',
          '#bb8fce',
          '#d2b4de',
          '#e8daef',
        ],
        borderWidth: 1,
      },
    ],
  };

  const commandesData = {
    labels: ['Janvier', 'Février', 'Mars', 'Avril'],
    datasets: [
      {
        label: 'Commandes (DHS)',
        data: [12000, 9800, 14500, 15850],
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
  };

  // Calcul des statistiques
  const stats = {
    totalMedicaments: medicaments.length,
    totalStock: medicaments.reduce((sum, med) => sum + med.quantite, 0),
    totalCommandes: commandes.length,
    enAttenteCommandes: commandes.filter(cmd => cmd.statut === "En Attente").length,
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
                            <Pie data={stockData} options={{ plugins: { legend: { position: 'bottom' } } }} />
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
                                  <th>Catégorie</th>
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
                                    <td>{med.categorie}</td>
                                    <td>{med.quantite}</td>
                                    <td>{med.prix} DHS</td>
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
                              placeholder="Rechercher par pharmacie..." 
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
                              <option value="En Attente">En Attente</option>
                              <option value="En Cours De Livraison">En Cours De Livraison</option>
                              <option value="Livré">Livré</option>
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
                                  <th>Pharmacie</th>
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
                                    <td>{commande.pharmacie}</td>
                                    <td>{commande.date}</td>
                                    <td>
                                      <Badge bg={
                                        commande.statut === "En Attente" ? "warning" :
                                        commande.statut === "En Cours De Livraison" ? "info" : "success"
                                      }>
                                        {commande.statut}
                                      </Badge>
                                    </td>
                                    <td>{commande.montant} DHS</td>
                                    <td>
                                      <Button variant="outline-primary" size="sm" className="me-1" onClick={() => handleViewOrderDetails(commande)}>
                                        Détails
                                      </Button>
                                      {commande.statut === "En Attente" && (
                                        <Button 
                                          variant="outline-info" 
                                          size="sm"
                                          onClick={() => handleUpdateOrderStatus(commande.id, "En Cours De Livraison")}
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
                  <p><strong>Pharmacie:</strong> {selectedOrder.pharmacie}</p>
                  <p><strong>Date:</strong> {selectedOrder.date}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Statut:</strong> 
                    <Badge bg={
                      selectedOrder.statut === "En Attente" ? "warning" :
                      selectedOrder.statut === "En Cours De Livraison" ? "info" : "success"
                    } className="ms-2">
                      {selectedOrder.statut}
                    </Badge>
                  </p>
                  <p><strong>Montant Total:</strong> {selectedOrder.montant} DHS</p>
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
                  {selectedOrder.produits.map((produit, index) => (
                    <tr key={index}>
                      <td>{produit.nom}</td>
                      <td>{produit.quantite}</td>
                      <td>{produit.prix} DHS</td>
                      <td>{produit.quantite * produit.prix} DHS</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              
              {selectedOrder.statut === "En Attente" && (
                <div className="mt-4">
                  <h5>Mettre à jour le statut</h5>
                  <div className="d-flex gap-2">
                    <Button 
                      variant="info" 
                      onClick={() => {
                        handleUpdateOrderStatus(selectedOrder.id, "En Cours De Livraison");
                        setShowOrderDetails(false);
                      }}
                    >
                      Marquer comme En Cours De Livraison
                    </Button>
                    <Button 
                      variant="success" 
                      onClick={() => {
                        handleUpdateOrderStatus(selectedOrder.id, "Livré");
                        setShowOrderDetails(false);
                      }}
                    >
                      Marquer comme Livré
                    </Button>
                  </div>
                </div>
              )}
              
              {selectedOrder.statut === "En Cours De Livraison" && (
                <div className="mt-4">
                  <h5>Mettre à jour le statut</h5>
                  <Button 
                    variant="success" 
                    onClick={() => {
                      handleUpdateOrderStatus(selectedOrder.id, "Livré");
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