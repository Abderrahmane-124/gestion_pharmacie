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
      <Button 
        variant="outline-secondary" 
        className="mb-4"
        onClick={() => navigate("/")}
      >
        &larr; Retour à la liste
      </Button>
      
      <Row>
        <Col md={8}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-primary text-white">
              <h3>{medicament.nom}</h3>
            </Card.Header>
            <Card.Body className="text-start">
              <Row>
                <Col md={6}>
                  <h5>Informations générales</h5>
                  <ListGroup variant="flush" className="mb-4 text-start">
                    <ListGroup.Item>
                      <strong>Code ATC:</strong> {medicament.code_ATC || "Non spécifié"}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <strong>Dosage:</strong> {medicament.dosage || "Non spécifié"}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <strong>Présentation:</strong> {medicament.presentation || "Non spécifiée"}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <strong>Prix public:</strong> {medicament.prix_public ? medicament.prix_public.toFixed(2) : "0.00"} DHS
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <strong>Prix hospitalier:</strong> {medicament.prix_hospitalier ? medicament.prix_hospitalier.toFixed(2) : "0.00"} DHS
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <strong>Prix conseillé:</strong> {medicament.prix_conseille ? medicament.prix_conseille.toFixed(2) : "0.00"} DHS
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <strong>Composition:</strong> {medicament.composition || "Non spécifiée"}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <strong>Classe thérapeutique:</strong> {medicament.classe_therapeutique || "Non spécifiée"}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <strong>Quantité en stock:</strong> {medicament.quantite || 0}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <strong>Date d'expiration:</strong> {medicament.date_expiration 
                        ? new Date(medicament.date_expiration).toLocaleDateString('fr-FR') 
                        : "Non spécifiée"}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <strong>Indications:</strong> {medicament.indications || "Non spécifiées"}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <strong>Nature du produit:</strong> {medicament.natureDuProduit || "Non spécifiée"}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <strong>Tableau:</strong> {medicament.tableau || "Non spécifié"}
                    </ListGroup.Item>
                  </ListGroup>
                </Col>
                <Col md={6}>
                  <h5>Informations du fournisseur</h5>
                  <ListGroup variant="flush" className="text-start">
                    <ListGroup.Item>
                      <strong>Nom:</strong> {medicament.utilisateur?.nom || "Non spécifié"}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <strong>Prénom:</strong> {medicament.utilisateur?.prenom || "Non spécifié"}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <strong>Téléphone:</strong> {medicament.utilisateur?.telephone || "Non spécifié"}
                    </ListGroup.Item>
                  </ListGroup>
                </Col>
              </Row>
            </Card.Body>
            <Card.Footer>
              <Row>
                <Col>
                  <Button 
                    variant="warning" 
                    className="w-100"
                    onClick={() => navigate(`/ModifierMedicament/${medicament.id}`)}
                  >
                    Modifier le médicament
                  </Button>
                </Col>
                <Col>
                  <Button 
                    variant="info" 
                    className="w-100"
                    onClick={() => navigate(`/VisualiserVente/${medicament.id}`)}
                  >
                    Visualiser ventes
                  </Button>
                </Col>
              </Row>
            </Card.Footer>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-info text-white">
              <h5>Statistiques</h5>
            </Card.Header>
            <Card.Body className="text-start">
              <p className="text-start"><strong>Valeur totale en stock:</strong> {(medicament.prix_public ? medicament.prix_public * medicament.quantite : medicament.prix_conseille ? medicament.prix_conseille * medicament.quantite : 0).toFixed(2)} DHS</p>
              <p className="text-start"><strong>Jours avant expiration:</strong> {daysUntilExpiration} jours</p>
              
              <div className={`${expirationAlertClass} text-start`}>
                {expirationMessage}
              </div>
              
              <div className={`${medicament.quantite < 10 ? "alert alert-danger" : 
                            medicament.quantite < 20 ? "alert alert-warning" : 
                            "alert alert-success"} text-start`}>
                {medicament.quantite < 10 ? 
                  "Stock critique! Commandez rapidement." : 
                  medicament.quantite < 20 ?
                  "Stock faible. Pensez à commander." : 
                  "Stock suffisant."
                }
              </div>
            </Card.Body>
          </Card>
          
          <Card className="shadow-sm">
            <Card.Header className="bg-success text-white">
              <h5>Actions rapides</h5>
            </Card.Header>
            <Card.Body>
              <Button 
                variant="outline-success" 
                className="w-100 mb-2"
                onClick={() => navigate(`/AjouterStock/${medicament.id}`)}
              >
                Ajouter au stock
              </Button>
              <Button 
                variant="outline-primary" 
                className="w-100 mb-2"
                onClick={() => navigate(`/EnregistrerVente/${medicament.id}`)}
              >
                Enregistrer une vente
              </Button>
              <Button 
                variant="primary" 
                className="w-100 mb-2"
                onClick={() => {
                  // Ici, vous pourriez ajouter la logique pour mettre le médicament dans le panier
                  // Par exemple, en utilisant localStorage ou un état global comme Redux
                  alert(`${medicament.nom} a été ajouté au panier`);
                  navigate('/panier');
                }}
              >
                Ajouter au panier
              </Button>
              <Button 
                variant="outline-danger" 
                className="w-100"
                onClick={() => {
                  if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${medicament.nom}?`)) {
                    alert("Fonctionnalité de suppression à implémenter");
                    navigate("/");
                  }
                }}
              >
                Supprimer le médicament
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}