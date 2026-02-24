import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

// Components
import Login from './components/Auth/Login';
import CustomerRegister from './components/Auth/CustomerRegister';
import EmployeeRegister from './components/Auth/EmployeeRegister';
import CustomerDashboard from './components/Customer/CustomerDashboard';
import EmployeeDashboard from './components/Employee/EmployeeDashboard';
import Navbar from './components/Layout/Navbar';
import LandingPage from './components/Landing/LandingPage';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" />;
  }

  return children;
};

function AppContent() {
  const { isAuthenticated, isEmployee } = useAuth();

  return (
    <div className="App">
      <Navbar />
      <Routes>
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              isEmployee ? <Navigate to="/employee/dashboard" /> : <Navigate to="/customer/dashboard" />
            ) : (
              <LandingPage />
            )
          } 
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<CustomerRegister />} />
        <Route path="/register/employee" element={<EmployeeRegister />} />
        
        <Route
          path="/customer/dashboard"
          element={
            <ProtectedRoute requiredRole="customer">
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/employee/dashboard"
          element={
            <ProtectedRoute requiredRole="employee">
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
