import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import ParentDashboard from './components/ParentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import ManagerDashboard from './components/ManagerDashboard';
import HeroSection from './components/HeroSection';
import PrivateRoute from './components/PrivateRoute';

function App() {
  // Vérifier si l'utilisateur est connecté avec un token valide
  const isAuthenticated = () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) {
        return false;
      }

      const user = JSON.parse(userStr);
      return !!(user && user.role);

    } catch (error) {
      console.error('Erreur de vérification d\'authentification:', error);
      return false;
    }
  };

  // Obtenir le rôle de l'utilisateur
  const getUserRole = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      const user = JSON.parse(userStr);
      return user.role || null;
    } catch {
      return null;
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          {/* Routes publiques */}
          <Route path="/" element={
            isAuthenticated() && getUserRole() ? 
            <Navigate to={`/${getUserRole()}/dashboard`} replace /> : 
            <HeroSection />
          } />
          
          <Route path="/login" element={
            isAuthenticated() && getUserRole() ? 
            <Navigate to={`/${getUserRole()}/dashboard`} replace /> : 
            <Login />
          } />
          
          <Route path="/register" element={
            isAuthenticated() && getUserRole() ? 
            <Navigate to={`/${getUserRole()}/dashboard`} replace /> : 
            <Register />
          } />
          
          {/* Route de login admin */}
          <Route path="/admin/login" element={
            isAuthenticated() && getUserRole() === 'admin' ? 
            <Navigate to="/admin/dashboard" replace /> : 
            <AdminLogin />
          } />
          
          {/* Routes protégées */}
          <Route path="/admin/dashboard/*" element={
            <PrivateRoute>
              <AdminDashboard />
            </PrivateRoute>
          } />
          
          <Route path="/parent/dashboard/*" element={
            <PrivateRoute>
              <ParentDashboard />
            </PrivateRoute>
          } />
          
          <Route path="/teacher/dashboard/*" element={
            <PrivateRoute>
              <TeacherDashboard />
            </PrivateRoute>
          } />
          
          <Route path="/manager/dashboard/*" element={
            <PrivateRoute>
              <ManagerDashboard />
            </PrivateRoute>
          } />
          
          {/* Redirection par défaut */}
          <Route path="*" element={
            isAuthenticated() && getUserRole() ? 
            <Navigate to={`/${getUserRole()}/dashboard`} replace /> : 
            <Navigate to="/" replace />
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 