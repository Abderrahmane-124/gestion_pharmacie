import { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../Styles/Alerte.css'; // On va mettre l'animation dans ce fichier

const Alerte = () => {
  const [message, setMessage] = useState('');
  const [minimumQuantite, setMinimumQuantite] = useState('');
  const [medicaments, setMedicaments] = useState<string[]>([]);
  const [recherche, setRecherche] = useState('');
  const [alertes, setAlertes] = useState([
    { id: 1, message: "Stock faible de Doliprane", date: "19/04/2025" },
    { id: 2, message: "Réapprovisionnement Efferalgan", date: "18/04/2025" },
    { id: 3, message: "Amoxicilline en rupture", date: "15/04/2025" }
  ]);

  const ajouterMedicament = (nom: string) => {
    if (nom && !medicaments.includes(nom)) {
      setMedicaments([...medicaments, nom]);
    }
  };

  const retirerMedicament = (nom: string) => {
    setMedicaments(medicaments.filter(med => med !== nom));
  };

  const enregistrerAlerte = () => {
    if (message && minimumQuantite) {
      const nouvelleAlerte = {
        id: alertes.length + 1,
        message,
        date: new Date().toLocaleDateString()
      };
      setAlertes([...alertes, nouvelleAlerte]);
      setMessage('');
      setMinimumQuantite('');
      setMedicaments([]);
    }
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
        <h2 className="text-center text-primary mb-4">Gestion des Alertes</h2>

        <div className="row">
          {/* Formulaire création */}
          <div className="col-md-5 mb-4">
            <div className="card shadow rounded-4 p-4">
              <h4 className="text-secondary mb-3">Créer une alerte</h4>

              <div className="mb-3">
                <label className="form-label">Message :</label>
                <textarea 
                  className="form-control" 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Quantité minimum :</label>
                <input 
                  type="number"
                  className="form-control"
                  value={minimumQuantite}
                  onChange={(e) => setMinimumQuantite(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Médicaments concernés :</label>
                <div className="d-flex flex-wrap gap-2">
                  {medicaments.map((med, idx) => (
                    <span key={idx} className="badge bg-info text-dark p-2 rounded-pill">
                      {med} <span role="button" onClick={() => retirerMedicament(med)}>×</span>
                    </span>
                  ))}
                </div>
                <input 
                  type="text" 
                  className="form-control mt-2"
                  placeholder="Ajouter médicament..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      ajouterMedicament((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
              </div>

              <button 
                className="btn btn-success w-100 mt-3"
                onClick={enregistrerAlerte}
              >
                Enregistrer
              </button>
            </div>
          </div>

          {/* Liste alertes */}
          <div className="col-md-7">
            <div className="card shadow rounded-4 p-4">
              <h4 className="text-secondary mb-3">Liste des alertes</h4>

              <div className="input-group mb-3">
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Rechercher..."
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
                <span className="input-group-text">
                  🔍
                </span>
              </div>

              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Message</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrerAlertes.map((alerte) => (
                    <tr key={alerte.id}>
                      <td>{alerte.message}</td>
                      <td>{alerte.date}</td>
                      <td>
                        <button className="btn btn-primary btn-sm me-2">✏️</button>
                        <button className="btn btn-danger btn-sm">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Fake */}
              <nav className="d-flex justify-content-center">
                <ul className="pagination">
                  <li className="page-item active"><a className="page-link" href="#">1</a></li>
                  <li className="page-item"><a className="page-link" href="#">2</a></li>
                  <li className="page-item"><a className="page-link" href="#">3</a></li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Alerte;
