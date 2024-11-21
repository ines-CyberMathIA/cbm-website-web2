import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  // Si pas de token ou pas d'utilisateur, rediriger vers la page de connexion
  if (!token || !userStr) {
    console.log('Pas de token ou pas d\'utilisateur, redirection vers /login');
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    console.log('Utilisateur connecté:', user);

    // Rediriger vers le bon dashboard selon le rôle
    const path = window.location.pathname;
    const correctPath = `/${user.role}/dashboard`;

    if (!path.startsWith(correctPath)) {
      console.log(`Redirection vers le dashboard ${user.role}`);
      return <Navigate to={correctPath} replace />;
    }

    // Si tout est OK, afficher le composant protégé
    console.log('Accès autorisé au composant protégé');
    return children;

  } catch (error) {
    console.error('Erreur lors de la lecture des données utilisateur:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }
};

export default PrivateRoute; 