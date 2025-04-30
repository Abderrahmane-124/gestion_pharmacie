import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Button, ListGroup } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

interface MedicamentType {
  id: number;
  nom: string;
  description: string;
  prix: number;
  quantite: number;
  expiration: string;
  fournisseur: {
    nom: string;
    prenom: string;
    telephone: string;
  };
}

export default function MedicamentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [medicament, setMedicament] = useState<MedicamentType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulation d'un chargement de données
    // Dans un cas réel, vous feriez un appel API ici
    setLoading(true);
    
    setTimeout(() => {
      // Données exemple - à remplacer par vos données réelles
      const medicamentsData = [
        {
          id: 1,
          nom: "Doliprane",
          description: "Antidouleur et antipyrétique",
          prix: 20.5,
          quantite: 50,
          expiration: "2025-09-01",
          fournisseur: { nom: "Ahmed", prenom: "Ben Ali", telephone: "0611223344" },
        },
        {
          id: 2,
          nom: "Amoxicilline",
          description: "Antibiotique",
          prix: 35,
          quantite: 30,
          expiration: "2025-07-15",
          fournisseur: { nom: "Sophie", prenom: "Durand", telephone: "0622334455" },
        },
        {
          id: 3,
          nom: "Ibuprofène",
          description: "Anti-inflammatoire non stéroïdien",
          prix: 15.75,
          quantite: 40,
          expiration: "2025-06-30",
          fournisseur: { nom: "Martin", prenom: "Dubois", telephone: "0633445566" },
        },
        {
          id: 4,
          nom: "Aspirine",
          description: "Antidouleur et anti-inflammatoire",
          prix: 12.99,
          quantite: 60,
          expiration: "2025-08-20",
          fournisseur: { nom: "Durand", prenom: "Marie", telephone: "0644556677" },
        },
        {
          id: 5,
          nom: "Paracétamol",
          description: "Analgésique et antipyrétique",
          prix: 8.5,
          quantite: 75,
          expiration: "2025-10-15",
          fournisseur: { nom: "Petit", prenom: "Jean", telephone: "0655667788" },
        }
      ];
      
      // Conversion de l'id depuis l'URL (string) vers un nombre
      const medicamentId = parseInt(id || "0", 10);
      
      // Recherche du médicament correspondant à l'id
      const foundMedicament = medicamentsData.find(m => m.id === medicamentId);
      
      setMedicament(foundMedicament || null);
      setLoading(false);
    }, 500);
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

  // Calcul du nombre de jours avant expiration
  const today = new Date();
  const expirationDate = new Date(medicament.expiration);
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
            <Card.Body>
              <Row>
                <Col md={6}>
                  <h5>Informations générales</h5>
                  <ListGroup variant="flush" className="mb-4">
                    <ListGroup.Item>
                      <strong>Description:</strong> {medicament.description}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <strong>Prix:</strong> {medicament.prix.toFixed(2)} DHS
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <strong>Quantité en stock:</strong> {medicament.quantite}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <strong>Date d'expiration:</strong> {new Date(medicament.expiration).toLocaleDateString('fr-FR')}
                    </ListGroup.Item>
                  </ListGroup>
                </Col>
                <Col md={6}>
                  <h5>Informations du fournisseur</h5>
                  <ListGroup variant="flush">
                    <ListGroup.Item>
                      <strong>Nom:</strong> {medicament.fournisseur.nom}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <strong>Prénom:</strong> {medicament.fournisseur.prenom}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <strong>Téléphone:</strong> {medicament.fournisseur.telephone}
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
            <Card.Body>
              <p><strong>Valeur totale en stock:</strong> {(medicament.prix * medicament.quantite).toFixed(2)} DHS</p>
              <p><strong>Jours avant expiration:</strong> {daysUntilExpiration} jours</p>
              
              <div className={expirationAlertClass}>
                {expirationMessage}
              </div>
              
              <div className={medicament.quantite < 10 ? "alert alert-danger" : 
                            medicament.quantite < 20 ? "alert alert-warning" : 
                            "alert alert-success"}>
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