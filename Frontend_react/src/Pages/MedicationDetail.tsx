import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Button, ListGroup } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

interface MedicamentType {
  id: number;
  nom: string;
  code_ATC?: string;
  dosage?: string;
  presentation?: string;
  prix_hospitalier?: number;
  prix_public?: number;
  prix_conseille?: number;
  composition?: string;
  classe_therapeutique?: string;
  quantite: number;
  date_expiration?: string | null;
  indications?: string;
  natureDuProduit?: string;
  tableau?: string;
  utilisateur?: {
    id: number;
    nom: string;
    prenom: string;
    email?: string;
    telephone?: string | null;
  };
}

export default function MedicamentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [medicament, setMedicament] = useState<MedicamentType | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Get user role from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role || null);
  }, []);

  const handleReturn = () => {
    if (userRole === "FOURNISSEUR") {
      navigate("/dashboard-Fornisseur");
    } else if (userRole === "PHARMACIEN") {
      navigate("/dashboard-pharmacien");
    } else {
      // Fallback to home if role is not recognized
      navigate("/");
    }
  };

  useEffect(() => {
    const fetchMedicamentDetails = async () => {
      setLoading(true);
      
      try {
        // Get token from localStorage
        const token = localStorage.getItem('token');
        
        // Fetch data from your API using the ID from the URL
        const response = await fetch(`http://localhost:8080/medicaments/${id}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Medication details:", data);
        
        setMedicament(data);
      } catch (error) {
        console.error("Error fetching medication details:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMedicamentDetails();
  }, [id]);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
        <div className="mt-2">Chargement des informations du médicament...</div>
      </Container>
    );
  }

  if (!medicament) {
    return (
      <Container className="py-5 text-center">
        <div className="alert alert-danger">
          Médicament non trouvé. L'ID {id} n'existe pas.
        </div>
        <Button variant="primary" onClick={() => navigate("/")}>
          Retourner à la liste
        </Button>
      </Container>
    );
  }

  // Calcul du nombre de jours avant expiration (handle null date_expiration)
  const today = new Date();
  const expirationDate = medicament.date_expiration 
    ? new Date(medicament.date_expiration) 
    : new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000); // Default to 1 year if not set

  const daysUntilExpiration = Math.floor((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // Définir une classe CSS pour l'alerte d'expiration
  let expirationAlertClass = "alert alert-success";
  let expirationMessage = "Expiration lointaine";
  
  if (daysUntilExpiration < 30) {
    expirationAlertClass = "alert alert-danger";
    expirationMessage = "Expiration proche!";
  } else if (daysUntilExpiration < 90) {
    expirationAlertClass = "alert alert-warning";
    expirationMessage = "Expiration dans moins de 3 mois";
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-center">
        <Button 
          variant="success" 
          className="mb-4 px-4 py-2 d-inline-flex align-items-center gap-2"
          onClick={handleReturn}
        >
          <i className="bi bi-arrow-left"></i>
          Retour au tableau de bord
        </Button>
      </div>
      
      <Row>
        <Col md={8}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-white border-bottom">
              <h1 className="mb-0 fw-bold">{medicament.nom}</h1>
            </Card.Header>
            <Card.Body className="text-start">
              <div className="mb-4">
                <h2 className="border-bottom pb-2 mb-3 fw-bold">Informations générales</h2>
                <ListGroup variant="flush" className="mb-4">
                  <ListGroup.Item className="d-flex justify-content-between align-items-center px-0">
                    <span className="text-muted pe-5">Quantité en stock</span>
                    <span>{medicament.quantite || 0}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center px-0">
                    <span className="text-muted pe-5">Code ATC</span>
                    <span>{medicament.code_ATC || "Non spécifié"}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center px-0">
                    <span className="text-muted pe-5">Dosage</span>
                    <span>{medicament.dosage || "Non spécifié"}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center px-0">
                    <span className="text-muted pe-5">Présentation</span>
                    <span>{medicament.presentation || "Non spécifiée"}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center px-0">
                    <span className="text-muted pe-5">Prix public</span>
                    <span>{medicament.prix_public ? medicament.prix_public.toFixed(2) : "0.00"} DHS</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center px-0">
                    <span className="text-muted pe-5">Prix hospitalier</span>
                    <span>{medicament.prix_hospitalier ? medicament.prix_hospitalier.toFixed(2) : "0.00"} DHS</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center px-0">
                    <span className="text-muted pe-5">Prix conseillé</span>
                    <span>{medicament.prix_conseille ? medicament.prix_conseille.toFixed(2) : "0.00"} DHS</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center px-0">
                    <span className="text-muted pe-5">Composition</span>
                    <span>{medicament.composition || "Non spécifiée"}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center px-0">
                    <span className="text-muted pe-5">Classe thérapeutique</span>
                    <span>{medicament.classe_therapeutique || "Non spécifiée"}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center px-0">
                    <span className="text-muted pe-5">Date d'expiration</span>
                    <span>{medicament.date_expiration 
                      ? new Date(medicament.date_expiration).toLocaleDateString('fr-FR') 
                      : "Non spécifiée"}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center px-0">
                    <span className="text-muted pe-5">Indications</span>
                    <span>{medicament.indications || "Non spécifiées"}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center px-0">
                    <span className="text-muted pe-5">Nature du produit</span>
                    <span>{medicament.natureDuProduit || "Non spécifiée"}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center px-0">
                    <span className="text-muted pe-5">Tableau</span>
                    <span>{medicament.tableau || "Non spécifié"}</span>
                  </ListGroup.Item>
                </ListGroup>
              </div>

              <div className="mt-4">
                <h2 className="border-bottom pb-2 mb-3 fw-bold">Informations du fournisseur</h2>
                <ListGroup variant="flush">
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <span className="text-muted">Nom</span>
                    <span>{medicament.utilisateur?.nom || "Non spécifié"}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <span className="text-muted">Prénom</span>
                    <span>{medicament.utilisateur?.prenom || "Non spécifié"}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between align-items-center">
                    <span className="text-muted">Téléphone</span>
                    <span>{medicament.utilisateur?.telephone || "Non spécifié"}</span>
                  </ListGroup.Item>
                </ListGroup>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white border-bottom">
              <h1 className="mb-0 fw-bold">Statistiques</h1>
            </Card.Header>
            <Card.Body className="text-start">
              <div className="mb-4">
                <h6 className="text-muted mb-2">Valeur du stock</h6>
                <p className="h4 mb-0">{(medicament.prix_public ? medicament.prix_public * medicament.quantite : medicament.prix_conseille ? medicament.prix_conseille * medicament.quantite : 0).toFixed(2)} DHS</p>
              </div>
              
              <div className="mb-4">
                <h6 className="text-muted mb-2">État du stock</h6>
                <div className={`${medicament.quantite < 10 ? "alert alert-danger" : 
                            medicament.quantite < 20 ? "alert alert-warning" : 
                            "alert alert-success"} text-start mb-0`}>
                  {medicament.quantite < 10 ? 
                    "Stock critique! Commandez rapidement." : 
                    medicament.quantite < 20 ?
                    "Stock faible. Pensez à commander." : 
                    "Stock suffisant."
                  }
                </div>
              </div>

              <div className="mb-4">
                <h6 className="text-muted mb-2">Expiration</h6>
                <p className="h4 mb-2">{daysUntilExpiration} jours</p>
                <div className={`${expirationAlertClass} text-start mb-0`}>
                  {expirationMessage}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}