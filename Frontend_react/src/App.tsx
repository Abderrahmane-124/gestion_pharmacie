import SignUp from "./Pages/SignUp";
<<<<<<< HEAD
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




=======
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardPharmacien from './Pages/PharmacienDashboard';
import FournisseurDashboard from './Pages/FournisseurDashboard';
import { JSX, useEffect, useState } from "react";
import LoginPage from "./Pages/Loginpage";
import Homepage from "./Pages/HomePage";
>>>>>>> 569dc12c9fb99d66c5aa08c3909d7a6af37325ab

// Auto logout component for public pages
const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const { logout, isAuthenticated } = useAuth();
  
  useEffect(() => {
    // When this component mounts, log the user out if they're authenticated
    if (isAuthenticated) {
      logout();
    }
  }, [isAuthenticated, logout]);
  
  return children;
};

// Protected route component
const ProtectedRoute = ({ children, role }: { children: JSX.Element, role?: string }) => {
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Use effect to handle the initial loading state
  useEffect(() => {
    // Short timeout to allow authentication state to be checked
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500); // 500ms should be enough for auth check
    
    return () => clearTimeout(timer);
  }, []);
  
  // While checking authentication, show nothing (or you could add a loading spinner)
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (role && user?.role !== role) {
    return <Navigate to="/" />;
  }
  
  return children;
};

function AppRoutes() {
  return (
<<<<<<< HEAD
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

=======
    <Routes>
      <Route path="/" element={
        <PublicRoute>
          <Homepage />
        </PublicRoute>
      } />
      <Route path="/signup" element={
        <PublicRoute>
          <SignUp />
        </PublicRoute>
      } />
      <Route path="/login" element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      } />
      <Route 
        path="/PharmacienDashboard" 
        element={
          <ProtectedRoute role="PHARMACIEN">
            <DashboardPharmacien />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/FournisseurDashboard" 
        element={
          <ProtectedRoute role="FOURNISSEUR">
            <FournisseurDashboard />
          </ProtectedRoute>
        } 
      />
    </Routes>
>>>>>>> 569dc12c9fb99d66c5aa08c3909d7a6af37325ab
  );
  // Remove this duplicate export and move the VisualiserVente function to its own file if needed.
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}