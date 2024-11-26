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
import CompleteManagerRegistration from './components/CompleteManagerRegistration';

function App() {
  // Vérifier si l'utilisateur est connecté avec un token valide
  const isAuthenticated = () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) {
        console.log('Pas de token ou pas d\'utilisateur');
        return false;
      }

      const user = JSON.parse(userStr);
      if (!user || !user.role || !user.id) {
        console.log('Données utilisateur invalides');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return false;
      }

      // Vérifier que le token n'est pas expiré (si vous avez un timestamp)
      return true;

    } catch (error) {
      console.error('Erreur de vérification d\'authentification:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
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
            (() => {
              console.log('Rendu de la route racine');
              const authenticated = isAuthenticated();
              const role = getUserRole();
              console.log('État auth:', { authenticated, role });
              
              if (authenticated && role) {
                console.log('Redirection vers dashboard:', role);
                return <Navigate to={`/${role}/dashboard`} replace />;
              }
              
              console.log('Affichage HeroSection');
              return <HeroSection />;
            })()
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
          
          {/* Ajout de la route pour la finalisation d'inscription manager */}
          <Route 
            path="/complete-manager-registration" 
            element={<CompleteManagerRegistration />} 
          />
          
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