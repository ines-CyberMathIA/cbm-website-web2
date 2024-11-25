import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Nettoyer le localStorage au démarrage de l'application
const cleanupStorage = () => {
  try {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token || userStr) {
      console.log('Nettoyage des données de session...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  } catch (error) {
    console.error('Erreur lors du nettoyage:', error);
    localStorage.clear();
  }
};

// Exécuter le nettoyage
cleanupStorage();

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 