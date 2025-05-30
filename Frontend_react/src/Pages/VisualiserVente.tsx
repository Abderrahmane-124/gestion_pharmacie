// MedicationsSuppliers.tsx - Composant organisé de visualisation des médicaments et fournisseurs (sans photos)
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Button, Form, InputGroup, Pagination, Container, Card, Badge } from 'react-bootstrap';
import { Search, PlusCircleFill, Archive, BoxArrowLeft, BarChart, SortDown, SortUp, Capsule, Droplet, Prescription2 } from 'react-bootstrap-icons';
import '../Styles/VisualiserVente.css';

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

interface FilterOptions {
  searchTerm: string;
  supplier: string;
  category: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const MedicationsSuppliers = () => {
  const navigate = useNavigate();
  
  // États
  const [medications, setMedications] = useState<Medication[]>([]);
  const [filteredMedications, setFilteredMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    supplier: 'Tous les fournisseurs',
    category: 'Toutes les catégories',
    sortBy: 'name',
    sortOrder: 'asc'
  });

  // Charger les données (simulation d'un appel API)
  useEffect(() => {
    // Simuler le chargement des données
    setLoading(true);
    
    setTimeout(() => {
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
      
      // Extraire les fournisseurs uniques
      const uniqueSuppliers = [...new Set(medicationsData.map(med => med.supplier))];
      
      // Extraire les catégories uniques
      const uniqueCategories = [...new Set(medicationsData.map(med => med.category))];
      
      setMedications(medicationsData);
      setSuppliers(uniqueSuppliers);
      setCategories(uniqueCategories);
      setLoading(false);
    }, 800);
  }, []);

  // Filtrer et trier les médicaments lorsque les filtres ou les données changent
  useEffect(() => {
    if (medications.length > 0) {
      let filtered = [...medications];
      
      // Appliquer la recherche par nom
      if (filters.searchTerm) {
        filtered = filtered.filter(med => 
          med.name.toLowerCase().includes(filters.searchTerm.toLowerCase())
        );
      }
      
      // Appliquer le filtre par fournisseur
      if (filters.supplier !== 'Tous les fournisseurs') {
        filtered = filtered.filter(med => med.supplier === filters.supplier);
      }
      
      // Appliquer le filtre par catégorie
      if (filters.category !== 'Toutes les catégories') {
        filtered = filtered.filter(med => med.category === filters.category);
      }
      
      // Appliquer le tri
      filtered.sort((a, b) => {
        let comparison = 0;
        
        switch (filters.sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'price':
            comparison = a.price - b.price;
            break;
          case 'stock':
            comparison = a.stock - b.stock;
            break;
          case 'supplier':
            comparison = a.supplier.localeCompare(b.supplier);
            break;
          default:
            comparison = 0;
        }
        
        // Inverser le tri si l'ordre est descendant
        return filters.sortOrder === 'desc' ? -comparison : comparison;
      });
      
      setFilteredMedications(filtered);
      // Réinitialiser la pagination à la première page quand les filtres changent
      setCurrentPage(1);
    }
  }, [medications, filters]);

