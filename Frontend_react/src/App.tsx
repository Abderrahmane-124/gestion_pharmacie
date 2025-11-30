import SignUp from "./Pages/SignUp";
import PharmacienDashboard from "./Pages/PharmacienDashboard";
import MesMedicaments from "./Pages/MesMedicaments";
import VisualiserVente from "./Pages/VisualiserVente";
import MedicamentDetail from "./Pages/MedicationDetail";
import Statistique from "./Pages/Statistique";
import Panier from "./Pages/Panier";
import DetailleCommande from "./Pages/DetailleCommande";
import VentePharmacien from "./Pages/VentePharmacien";
import DashboardFournisseur from "./Pages/DashbordFournisseur";
import Alerte from "./Pages/Alerte";
import Commandes_fournisseur from "./Pages/Commandes_fournisseur";
import Commandes_pharmacien from './Pages/Commandes_pharmacien';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from "./context/AuthContext";
import Homepage from "./Pages/HomePage";
import LoginPage from "./Pages/Loginpage";
import ClientPage from './Pages/client';
import { JSX, useEffect } from "react";
import React from "react";
import HistoriquePharmacien from './Pages/HistoriquePharmacien';
import FournisseurMedicaments from './Pages/FournisseurMedicaments';

// Protected route component that checks authentication
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>; // Or a better loading component
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Public route component that always logs out authenticated users
const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, logout } = useAuth();
  
  useEffect(() => {
    // Always logout when accessing public routes
    if (isAuthenticated) {
      logout();
    }
  }, [isAuthenticated, logout]);
  
  return children;
};

function AppRoutes() {
  // Set state for protected routes to track navigation
  const setProtectedState = (element: JSX.Element) => {
    return (
      <ProtectedRoute>
        {React.cloneElement(element, { state: { fromProtected: true } })}
      </ProtectedRoute>
    );
  };
  
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={
        <PublicRoute>
          <Homepage />
        </PublicRoute>
      } />
      <Route path="/login" element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      } />
      <Route path="/signup" element={
        <PublicRoute>
          <SignUp />
        </PublicRoute>
      } />
      <Route path="/client" element={
        <PublicRoute>
          <ClientPage />
        </PublicRoute>
      } />
      
      {/* Protected Routes */}
      <Route path="/dashboard-pharmacien" element={<PharmacienDashboard />} />
      <Route path="/mes-medicaments" element={setProtectedState(<MesMedicaments />)} />
      <Route path="/medicament/:id" element={setProtectedState(<MedicamentDetail />)} />
      <Route path="/statistique" element={setProtectedState(<Statistique />)} />
      <Route path="/panier" element={setProtectedState(<Panier />)} />
      <Route path="/detaille-commande/:id" element={setProtectedState(<DetailleCommande />)} />
      <Route path="/VisualiserVente/:id" element={setProtectedState(<VisualiserVente />)} />
      <Route path="/vente-pharmacien" element={setProtectedState(<VentePharmacien />)} />
      <Route path="/dashboard-Fornisseur" element={setProtectedState(<DashboardFournisseur />)} />
      <Route path="/alerte" element={setProtectedState(<Alerte />)} />
      <Route path="/historique-pharmacien" element={setProtectedState(<HistoriquePharmacien />)} />
      <Route path="/Commandes_fournisseur" element={setProtectedState(<Commandes_fournisseur />)} />
      <Route path="/Commandes_pharmacien" element={<Commandes_pharmacien />} />
      <Route path="/fournisseur/:fournisseurId" element={<FournisseurMedicaments />} />
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
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