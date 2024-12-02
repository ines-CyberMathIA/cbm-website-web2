import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const token = sessionStorage.getItem('token');
  const userStr = sessionStorage.getItem('user');

  if (!token || !userStr) {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    return <Navigate to="/login" />;
  }

  try {
    const user = JSON.parse(userStr);
    const path = window.location.pathname;
    const correctPath = `/${user.role}/dashboard`;

    if (!path.includes(`/${user.role}/`)) {
      return <Navigate to={correctPath} />;
    }

    return children;

  } catch (error) {
    console.error('Erreur lors de la lecture des données utilisateur:', error);
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    return <Navigate to="/login" />;
  }
};

export default PrivateRoute; 