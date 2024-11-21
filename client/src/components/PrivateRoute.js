import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token || !user) {
    // Rediriger vers la page de connexion appropriée en fonction du rôle
    const role = user?.role;
    switch (role) {
      case 'admin':
        return <Navigate to="/admin/login" replace />;
      case 'teacher':
        return <Navigate to="/login" replace />;
      case 'parent':
        return <Navigate to="/login" replace />;
      case 'manager':
        return <Navigate to="/login" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  // Si l'utilisateur est authentifié, afficher le composant protégé
  return children;
};

export default PrivateRoute; 