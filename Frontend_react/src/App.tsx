import SignUp from "./Pages/SignUp";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardPharmacien from './Pages/PharmacienDashboard';
import FournisseurDashboard from './Pages/FournisseurDashboard';
import { JSX, useEffect, useState } from "react";
import LoginPage from "./Pages/Loginpage";
import Homepage from "./Pages/HomePage";

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