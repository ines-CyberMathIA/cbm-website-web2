import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    login: '',
    password: '',
    twoFactorCode: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (step === 1) {
        console.log('Tentative de connexion avec:', {
          login: formData.login,
          password: formData.password
        });

        const response = await axios.post('http://localhost:5003/api/admin/login', {
          login: formData.login,
          password: formData.password
        });

        console.log('Réponse du serveur:', response.data);

        if (response.data.requireTwoFactor) {
          setStep(2);
          if (process.env.NODE_ENV === 'development' && response.data.testCode) {
            console.log('Code 2FA (dev):', response.data.testCode);
          }
        }
      } else {
        console.log('Envoi du code 2FA:', formData.twoFactorCode);
        
        const response = await axios.post('http://localhost:5003/api/admin/verify-2fa', {
          login: formData.login,
          twoFactorCode: formData.twoFactorCode
        });

        console.log('Réponse vérification 2FA:', response.data);

        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          navigate('/admin-dashboard');
        } else {
          setError('Erreur lors de la vérification du code');
        }
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      if (error.response) {
        console.error('Réponse d\'erreur:', error.response.data);
        setError(error.response.data.message || 'Erreur de connexion');
      } else if (error.request) {
        console.error('Pas de réponse reçue');
        setError('Le serveur ne répond pas');
      } else {
        console.error('Erreur de configuration:', error.message);
        setError('Erreur de configuration de la requête');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Administration CyberMathIA
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {step === 1 ? 'Connectez-vous à votre compte' : 'Entrez le code de vérification'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                {error}
              </div>
            )}

            {step === 1 ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Identifiant
                  </label>
                  <div className="mt-1">
                    <input
                      name="login"
                      type="text"
                      required
                      value={formData.login}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Mot de passe
                  </label>
                  <div className="mt-1">
                    <input
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Code de vérification
                </label>
                <p className="mt-1 text-sm text-gray-500">
                  Un code a été envoyé à votre adresse email
                </p>
                <div className="mt-1">
                  <input
                    name="twoFactorCode"
                    type="text"
                    required
                    value={formData.twoFactorCode}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500"
                    placeholder="Entrez le code à 6 chiffres"
                  />
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {step === 1 ? 'Connexion...' : 'Vérification...'}
                  </span>
                ) : (
                  step === 1 ? 'Se connecter' : 'Vérifier'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin; 