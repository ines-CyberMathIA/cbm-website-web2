import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!showTwoFactor) {
        // Première étape : vérification des identifiants
        console.log('Envoi des identifiants admin:', { login });
        const response = await axios.post('http://localhost:5000/api/admin/login', {
          login,
          password
        });

        console.log('Réponse du serveur (login):', response.data);

        if (response.data.requireTwoFactor) {
          setShowTwoFactor(true);
          setLoading(false);
          return;
        }
      } else {
        // Deuxième étape : vérification du code 2FA
        console.log('Envoi du code 2FA');
        const response = await axios.post('http://localhost:5000/api/admin/verify-2fa', {
          login,
          twoFactorCode
        });

        console.log('Réponse du serveur (2FA):', response.data);

        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          navigate('/admin/dashboard');
          return;
        }
      }
    } catch (error) {
      console.error('Erreur détaillée:', error);
      setError(error.response?.data?.message || 'Erreur de connexion');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {showTwoFactor ? 'Vérification en deux étapes' : 'Connexion Admin'}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {!showTwoFactor ? (
            <>
              <div>
                <label htmlFor="login" className="sr-only">Identifiant</label>
                <input
                  id="login"
                  name="login"
                  type="text"
                  required
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Identifiant"
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Mot de passe</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Mot de passe"
                  disabled={loading}
                />
              </div>
            </>
          ) : (
            <div>
              <label htmlFor="twoFactorCode" className="sr-only">Code de vérification</label>
              <input
                id="twoFactorCode"
                name="twoFactorCode"
                type="text"
                required
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Code de vérification"
                disabled={loading}
              />
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Chargement...' : (showTwoFactor ? 'Vérifier' : 'Se connecter')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin; 