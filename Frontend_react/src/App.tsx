import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Homepage from "./Pages/HomePage";
import LoginPage from "./Pages/Loginpage";
import SignUp from "./Pages/SignUp";
import PharmacienDashboard from "./Pages/PharmacienDashboard";
import MesMedicaments from "./Pages/Medicament";
import VisualiserVente from "./Pages/VisualiserVente";
import MedicamentDetail from "./Pages/MedicationDetail";
import Statistique from "./Pages/Statistique";
import Panier from "./Pages/Panier";
import ConfirmationCommande from "./Pages/ConfirmationCommande";
import VentePharmacien from "./Pages/VentePharmacien";
import DashboardFournisseur from "./Pages/DashbordFournisseur";
import Alerte from "./Pages/Alerte";
import HistoriqueVente from "./Pages/HistoriqueVente";






function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dashboard-pharmacien" element={<PharmacienDashboard />} />
        <Route path="/mes-medicaments" element={<MesMedicaments />} />
        <Route path="/medicament/:id" element={<MedicamentDetail />} />
        <Route path="/statistique" element={<Statistique/>} />
        <Route path="/panier" element={<Panier />} />
        <Route path="/confirmation-commande" element={<ConfirmationCommande />} />
        
        <Route path="/VisualiserVente/:id" element={<VisualiserVente />} />
        <Route path="/vente-pharmacien" element={<VentePharmacien />} />
        <Route path="/dashboard-Fornisseur" element={<DashboardFournisseur />} />
        <Route path="/alerte" element={<Alerte />} />
        <Route path="/historique-vente" element={<HistoriqueVente />} />

        {/* Add more routes as needed */}

     
      </Routes>
    </Router>

  );
  // Remove this duplicate export and move the VisualiserVente function to its own file if needed.
}

export default App;
