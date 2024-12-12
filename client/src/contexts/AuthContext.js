import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import config from '../config';

const api = axios.create({
  baseURL: config.API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      const token = sessionStorage.getItem('token');
      const storedUser = sessionStorage.getItem('user');
      
      if (token && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } catch (error) {
          console.error('Erreur lors de l\'initialisation de l\'auth:', error);
          sessionStorage.clear();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await api.post('/api/users/login', credentials);

      const { token, user: userData } = response.data;
      
      if (!token || !userData) {
        throw new Error('Réponse invalide du serveur');
      }
      
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(userData));
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Erreur de connexion:', error);
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur de connexion'
      };
    }
  };

  const logout = () => {
    sessionStorage.clear();
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    navigate('/login', { replace: true });
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};