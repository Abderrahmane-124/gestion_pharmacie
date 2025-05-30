import { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../Styles/Alerte.css';
import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { ArrowLeft } from 'react-bootstrap-icons';

interface Medicament {
  id: number;
  nom: string;
}

interface Alerte {
  id: number;
  message: string;
  dateCreation: string;
  minimumQuantite: number;
  medicaments: Medicament[];
}

const Alerte = () => {
  const navigate = useNavigate();
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [recherche, setRecherche] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [message, setMessage] = useState('');
  const [minimumQuantite, setMinimumQuantite] = useState('');
  const [selectedMedicaments, setSelectedMedicaments] = useState<number[]>([]);
  const [medicaments, setMedicaments] = useState<Medicament[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAlerte, setCurrentAlerte] = useState<Alerte | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  // Fetch alertes
  const fetchAlertes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/alertes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setAlertes(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des alertes');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's medicaments
  const fetchMedicaments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/medicaments/my-medicaments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setMedicaments(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des médicaments');
    }
  };

  useEffect(() => {
    fetchAlertes();
    fetchMedicaments();
  }, []);

  const handleCreateAlerte = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!message || !minimumQuantite || selectedMedicaments.length === 0) {
      setError('Veuillez remplir tous les champs et sélectionner au moins un médicament.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8080/api/alertes', {
        message,
        minimumQuantite: parseInt(minimumQuantite, 10),
        medicamentIds: selectedMedicaments
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setShowForm(false);
      setMessage('');
      setMinimumQuantite('');
      setSelectedMedicaments([]);
      fetchAlertes();
    } catch (err) {
      setError('Erreur lors de la création de l\'alerte');
    }
  };

  const handleEditAlerte = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!currentAlerte) return;
    
    if (!message || !minimumQuantite || selectedMedicaments.length === 0) {
      setError('Veuillez remplir tous les champs et sélectionner au moins un médicament.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8080/api/alertes/${currentAlerte.id}`, {
        message,
        minimumQuantite: parseInt(minimumQuantite, 10),
        medicamentIds: selectedMedicaments
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setShowEditForm(false);
      setCurrentAlerte(null);
      setMessage('');
      setMinimumQuantite('');
      setSelectedMedicaments([]);
      fetchAlertes();
    } catch (err) {
      setError('Erreur lors de la mise à jour de l\'alerte');
    }
  };

  const handleDeleteAlerte = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8080/api/alertes/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setShowDeleteConfirm(null);
      fetchAlertes();
    } catch (err) {
      setError('Erreur lors de la suppression de l\'alerte');
    }
  };

  const openEditForm = (alerte: Alerte) => {
    setCurrentAlerte(alerte);
    setMessage(alerte.message);
    setMinimumQuantite(alerte.minimumQuantite.toString());
    setSelectedMedicaments(alerte.medicaments.map(m => m.id));
    setShowEditForm(true);
  };

  const closeEditForm = () => {
    setShowEditForm(false);
    setCurrentAlerte(null);
    setMessage('');
    setMinimumQuantite('');
    setSelectedMedicaments([]);
  };

  const filtrerAlertes = alertes.filter(a =>
    a.message.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <>
      {/* Effet Bulles */}
      <div className="bubbles">
        {[...Array(10)].map((_, index) => (
          <div key={index} className="bubble"></div>
        ))}
      </div>

      <div className="container py-5">
        <div className="card shadow rounded-4 p-4 mb-4 position-relative">
          <Button 
            variant="success" 
            className="home-button"
            onClick={() => navigate('/dashboard-pharmacien')}
            size="sm"
          >
            <ArrowLeft className="me-2" /> Page d'accueil
          </Button>
          
          {/* Create Form */}
          {showForm && (
            <div className="inner-card shadow-sm rounded-4 p-4 mb-4 mt-5">
              <h4 className="text-secondary mb-3">Nouvelle alerte</h4>
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={handleCreateAlerte}>
                <div className="mb-3">
                  <label className="form-label">Message :</label>
                  <textarea
                    className="form-control"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={3}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Quantité minimum :</label>
                  <input
                    type="number"
                    className="form-control"
                    value={minimumQuantite}
                    onChange={e => setMinimumQuantite(e.target.value)}
                    required
                    min={1}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Médicaments concernés :</label>
                  <select
                    className="form-select"
                    multiple
                    value={selectedMedicaments.map(String)}
                    onChange={e => {
                      const options = Array.from(e.target.selectedOptions, opt => Number(opt.value));
                      setSelectedMedicaments(options);
                    }}
                    required
                  >
                    {medicaments.map(med => (
                      <option key={med.id} value={med.id}>{med.nom}</option>
                    ))}
                  </select>
                  <small className="text-muted">(Maintenez Ctrl ou Cmd pour sélectionner plusieurs)</small>
                </div>
                <button type="submit" className="btn btn-primary w-100 mt-2">Valider</button>
              </form>
            </div>
          )}

          {/* Edit Form */}
          {showEditForm && currentAlerte && (
            <div className="inner-card shadow-sm rounded-4 p-4 mb-4 mt-5">
              <h4 className="text-secondary mb-3">Modifier l'alerte</h4>
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={handleEditAlerte}>
                <div className="mb-3">
                  <label className="form-label">Message :</label>
                  <textarea
                    className="form-control"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={3}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Quantité minimum :</label>
                  <input
                    type="number"
                    className="form-control"
                    value={minimumQuantite}
                    onChange={e => setMinimumQuantite(e.target.value)}
                    required
                    min={1}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Médicaments concernés :</label>
                  <select
                    className="form-select"
                    multiple
                    value={selectedMedicaments.map(String)}
                    onChange={e => {
                      const options = Array.from(e.target.selectedOptions, opt => Number(opt.value));
                      setSelectedMedicaments(options);
                    }}
                    required
                  >
                    {medicaments.map(med => (
                      <option key={med.id} value={med.id}>{med.nom}</option>
                    ))}
                  </select>
                  <small className="text-muted">(Maintenez Ctrl ou Cmd pour sélectionner plusieurs)</small>
                </div>
                <div className="d-flex justify-content-between">
                  <button type="button" className="btn btn-secondary" onClick={closeEditForm}>
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Mettre à jour
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="inner-card shadow-sm rounded-4 p-4 mt-5">
            <h4 className="text-secondary mb-3">Liste des alertes</h4>
            {loading ? <p>Chargement...</p> : (
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Message</th>
                    <th>Date</th>
                    <th>Quantité min</th>
                    <th>Médicaments</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrerAlertes.map((alerte) => (
                    <tr key={alerte.id}>
                      <td>{alerte.message}</td>
                      <td>{new Date(alerte.dateCreation).toLocaleDateString()}</td>
                      <td>{alerte.minimumQuantite}</td>
                      <td>{alerte.medicaments.map(m => m.nom).join(', ')}</td>
                      <td>
                        <div className="btn-group">
                          <button 
                            className="btn btn-sm btn-outline-primary" 
                            onClick={() => openEditForm(alerte)}
                          >
                            Modifier
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-danger" 
                            onClick={() => setShowDeleteConfirm(alerte.id)}
                          >
                            Supprimer
                          </button>
                        </div>
                        
                        {/* Delete Confirmation */}
                        {showDeleteConfirm === alerte.id && (
                          <div className="delete-confirm mt-2">
                            <p className="text-danger mb-1">Supprimer cette alerte ?</p>
                            <div className="btn-group btn-group-sm">
                              <button 
                                className="btn btn-danger" 
                                onClick={() => handleDeleteAlerte(alerte.id)}
                              >
                                Oui
                              </button>
                              <button 
                                className="btn btn-secondary" 
                                onClick={() => setShowDeleteConfirm(null)}
                              >
                                Non
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filtrerAlertes.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center">
                        Aucune alerte trouvée
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Alerte;
