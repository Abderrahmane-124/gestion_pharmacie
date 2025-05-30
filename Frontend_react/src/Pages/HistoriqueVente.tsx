import { useState } from 'react';
import { Table, Form, Button, InputGroup } from 'react-bootstrap';
import { FaCalendarAlt, FaMedkit, FaUserAlt } from 'react-icons/fa';
import '../Styles/HistoriqueVente.css';

const Historique = () => {
  const [filterDate, setFilterDate] = useState('');
  const [filterMedicament, setFilterMedicament] = useState('');
  const [filterClient, setFilterClient] = useState('');

  const ventes = [
    { id: 1, date: '2025-04-20', medicament: 'Paracetamol', client: 'Client A', quantite: 2, montant: '10€' },
    { id: 2, date: '2025-04-21', medicament: 'Ibuprofène', client: 'Client B', quantite: 1, montant: '5€' },
    // Données fictives à remplacer par celles de votre API
  ];

  const filteredVentes = ventes.filter(vente => {
    return (
      (filterDate ? vente.date.includes(filterDate) : true) &&
      (filterMedicament ? vente.medicament.toLowerCase().includes(filterMedicament.toLowerCase()) : true) &&
      (filterClient ? vente.client.toLowerCase().includes(filterClient.toLowerCase()) : true)
    );
  });

  return (
    <div className="historique-container">
      <h2>Historique des ventes</h2>
      <div className="filters">
        <InputGroup className="mb-3">
          <InputGroup.Text><FaCalendarAlt /></InputGroup.Text>
          <Form.Control
            type="date"
            placeholder="Filtrer par date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </InputGroup>
        <InputGroup className="mb-3">
          <InputGroup.Text><FaMedkit /></InputGroup.Text>
          <Form.Control
            type="text"
            placeholder="Filtrer par médicament"
            value={filterMedicament}
            onChange={(e) => setFilterMedicament(e.target.value)}
          />
        </InputGroup>
        <InputGroup className="mb-3">
          <InputGroup.Text><FaUserAlt /></InputGroup.Text>
          <Form.Control
            type="text"
            placeholder="Filtrer par client"
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
          />
        </InputGroup>
        <Button variant="primary" className="animate__animated animate__fadeIn">Rechercher</Button>
      </div>
      
      <Table striped bordered hover responsive className="vente-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Médicament</th>
            <th>Client</th>
            <th>Quantité</th>
            <th>Montant</th>
          </tr>
        </thead>
        <tbody>
          {filteredVentes.length > 0 ? filteredVentes.map((vente) => (
            <tr key={vente.id}>
              <td>{vente.date}</td>
              <td>{vente.medicament}</td>
              <td>{vente.client}</td>
              <td>{vente.quantite}</td>
              <td>{vente.montant}</td>
            </tr>
          )) : (
            <tr><td colSpan={5}>Aucune vente trouvée</td></tr>
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default Historique;
