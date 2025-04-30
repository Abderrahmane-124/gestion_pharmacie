import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../Styles/Medicament.css";

export default function MesMedicaments() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [medicaments, setMedicaments] = useState([
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
  ]);

  const [newMedicament, setNewMedicament] = useState({
    nom: "",
    description: "",
    prix: "",
    quantite: "",
    expiration: "",
  });

  const handleAdd = () => {
    const newId = medicaments.length + 1;
    setMedicaments([
      ...medicaments,
      {
        id: newId,
        ...newMedicament,
        prix: parseFloat(newMedicament.prix),
        quantite: parseInt(newMedicament.quantite),
        fournisseur: {
          nom: "Par défaut",
          prenom: "Fournisseur",
          telephone: "0600000000",
        },
      },
    ]);
    setNewMedicament({ nom: "", description: "", prix: "", quantite: "", expiration: "" });
  };

  const handleDelete = (id: number) => {
    setMedicaments(medicaments.filter((m) => m.id !== id));
  };

  const handleEdit = (id: number) => {
    const medToEdit = medicaments.find((m) => m.id === id);
    if (medToEdit) {
      setNewMedicament({
        nom: medToEdit.nom,
        description: medToEdit.description,
        prix: medToEdit.prix.toString(),
        quantite: medToEdit.quantite.toString(),
        expiration: medToEdit.expiration,
      });
      handleDelete(id);
    }
  };

  const handleVisualiserVente = (id: number) => {
    navigate(`/VisualiserVente/${id}`);
  };

  const filteredMedicaments = medicaments.filter((m) =>
    m.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container py-4">
      <h2 className="mb-4 text-center text-primary">Mes Médicaments</h2>

      <div className="mb-4">
        <input
          type="text"
          className="form-control"
          placeholder="Rechercher un médicament..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="card p-4 shadow-sm mb-4">
        <div className="row g-2">
          <div className="col-md-2">
            <input
              type="text"
              className="form-control"
              placeholder="Nom"
              value={newMedicament.nom}
              onChange={(e) => setNewMedicament({ ...newMedicament, nom: e.target.value })}
            />
          </div>
          <div className="col-md-2">
            <input
              type="text"
              className="form-control"
              placeholder="Description"
              value={newMedicament.description}
              onChange={(e) => setNewMedicament({ ...newMedicament, description: e.target.value })}
            />
          </div>
          <div className="col-md-2">
            <input
              type="number"
              className="form-control"
              placeholder="Prix"
              value={newMedicament.prix}
              onChange={(e) => setNewMedicament({ ...newMedicament, prix: e.target.value })}
            />
          </div>
          <div className="col-md-2">
            <input
              type="number"
              className="form-control"
              placeholder="Quantité"
              value={newMedicament.quantite}
              onChange={(e) => setNewMedicament({ ...newMedicament, quantite: e.target.value })}
            />
          </div>
          <div className="col-md-2">
            <input
              type="date"
              className="form-control"
              value={newMedicament.expiration}
              onChange={(e) => setNewMedicament({ ...newMedicament, expiration: e.target.value })}
            />
          </div>
          <div className="col-md-2">
            <button className="btn btn-success w-100" onClick={handleAdd}>Ajouter</button>
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead className="table-primary">
            <tr>
              <th>Nom</th>
              <th>Prix</th>
              <th>Quantité</th>
              <th>Expiration</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMedicaments.map((m) => (
              <tr key={m.id} className="fade-in">
                <td
                  onClick={() => navigate(`/detail-medicament/${m.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <strong className="text-info">{m.nom}</strong>
                </td>
                <td>{m.prix} DHS</td>
                <td>{m.quantite}</td>
                <td>{m.expiration}</td>
                <td>
                  <button className="btn btn-warning btn-sm me-2" onClick={() => handleEdit(m.id)}>Modifier</button>
                  <button className="btn btn-danger btn-sm me-2" onClick={() => handleDelete(m.id)}>Supprimer</button>
                  <button className="btn btn-info btn-sm" onClick={() => handleVisualiserVente(m.id)}>
                    Visualiser vente fournisseur
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}