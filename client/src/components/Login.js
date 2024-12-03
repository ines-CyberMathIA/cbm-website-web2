import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';

const Login = ({ isDarkMode }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    role: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      sessionStorage.clear();

      const response = await axios.post('http://localhost:5000/api/users/login', {
        email: formData.email.toLowerCase(),
        password: formData.password,
        role: formData.role
      });

      if (response.data.token && response.data.user) {
        sessionStorage.setItem('token', response.data.token);
        sessionStorage.setItem('user', JSON.stringify({
          id: response.data.user.id,
          role: response.data.user.role,
          firstName: response.data.user.firstName,
          lastName: response.data.user.lastName
        }));

        navigate(`/${response.data.user.role}/dashboard`);
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      
      if (error.response?.status === 401) {
        setError('Email ou mot de passe incorrect');
      } else {
        setError(error.response?.data?.message || 'Une erreur est survenue lors de la connexion');
      }
    } finally {
      setLoading(false);
    }
  };

  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const user = sessionStorage.getItem('user');
    
    if (token && user) {
      try {
        const userData = JSON.parse(user);
        if (userData.role) {
          // Navigation sans replace
          navigate(`/${userData.role}/dashboard`);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de la session:', error);
        sessionStorage.clear();
      }
    }
  }, [navigate]);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#1a1b2e]' : 'bg-gray-50'} relative overflow-hidden flex flex-col justify-center py-12 sm:px-6 lg:px-8`}>
      {/* Formes décoratives */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Étoiles/Bulles */}
        <div className="absolute top-0 left-0 w-full h-full">
          {isDarkMode ? (
            // Étoiles pour le mode sombre
            [...Array(40)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0.1 }}
                animate={{ opacity: [0.1, 0.8, 0.1] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: "easeInOut"
                }}
                className="absolute w-1 h-1 bg-white"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
                }}
              />
            ))
          ) : (
            // Cercles colorés pour le mode clair
            [...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0.8 }}
                animate={{ 
                  scale: [0.8, 1.1, 0.8],
                  y: [0, -15, 0]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
                className={`absolute rounded-full ${
                  i % 3 === 0 ? 'bg-blue-200' :
                  i % 3 === 1 ? 'bg-purple-200' :
                  'bg-pink-200'
                } mix-blend-multiply`}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: `${Math.random() * 20 + 10}px`,
                  height: `${Math.random() * 20 + 10}px`,
                  opacity: 0.4
                }}
              />
            ))
          )}
        </div>

        {/* Formes géométriques */}
        <motion.div
          className={`absolute -top-20 -right-20 w-80 h-80 ${
            isDarkMode 
              ? 'border-purple-500 border-2 opacity-20' 
              : 'bg-gradient-to-br from-purple-300/30 to-pink-300/30'
          }`}
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{
            clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)'
          }}
        />
      </div>

      {/* Contenu du formulaire */}
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center">
          <span className={`text-4xl font-bold bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 bg-clip-text text-transparent`}>
            CyberMathIA
          </span>
        </Link>
        <h2 className={`mt-6 text-center text-3xl font-extrabold ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Connexion à votre espace
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className={`${
          isDarkMode 
            ? 'bg-[#2d3154]/50 backdrop-blur-lg border border-gray-700' 
            : 'bg-white'
        } py-8 px-4 shadow-xl rounded-2xl sm:px-10`}>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className={`${
                isDarkMode ? 'bg-red-900/50 border-red-700 text-red-200' : 'bg-red-50 border-red-400 text-red-700'
              } border px-4 py-3 rounded relative`} role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            
            {/* Sélection du rôle */}
            <div>
              <label className={`block text-sm font-medium ${
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Je suis...
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={`mt-1 block w-full pl-3 pr-10 py-3 text-base ${
                  isDarkMode 
                    ? 'bg-[#1a1b2e] border-gray-700 text-white focus:ring-purple-500 focus:border-purple-500' 
                    : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                } focus:outline-none rounded-xl`}
                required
              >
                <option value="">Sélectionnez votre profil</option>
                <option value="student">Élève</option>
                <option value="parent">Parent</option>
                <option value="teacher">Professeur</option>
                <option value="admin">Administrateur</option>
                <option value="manager">Manager</option>
              </select>
            </div>

            {/* Email */}
            <div>
              <label className={`block text-sm font-medium ${
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Email
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  className={`appearance-none block w-full px-3 py-3 border ${
                    isDarkMode 
                      ? 'bg-[#1a1b2e] border-gray-700 text-white placeholder-gray-500 focus:ring-purple-500 focus:border-purple-500' 
                      : 'border-gray-300 placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500'
                  } rounded-xl shadow-sm focus:outline-none`}
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label className={`block text-sm font-medium ${
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Mot de passe
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className={`appearance-none block w-full px-3 py-3 border ${
                    isDarkMode 
                      ? 'bg-[#1a1b2e] border-gray-700 text-white placeholder-gray-500 focus:ring-purple-500 focus:border-purple-500' 
                      : 'border-gray-300 placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500'
                  } rounded-xl shadow-sm focus:outline-none`}
                />
              </div>
            </div>

            {/* Options de connexion */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className={`h-4 w-4 ${
                    isDarkMode 
                      ? 'text-purple-600 border-gray-700 focus:ring-purple-500' 
                      : 'text-indigo-600 border-gray-300 focus:ring-indigo-500'
                  } rounded`}
                />
                <label htmlFor="remember-me" className={`ml-2 block text-sm ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-900'
                }`}>
                  Se souvenir de moi
                </label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className={`font-medium ${
                  isDarkMode 
                    ? 'text-purple-400 hover:text-purple-300' 
                    : 'text-indigo-600 hover:text-indigo-500'
                }`}>
                  Mot de passe oublié ?
                </Link>
              </div>
            </div>

            {/* Bouton de connexion */}
            <div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
              >
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full px-12 py-3"
                >
                  <span className={`relative z-10 ${isDarkMode ? 'text-[#e0e4ff]' : 'text-[#2d3154]'} font-medium text-lg`}>
                    {loading ? 'Connexion...' : 'Se connecter'}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#6e8eff]/90 to-[#8b9eff]/90 rounded-full transform group-hover:scale-105 transition-transform duration-300"></div>
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6e8eff] to-[#8b9eff] rounded-full opacity-0 group-hover:opacity-100 blur transition-opacity duration-300"></div>
                </button>
              </motion.div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;