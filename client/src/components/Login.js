import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
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
    // Conserver la valeur exacte du mot de passe sans transformation
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
      const response = await axios.post('http://localhost:5001/api/users/login', {
        email: formData.email.toLowerCase(),
        password: formData.password,
        role: formData.role
      });

      if (response.data.token) {
        // Stocker le token et les infos utilisateur
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Redirection directe selon le rôle (sans alert)
        switch (formData.role) {
          case 'parent':
            navigate('/parent-dashboard');
            break;
          case 'student':
            navigate('/student-dashboard');
            break;
          case 'teacher':
            navigate('/teacher-dashboard');
            break;
          case 'manager':
            navigate('/manager-dashboard');
            break;
          case 'admin':
            navigate('/admin-dashboard');
            break;
          default:
            navigate('/');
        }
      } else {
        setError('Erreur lors de la connexion : token manquant');
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

  return (
    <div className="min-h-screen bg-gray-50 geometric-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center">
          <span className="text-3xl font-bold text-indigo-600">CyberMathIA</span>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Connexion à votre espace
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
                {error.includes('créer un compte') && (
                  <Link 
                    to="/register" 
                    className="block mt-2 text-red-700 underline hover:text-red-800"
                  >
                    Créer un compte
                  </Link>
                )}
              </div>
            )}
            
            {/* Sélection du rôle */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Je suis...
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="mt-1 block w-full pl-3 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-xl"
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
              <label className="block text-sm font-medium text-gray-700">
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
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  autoCapitalize="off"  // Désactiver l'auto-capitalisation
                  autoCorrect="off"     // Désactiver l'auto-correction
                  spellCheck="false"    // Désactiver la vérification orthographique
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  style={{ textTransform: 'none' }}  // Empêcher toute transformation CSS
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Entrez votre mot de passe exactement comme lors de l'inscription
              </p>
            </div>

            {/* Options de connexion */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Se souvenir de moi
                </label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Mot de passe oublié ?
                </Link>
              </div>
            </div>

            {/* Bouton de connexion */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connexion en cours...
                  </span>
                ) : (
                  'Se connecter'
                )}
              </button>
            </div>
          </form>

          {/* Lien d'inscription */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Pas encore de compte ?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/register"
                className="w-full flex justify-center py-3 px-4 border border-indigo-600 rounded-xl shadow-sm text-sm font-medium text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Créer un compte gratuitement
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 