  // Gérer le changement de filtre
  const handleFilterChange = (name: keyof FilterOptions, value: string) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Gérer le changement d'ordre de tri
  const toggleSortOrder = () => {
    setFilters(prev => ({
      ...prev,
      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Ajouter au panier avec animation
  const addToCart = (medId: number) => {
    const button = document.getElementById(`add-to-cart-${medId}`);
    
    // Trouver le médicament par son ID
    const medicamentToAdd = medications.find(med => med.id === medId);
    
    if (medicamentToAdd && button) {
      // Animation du bouton
      button.classList.add('btn-animation');
      
      // Récupérer le panier existant ou créer un nouveau
      let currentCart = [];
      const savedCart = localStorage.getItem('pharmacieCart');
      
      if (savedCart) {
        currentCart = JSON.parse(savedCart);
      }
      
      // Vérifier si le médicament existe déjà dans le panier
      const existingItemIndex = currentCart.findIndex((item: any) => item.id === medId);
      
      if (existingItemIndex >= 0) {
        // Si le médicament existe déjà, augmenter la quantité
        currentCart[existingItemIndex].quantity += 1;
      } else {
        // Sinon, ajouter le médicament au panier avec quantité 1
        currentCart.push({
          id: medicamentToAdd.id,
          name: medicamentToAdd.name,
          dosage: medicamentToAdd.dosage,
          price: medicamentToAdd.price,
          quantity: 1,
          packaging: `Boîte de médicament`,
          supplier: medicamentToAdd.supplier
        });
      }
      
      // Sauvegarder le panier mis à jour
      localStorage.setItem('pharmacieCart', JSON.stringify(currentCart));
      
      setTimeout(() => {
        button.classList.remove('btn-animation');
        // Rediriger vers la page panier
        navigate('/panier');
      }, 500);
    }
  };

  // Rediriger vers la page détail du médicament
  const goToMedicationDetail = (medId: number) => {
    navigate(`/medicament/${medId}`);
  };

  // Obtenir l'icône selon la catégorie
  const getCategoryIcon = (category: string) => {
    switch(category.toLowerCase()) {
      case 'analgésique':
        return <Capsule className="category-icon" />;
      case 'antibiotique':
        return <Prescription2 className="category-icon" />;
      case 'anxiolytique':
        return <Droplet className="category-icon" />;
      default:
        return <Capsule className="category-icon" />;
    }
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMedications.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMedications.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Générer les éléments de pagination
  const renderPaginationItems = () => {
    const items = [];
    
    for (let i = 1; i <= totalPages; i++) {
      items.push(
        <Pagination.Item 
          key={i} 
          active={i === currentPage}
          onClick={() => paginate(i)}
        >
          {i}
        </Pagination.Item>
      );
    }
    
    return items;
  };

  return (
    <div className="medication-container">
      <Container>
        {/* En-tête */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="pharmacy-heading">
            <Archive className="me-2" size={24} /> 
            Catalogue des Médicaments et Fournisseurs
          </h2>
          <Button 
            variant="outline-secondary" 
            onClick={() => navigate('/')}
          >
            <BoxArrowLeft className="me-2" /> Retour
          </Button>
        </div>
        
        {/* Section de recherche et filtres */}
        <Card className="search-section mb-4 fade-in">
          <Card.Body>
            <Row className="g-3 align-items-center">
              <Col lg={4}>
                <InputGroup>
                  <InputGroup.Text className="search-icon">
                    <Search />
                  </InputGroup.Text>
                  <Form.Control
                    className="search-input"
                    placeholder="Rechercher par nom..."
                    value={filters.searchTerm}
                    onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  />
                </InputGroup>
              </Col>
              
              <Col lg={3}>
                <Form.Select 
                  className="supplier-select"
                  value={filters.supplier}
                  onChange={(e) => handleFilterChange('supplier', e.target.value)}
                >
                  <option>Tous les fournisseurs</option>
                  {suppliers.map(supplier => (
                    <option key={supplier}>{supplier}</option>
                  ))}
                </Form.Select>
              </Col>
              
              <Col lg={3}>
                <Form.Select 
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <option>Toutes les catégories</option>
                  {categories.map(category => (
                    <option key={category}>{category}</option>
                  ))}
                </Form.Select>
              </Col>
              
              <Col lg={2}>
                <div className="d-flex align-items-center">
                  <Form.Select 
                    className="me-2"
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  >
                    <option value="name">Nom</option>
                    <option value="price">Prix</option>
                    <option value="stock">Stock</option>
                    <option value="supplier">Fournisseur</option>
                  </Form.Select>
                  <Button 
                    variant="outline-primary" 
                    onClick={toggleSortOrder}
                    className="sort-btn"
                  >
                    {filters.sortOrder === 'asc' ? <SortUp /> : <SortDown />}
                  </Button>
                </div>
              </Col>
            </Row>
            
            <Row className="mt-3">
              <Col>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="text-muted">
                    {filteredMedications.length} résultats trouvés
                  </div>
                  <div>
                    <Button 
                      variant="outline-success" 
                      size="sm"
                      onClick={() => navigate('/statistiques')}
                    >
                      <BarChart className="me-1" /> Statistiques
                    </Button>
                  </div>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
        
        {/* Affichage du chargement */}
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
            <p className="mt-2">Chargement des médicaments...</p>
          </div>
        )}
        
        {/* Affichage des médicaments */}
        {!loading && (
          <Row className="g-4 mb-4">
            {currentItems.map(med => (
              <Col lg={4} md={6} key={med.id}>
                <Card className="medication-card h-100">
                  <Card.Header className="category-header">
                    <div className="category-tag">
                      {getCategoryIcon(med.category)}
                      <span className="ms-2">{med.category}</span>
                    </div>
                    <Badge 
                      bg={med.stock < 20 ? "danger" : med.stock < 40 ? "warning" : "success"}
                      className="rounded-pill stock-badge"
                    >
                      {med.stock} en stock
                    </Badge>
                  </Card.Header>
                  
                  <Card.Body>
                    <div className="med-info">
                      <h4 className="medication-title">{med.name}</h4>
                      <p className="medication-dosage">{med.dosage}</p>
                    </div>
                    
                    <div className="supplier-row">
                      <span className="medication-supplier">
                        <strong>Fournisseur:</strong> {med.supplier}
                      </span>
                      <span className="expiration-date">
                        <strong>Exp:</strong> {new Date(med.expiration || '').toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    
                    <div className="price-container">
                      <span className="medication-price">
                        {med.price.toFixed(2)} <small>DHS</small>
                      </span>
                      <Badge 
                        bg={med.price > 20 ? "secondary" : "info"} 
                        className="price-tag"
                      >
                        {med.price > 20 ? "Premium" : "Standard"}
                      </Badge>
                    </div>
                  </Card.Body>
                  
                  <Card.Footer className="d-flex justify-content-between">
                    <Button 
                      variant="outline-primary"
                      onClick={() => goToMedicationDetail(med.id)}
                    >
                      Détails
                    </Button>
                    <Button 
                      id={`add-to-cart-${med.id}`}
                      variant="success" 
                      className="add-to-cart-btn"
                      onClick={() => addToCart(med.id)}
                    >
                      <PlusCircleFill className="me-1" /> Ajouter
                    </Button>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        )}
        
        {/* Message si aucun résultat */}
        {!loading && filteredMedications.length === 0 && (
          <div className="text-center py-5">
            <div className="mb-3">🔍</div>
            <h4>Aucun médicament trouvé</h4>
            <p className="text-muted">Essayez de modifier vos critères de recherche</p>
          </div>
        )}
        
        {/* Pagination */}
        {!loading && filteredMedications.length > 0 && (
          <div className="d-flex justify-content-center mt-4">
            <Pagination>
              <Pagination.Prev 
                onClick={() => paginate(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              />
              
              {renderPaginationItems()}
              
              <Pagination.Next 
                onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              />
            </Pagination>
          </div>
        )}
      </Container>
    </div>
  );
};

export default MedicationsSuppliers;