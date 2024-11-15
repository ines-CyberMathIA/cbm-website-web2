import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const CompleteTeacherRegistration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenData, setTokenData] = useState(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');

    if (!token) {
      setError('Lien invalide ou expiré');
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await axios.post('http://localhost:5001/api/users/verify-teacher-token', { token });
        setTokenData(response.data);
      } catch (error) {
        setError('Ce lien est invalide ou a expiré');
      }
    };

    verifyToken();
  }, [location]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    try {
      const searchParams = new URLSearchParams(location.search);
      const token = searchParams.get('token');

      const response = await axios.post('http://localhost:5001/api/users/complete-teacher-registration', {
        token,
        password: formData.password
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/teacher-dashboard');
    } catch (error) {
      setError(error.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // ... reste du composant (même structure que CompleteManagerRegistration) ...
};

export default CompleteTeacherRegistration; 