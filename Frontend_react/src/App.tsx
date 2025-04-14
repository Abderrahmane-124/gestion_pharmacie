import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Homepage from "./Pages/HomePage";
import LoginPage from "./Pages/Loginpage";
import SignUp from "./Pages/SignUp";
import PharmacienDashboard from "./Pages/PharmacienDashboard";
import MesMedicaments from "./Pages/Medicament";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dashboard-pharmacien" element={<PharmacienDashboard />} />
        <Route path="/mes-medicaments" element={<MesMedicaments />} />
     
      </Routes>
    </Router>
  );
}

export default App;
