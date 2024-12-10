import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = ({ children, role }) => {
  const navigate = useNavigate();
  const token = sessionStorage.getItem('token');
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!token || !user || user.role !== role) {
      navigate('/login', { replace: true });
    }
  }, [token, user, role, navigate]);

  if (!token || !user || user.role !== role) {
    return null;
  }

  return children;
};

export default PrivateRoute;