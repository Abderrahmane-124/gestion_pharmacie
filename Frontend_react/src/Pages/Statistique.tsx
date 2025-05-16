// Statistics.tsx - Composant de visualisation des statistiques des médicaments et fournisseurs
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Button, Card, Spinner, Nav, Tab, Container } from 'react-bootstrap';
import { BoxArrowLeft, BarChartLine, GraphUp, Tag, People } from 'react-bootstrap-icons';
import {
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import '../Styles/Statistics.css';

// Types
interface Medication {
  id: number;
  name: string;
  dosage: string;
  supplier: string;
  price: number;
  stock: number;
  category: string;
  expiration?: string;
}

interface SupplierStats {
  name: string;
  medicationCount: number;
  totalStock: number;
  averagePrice: number;
}

interface CategoryStats {
  name: string;
  medicationCount: number;
  totalStock: number;
  averagePrice: number;
}

interface StockDistribution {
  name: string;
  value: number;
}

interface HistoricalData {
  month: string;
  sales: number;
  purchases: number;
  revenue: number;
}

const Statistics = () => {
  const navigate = useNavigate();
  
  // États
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [supplierStats, setSupplierStats] = useState<SupplierStats[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [stockDistribution, setStockDistribution] = useState<StockDistribution[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [activeTab, setActiveTab] = useState<string>('overview');
  
  // Couleurs pour les graphiques
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#8DD1E1', '#82CA9D', '#A4DE6C'];

  // Charger les données (simulation d'un appel API)
  useEffect(() => {
    setLoading(true);
    
    setTimeout(() => {
      // Données simulées des médicaments (identiques à celles de MedicationsSuppliers.tsx)
      const medicationsData = [
        { id: 1, name: 'Aspirine', dosage: '500mg', supplier: 'Jake', price: 14.70, stock: 45, category: 'Analgésique', expiration: '2025-09-15' },
        { id: 2, name: 'Doliprane', dosage: '1000mg', supplier: 'Hind', price: 15.90, stock: 32, category: 'Analgésique', expiration: '2025-07-20' },
        { id: 3, name: 'Dafalgan', dosage: '500mg', supplier: 'Simon', price: 11.70, stock: 27, category: 'Analgésique', expiration: '2025-08-10' },
        { id: 4, name: 'Valium', dosage: '5mg', supplier: 'Anna', price: 16.70, stock: 18, category: 'Anxiolytique', expiration: '2025-06-05' },
        { id: 5, name: 'Amoxicilline', dosage: '250mg', supplier: 'Jake', price: 22.50, stock: 35, category: 'Antibiotique', expiration: '2025-10-22' },
        { id: 6, name: 'Imodium', dosage: '2mg', supplier: 'Simon', price: 13.40, stock: 40, category: 'Antidiarrhéique', expiration: '2025-11-18' },
        { id: 7, name: 'Xanax', dosage: '0.25mg', supplier: 'Anna', price: 25.80, stock: 15, category: 'Anxiolytique', expiration: '2025-12-30' },
        { id: 8, name: 'Augmentin', dosage: '1g', supplier: 'Hind', price: 28.90, stock: 22, category: 'Antibiotique', expiration: '2025-08-25' }
      ];
      
      setMedications(medicationsData);
      
      // Calculer les statistiques par fournisseur
      const supplierData = calculateSupplierStats(medicationsData);
      setSupplierStats(supplierData);
      
      // Calculer les statistiques par catégorie
      const categoryData = calculateCategoryStats(medicationsData);
      setCategoryStats(categoryData);
      
      // Calculer la distribution des stocks
      const stockData = calculateStockDistribution(medicationsData);
      setStockDistribution(stockData);
      
      // Générer des données historiques fictives
      const historicalSalesData = generateHistoricalData();
      setHistoricalData(historicalSalesData);
      
      setLoading(false);
    }, 800);
  }, []);

  // Calculer les statistiques par fournisseur
  const calculateSupplierStats = (meds: Medication[]): SupplierStats[] => {
    const supplierMap = new Map<string, { medicationCount: number; totalStock: number; totalPrice: number }>();
    
    meds.forEach(med => {
      if (!supplierMap.has(med.supplier)) {
        supplierMap.set(med.supplier, { medicationCount: 0, totalStock: 0, totalPrice: 0 });
      }
      
      const supplierData = supplierMap.get(med.supplier)!;
      supplierData.medicationCount += 1;
      supplierData.totalStock += med.stock;
      supplierData.totalPrice += med.price;
    });
    
    return Array.from(supplierMap.entries()).map(([name, data]) => ({
      name,
      medicationCount: data.medicationCount,
      totalStock: data.totalStock,
      averagePrice: data.totalPrice / data.medicationCount
    }));
  };

  // Calculer les statistiques par catégorie
  const calculateCategoryStats = (meds: Medication[]): CategoryStats[] => {
    const categoryMap = new Map<string, { medicationCount: number; totalStock: number; totalPrice: number }>();
    
    meds.forEach(med => {
      if (!categoryMap.has(med.category)) {
        categoryMap.set(med.category, { medicationCount: 0, totalStock: 0, totalPrice: 0 });
      }
      
      const categoryData = categoryMap.get(med.category)!;
      categoryData.medicationCount += 1;
      categoryData.totalStock += med.stock;
      categoryData.totalPrice += med.price;
    });
    
    return Array.from(categoryMap.entries()).map(([name, data]) => ({
      name,
      medicationCount: data.medicationCount,
      totalStock: data.totalStock,
      averagePrice: data.totalPrice / data.medicationCount
    }));
  };

  // Calculer la distribution des stocks
  const calculateStockDistribution = (meds: Medication[]): StockDistribution[] => {
    // Définir les tranches de stock
    const stockRanges = [
      { name: 'Critique (<20)', value: 0 },
      { name: 'Bas (20-30)', value: 0 },
      { name: 'Moyen (31-50)', value: 0 },
      { name: 'Élevé (>50)', value: 0 }
    ];
    
    meds.forEach(med => {
      if (med.stock < 20) {
        stockRanges[0].value += 1;
      } else if (med.stock <= 30) {
        stockRanges[1].value += 1;
      } else if (med.stock <= 50) {
        stockRanges[2].value += 1;
      } else {
        stockRanges[3].value += 1;
      }
    });
    
    return stockRanges;
  };

  // Générer des données historiques fictives
  const generateHistoricalData = (): HistoricalData[] => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const data = [];
    
    for (let i = 0; i < 12; i++) {
      const sales = Math.floor(Math.random() * 50) + 30;
      const purchases = Math.floor(Math.random() * 40) + 20;
      
      data.push({
        month: months[i],
        sales,
        purchases,
        revenue: sales * 25 - purchases * 15
      });
    }
    
    return data;
  };

  // Formater les prix en DHS
  const formatPrice = (price: number) => `${price.toFixed(2)} DHS`;

  // Calculer les statistiques globales
  const getTotalStats = () => {
    const totalMedications = medications.length;
    const totalStock = medications.reduce((sum, med) => sum + med.stock, 0);
    const totalValue = medications.reduce((sum, med) => sum + (med.price * med.stock), 0);
    const averagePrice = medications.reduce((sum, med) => sum + med.price, 0) / totalMedications;
    
    return { totalMedications, totalStock, totalValue, averagePrice };
  };

  // Navigation vers la page de détail du médicament
  const navigateToMedicationDetail = (medicationId: number) => {
    navigate(`/medicament/${medicationId}`);
  };

  return (
    <div className="statistics-container">
      <div className="statistics-content">
        <Container fluid className="px-0">
          {/* En-tête */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="statistics-heading">
              <BarChartLine className="me-2" size={24} /> 
              Tableau de Bord et Statistiques
            </h2>
            <Button 
              variant="outline-secondary" 
              onClick={() => navigate('/medicaments')}
            >
              <BoxArrowLeft className="me-2" /> Retour au catalogue
            </Button>
          </div>
          
          {/* Affichage du chargement */}
          {loading && (
            <div className="text-center py-5">
              <Spinner animation="border" variant="success" />
              <p className="mt-2">Chargement des statistiques...</p>
            </div>
          )}
          
          {!loading && (
            <>
              {/* Statistiques principales */}
              <Row className="mb-4 stat-overview fade-in">
                {(() => {
                  const { totalMedications, totalStock, totalValue, averagePrice } = getTotalStats();
                  
                  return (
                    <>
                      <Col md={3}>
                        <Card className="dashboard-card h-100">
                          <Card.Body className="text-center">
                            <h3 className="stat-number">{totalMedications}</h3>
                            <p className="stat-label">Médicaments</p>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={3}>
                        <Card className="dashboard-card h-100">
                          <Card.Body className="text-center">
                            <h3 className="stat-number">{totalStock}</h3>
                            <p className="stat-label">Unités en stock</p>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={3}>
                        <Card className="dashboard-card h-100">
                          <Card.Body className="text-center">
                            <h3 className="stat-number">{formatPrice(totalValue)}</h3>
                            <p className="stat-label">Valeur totale</p>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={3}>
                        <Card className="dashboard-card h-100">
                          <Card.Body className="text-center">
                            <h3 className="stat-number">{formatPrice(averagePrice)}</h3>
                            <p className="stat-label">Prix moyen</p>
                          </Card.Body>
                        </Card>
                      </Col>
                    </>
                  );
                })()}
              </Row>
              
              {/* Onglets de navigation */}
              <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'overview')}>
                <Card className="mb-4 fade-in">
                  <Card.Header>
                    <Nav variant="tabs">
                      <Nav.Item>
                        <Nav.Link eventKey="overview">
                          <GraphUp className="me-1" /> Vue d'ensemble
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link eventKey="suppliers">
                          <People className="me-1" /> Fournisseurs
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link eventKey="categories">
                          <Tag className="me-1" /> Catégories
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link eventKey="inventory">
                          <BarChart className="me-1" /> Inventaire
                        </Nav.Link>
                      </Nav.Item>
                    </Nav>
                  </Card.Header>
                  
                  <Card.Body>
                    <Tab.Content>
                      {/* Vue d'ensemble */}
                      <Tab.Pane eventKey="overview">
                        <Row>
                          <Col lg={6} className="mb-4">
                            <h4 className="chart-title">Ventes et achats mensuels</h4>
                            <div className="chart-container">
                              <ResponsiveContainer width="100%" height={350}>
                                <LineChart data={historicalData}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="month" />
                                  <YAxis />
                                  <Tooltip />
                                  <Legend />
                                  <Line 
                                    type="monotone" 
                                    dataKey="sales" 
                                    name="Ventes" 
                                    stroke="#8884d8" 
                                    activeDot={{ r: 8 }} 
                                  />
                                  <Line 
                                    type="monotone" 
                                    dataKey="purchases" 
                                    name="Achats" 
                                    stroke="#82ca9d" 
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </Col>
                          
                          <Col lg={6} className="mb-4">
                            <h4 className="chart-title">Revenus mensuels</h4>
                            <div className="chart-container">
                              <ResponsiveContainer width="100%" height={350}>
                                <AreaChart data={historicalData}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="month" />
                                  <YAxis />
                                  <Tooltip />
                                  <Area 
                                    type="monotone" 
                                    dataKey="revenue" 
                                    name="Revenu" 
                                    fill="#8884d8" 
                                    stroke="#8884d8" 
                                  />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          </Col>
                        </Row>
                        
                        <Row>
                          <Col lg={6} className="mb-4">
                            <h4 className="chart-title">Répartition des stocks par fournisseur</h4>
                            <div className="chart-container">
                              <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={supplierStats}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="name" />
                                  <YAxis />
                                  <Tooltip />
                                  <Legend />
                                  <Bar 
                                    dataKey="totalStock" 
                                    name="Stock total" 
                                    fill="#00C49F" 
                                  />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </Col>
                          
                          <Col lg={6} className="mb-4">
                            <h4 className="chart-title">Distribution des niveaux de stock</h4>
                            <div className="chart-container">
                              <ResponsiveContainer width="100%" height={350}>
                                <RechartsPieChart>
                                  <Pie
                                    data={stockDistribution}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={true}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    nameKey="name"
                                    label={({ name, percent }) => 
                                      `${name}: ${(percent * 100).toFixed(0)}%`
                                    }
                                  >
                                    {stockDistribution.map((entry, index) => (
                                      <Cell 
                                        key={`cell-${index}`} 
                                        fill={COLORS[index % COLORS.length]} 
                                      />
                                    ))}
                                  </Pie>
                                  <Tooltip />
                                </RechartsPieChart>
                              </ResponsiveContainer>
                            </div>
                          </Col>
                        </Row>
                      </Tab.Pane>
                      
                      {/* Statistiques par fournisseur */}
                      <Tab.Pane eventKey="suppliers">
                        <Row>
                          <Col lg={6} className="mb-4">
                            <h4 className="chart-title">Nombre de médicaments par fournisseur</h4>
                            <div className="chart-container">
                              <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={supplierStats}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="name" />
                                  <YAxis />
                                  <Tooltip />
                                  <Legend />
                                  <Bar 
                                    dataKey="medicationCount" 
                                    name="Nombre de médicaments" 
                                    fill="#0088FE" 
                                  />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </Col>
                          
                          <Col lg={6} className="mb-4">
                            <h4 className="chart-title">Prix moyen par fournisseur</h4>
                            <div className="chart-container">
                              <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={supplierStats}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="name" />
                                  <YAxis />
                                  <Tooltip formatter={(value) => [`${typeof value === 'number' ? value.toFixed(2) : value} DHS`, 'Prix moyen']} />
                                  <Legend />
                                  <Bar 
                                    dataKey="averagePrice" 
                                    name="Prix moyen" 
                                    fill="#FF8042" 
                                  />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </Col>
                        </Row>
                        
                        <Row>
                          <Col>
                            <h4 className="chart-title">Tableau détaillé des fournisseurs</h4>
                            <div className="table-responsive">
                              <table className="table table-striped">
                                <thead>
                                  <tr>
                                    <th>Fournisseur</th>
                                    <th>Nombre de médicaments</th>
                                    <th>Stock total</th>
                                    <th>Prix moyen</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {supplierStats.map((supplier, index) => (
                                    <tr key={index}>
                                      <td>{supplier.name}</td>
                                      <td>{supplier.medicationCount}</td>
                                      <td>{supplier.totalStock}</td>
                                      <td>{formatPrice(supplier.averagePrice)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </Col>
                        </Row>
                      </Tab.Pane>
                      
                      {/* Statistiques par catégorie */}
                      <Tab.Pane eventKey="categories">
                        <Row>
                          <Col lg={6} className="mb-4">
                            <h4 className="chart-title">Répartition des médicaments par catégorie</h4>
                            <div className="chart-container">
                              <ResponsiveContainer width="100%" height={350}>
                                <RechartsPieChart>
                                  <Pie
                                    data={categoryStats}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={true}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="medicationCount"
                                    nameKey="name"
                                    label={({ name, percent }) => 
                                      `${name}: ${(percent * 100).toFixed(0)}%`
                                    }
                                  >
                                    {categoryStats.map((_entry, index) => (
                                      <Cell 
                                        key={`cell-${index}`} 
                                        fill={COLORS[index % COLORS.length]} 
                                      />
                                    ))}
                                  </Pie>
                                  <Tooltip />
                                </RechartsPieChart>
                              </ResponsiveContainer>
                            </div>
                          </Col>
                          
                          <Col lg={6} className="mb-4">
                            <h4 className="chart-title">Stock total par catégorie</h4>
                            <div className="chart-container">
                              <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={categoryStats}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="name" />
                                  <YAxis />
                                  <Tooltip />
                                  <Legend />
                                  <Bar 
                                    dataKey="totalStock" 
                                    name="Stock total" 
                                    fill="#FFBB28" 
                                  />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </Col>
                        </Row>
                        
                        <Row>
                          <Col>
                            <h4 className="chart-title">Tableau détaillé des catégories</h4>
                            <div className="table-responsive">
                              <table className="table table-striped">
                                <thead>
                                  <tr>
                                    <th>Catégorie</th>
                                    <th>Nombre de médicaments</th>
                                    <th>Stock total</th>
                                    <th>Prix moyen</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {categoryStats.map((category, index) => (
                                    <tr key={index}>
                                      <td>{category.name}</td>
                                      <td>{category.medicationCount}</td>
                                      <td>{category.totalStock}</td>
                                      <td>{formatPrice(category.averagePrice)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </Col>
                        </Row>
                      </Tab.Pane>
                      
                      {/* Statistiques d'inventaire */}
                      <Tab.Pane eventKey="inventory">
                        <Row>
                          <Col lg={6} className="mb-4">
                            <h4 className="chart-title">Niveaux de stock par médicament</h4>
                            <div className="chart-container">
                              <ResponsiveContainer width="100%" height={450}>
                                <BarChart 
                                  data={medications}
                                  margin={{ top: 5, right: 30, left: 20, bottom: 80 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis 
                                    dataKey="name" 
                                    angle={-45} 
                                    textAnchor="end" 
                                    height={80}
                                  />
                                  <YAxis />
                                  <Tooltip />
                                  <Legend />
                                  <Bar 
                                    dataKey="stock" 
                                    name="Niveau de stock" 
                                    fill="#00C49F"
                                    maxBarSize={60}
                                  >
                                    {medications.map((entry, index) => (
                                      <Cell 
                                        key={`cell-${index}`}
                                        fill={entry.stock < 20 ? '#FF8042' : entry.stock < 40 ? '#FFBB28' : '#00C49F'}
                                      />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </Col>
                          
                          <Col lg={6} className="mb-4">
                            <h4 className="chart-title">Prix par médicament</h4>
                            <div className="chart-container">
                              <ResponsiveContainer width="100%" height={450}>
                                <BarChart 
                                  data={medications}
                                  margin={{ top: 5, right: 30, left: 20, bottom: 80 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis 
                                    dataKey="name" 
                                    angle={-45} 
                                    textAnchor="end" 
                                    height={80}
                                  />
                                  <YAxis />
                                  <Tooltip formatter={(value) => [`${typeof value === 'number' ? value.toFixed(2) : value} DHS`, 'Prix']} />
                                  <Legend />
                                  <Bar 
                                    dataKey="price" 
                                    name="Prix" 
                                    fill="#8884D8"
                                    maxBarSize={60}
                                  />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </Col>
                        </Row>
                        
                        <hr className="mt-5 mb-4" style={{ borderColor: 'rgba(255,255,255,0.2)' }} />
                        
                        <Row>
                          <Col>
                            <h4 className="chart-title inventory-title">Inventaire détaillé</h4>
                            <div className="table-responsive inventory-section">
                              <table className="table table-striped">
                                <thead>
                                  <tr>
                                    <th>Nom</th>
                                    <th>Fournisseur</th>
                                    <th>Catégorie</th>
                                    <th>Stock</th>
                                    <th>Prix</th>
                                    <th>Valeur totale</th>
                                    <th>Date d'expiration</th>
                                    <th>Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {medications.map((med) => (
                                    <tr key={med.id} 
                                        className="medication-row">
                                      <td>{med.name} ({med.dosage})</td>
                                      <td>{med.supplier}</td>
                                      <td>{med.category}</td>
                                      <td>
                                        <span className={`badge ${
                                          med.stock < 20 
                                            ? 'bg-danger' 
                                            : med.stock < 40 
                                              ? 'bg-warning' 
                                              : 'bg-success'
                                        }`}>
                                          {med.stock}
                                        </span>
                                      </td>
                                      <td>{formatPrice(med.price)}</td>
                                      <td>{formatPrice(med.price * med.stock)}</td>
                                      <td>{med.expiration}</td>
                                      <td>
                                        <Button 
                                          size="sm" 
                                          variant="outline-success"
                                          onClick={() => navigateToMedicationDetail(med.id)}
                                        >
                                          Détail
                                        </Button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </Col>
                        </Row>
                      </Tab.Pane>
                    </Tab.Content>
                  </Card.Body>
                </Card>
              </Tab.Container>
            </>
          )}
        </Container>
      </div>
    </div>
  );
};

export default Statistics;