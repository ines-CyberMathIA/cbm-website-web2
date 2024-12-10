import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TeachersList from './manager/TeachersList';
import MessagesSection from './manager/MessagesSection';

// Ajouter le composant TeacherModal
const TeacherModal = ({ onClose, setError, isDarkMode }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    speciality: 'mathematics',
    level: ['college']
  });
  const [isLoading, setIsLoading] = useState(false);

  const showNotification = (message, type = 'error') => {
    const notification = document.createElement('div');
    notification.className = `
      fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50
      transform transition-all duration-500 ease-out
      flex items-center space-x-2
      animate-slide-in-right
      ${type === 'error' ? 'bg-red-500' : 
        type === 'warning' ? 'bg-yellow-500' : 
        'bg-green-500'} text-white
    `;
    
    notification.innerHTML = `
      <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
          d="${type === 'error' ? 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' : 
             type === 'warning' ? 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' :
             'M5 13l4 4L19 7'}"/>
      </svg>
      <span class="font-medium">${message}</span>
    `;
    
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('animate-slide-out-right');
      setTimeout(() => {
        notification.remove();
      }, 500);
    }, 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error('Token manquant - veuillez vous reconnecter');
      }

      await axios.post(
        'http://localhost:5000/api/manager/create-teacher',
        formData,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      onClose();
      showNotification('Invitation envoyée avec succès', 'success');

    } catch (error) {
      if (error.response?.data?.type === 'NAME_EXISTS') {
        onClose();
        showNotification(
          `Le professeur ${formData.firstName} ${formData.lastName} est déjà enregistré par un autre manager`,
          'warning'
        );
      } else if (error.response?.data?.type === 'EMAIL_EXISTS') {
        onClose();
        showNotification(
          `L'adresse email ${formData.email} est déjà utilisée`,
          'error'
        );
      } else if (error.response?.data?.type === 'PENDING_INVITATION') {
        onClose();
        showNotification(
          `Une invitation est déjà en attente pour l'adresse ${formData.email}`,
          'warning'
        );
      } else {
        setError(error.response?.data?.message || 'Erreur lors de l\'envoi de l\'invitation');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-200`}>
      <div className={`bg-${isDarkMode ? 'gray-900' : 'gray-50'} ${isDarkMode ? 'text-white' : 'text-gray-900'} backdrop-blur-lg border border-${isDarkMode ? 'gray-700' : 'gray-200'} rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]`}>
            Inviter un professeur
          </h2>
          <button 
            onClick={onClose}
            className={`text-${isDarkMode ? 'gray-300' : 'gray-500'} hover:text-${isDarkMode ? 'gray-200' : 'gray-700'} transition-colors`}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Prénom</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className={`w-full px-4 py-2 border border-${isDarkMode ? 'gray-700' : 'gray-300'} rounded-lg focus:ring-2 focus:ring-${isDarkMode ? 'blue-500' : 'indigo-500'} focus:border-transparent transition-all`}
              required
              placeholder="Jean"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Nom</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className={`w-full px-4 py-2 border border-${isDarkMode ? 'gray-700' : 'gray-300'} rounded-lg focus:ring-2 focus:ring-${isDarkMode ? 'blue-500' : 'indigo-500'} focus:border-transparent transition-all`}
              required
              placeholder="Dupont"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full px-4 py-2 border border-${isDarkMode ? 'gray-700' : 'gray-300'} rounded-lg focus:ring-2 focus:ring-${isDarkMode ? 'blue-500' : 'indigo-500'} focus:border-transparent transition-all`}
              required
              placeholder="jean.dupont@example.com"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Spécialité</label>
            <select
              value={formData.speciality}
              onChange={(e) => setFormData({ ...formData, speciality: e.target.value })}
              className={`w-full px-4 py-2 border border-${isDarkMode ? 'gray-700' : 'gray-300'} rounded-lg focus:ring-2 focus:ring-${isDarkMode ? 'blue-500' : 'indigo-500'} focus:border-transparent transition-all`}
            >
              <option value="mathematics">Mathématiques</option>
              <option value="physics">Physique</option>
              <option value="chemistry">Chimie</option>
              <option value="biology">Biologie</option>
              <option value="computer_science">Informatique</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Niveaux d'enseignement</label>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'college', label: 'Collège' },
                { id: 'lycee', label: 'Lycée' },
                { id: 'superieur', label: 'Supérieur' },
                { id: 'adulte', label: 'Adulte' }
              ].map(({ id, label }) => (
                <label key={id} className={`flex items-center space-x-3 p-3 border rounded-lg hover:bg-${isDarkMode ? 'gray-700' : 'gray-100'} cursor-pointer transition-colors`}>
                  <input
                    type="checkbox"
                    checked={formData.level.includes(id)}
                    onChange={(e) => {
                      const newLevels = e.target.checked
                        ? [...formData.level, id]
                        : formData.level.filter(l => l !== id);
                      setFormData({ ...formData, level: newLevels });
                    }}
                    className={`h-4 w-4 text-${isDarkMode ? 'blue-500' : 'indigo-600'} focus:ring-2 focus:ring-${isDarkMode ? 'blue-500' : 'indigo-500'} border-${isDarkMode ? 'gray-700' : 'gray-300'} rounded transition-colors`}
                  />
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 border border-${isDarkMode ? 'gray-700' : 'gray-300'} rounded-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} hover:bg-${isDarkMode ? 'gray-700' : 'gray-100'} transition-colors`}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 ${isDarkMode ? 'bg-blue-600' : 'bg-indigo-600'} text-white rounded-lg
                hover:${isDarkMode ? 'bg-blue-700' : 'bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${isDarkMode ? 'blue-500' : 'indigo-500'}
                transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Envoi en cours...
                </div>
              ) : 'Inviter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem('user'));
  const [activeSection, setActiveSection] = useState('teachers');
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [error, setError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Vérification de l'authentification
  React.useEffect(() => {
    if (!user || user.role !== 'manager') {
      navigate('/login');
    }
  }, [navigate, user]);

  // Fonction de déconnexion sécurisée
  const handleLogout = (e) => {
    e.preventDefault();
    try {
      // Nettoyer la session
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      sessionStorage.clear();
      
      // Rediriger vers la page de connexion
      window.location.href = '/login';
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  // Gestion de la sélection d'un professeur
  const handleTeacherClick = (teacher) => {
    setSelectedTeacher(teacher);
    setActiveSection('teacherDetails');
  };

  // Composant pour afficher les détails d'un professeur
  const TeacherDetails = () => {
    const [availabilities, setAvailabilities] = useState([]);
    
    useEffect(() => {
      const fetchAvailabilities = async () => {
        if (!selectedTeacher) return;
        
        try {
          const token = sessionStorage.getItem('token');
          if (!token) {
            throw new Error('Token manquant - veuillez vous reconnecter');
          }

          const response = await axios.get(
            `http://localhost:5000/api/manager/teacher/${selectedTeacher._id}/availabilities`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          setAvailabilities(response.data);
        } catch (error) {
          console.error('Erreur lors du chargement des disponibilités:', error);
          if (error.message.includes('Token manquant')) {
            window.location.href = '/login';
          }
        }
      };

      fetchAvailabilities();
    }, [selectedTeacher]);

    if (!selectedTeacher) return null;

    // ... reste du code de TeacherDetails ...
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-200`}>
      {/* Navbar moderne */}
      <nav className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} transition-colors duration-200`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className={`text-2xl font-bold ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-500'
                    : 'bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600'
                } bg-clip-text text-transparent drop-shadow-sm`}>
                  CyberMathIA
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-yellow-300' : 'bg-gray-100 text-gray-500'} hover:opacity-80 transition-all duration-200`}
              >
                {isDarkMode ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              <div className="flex items-center space-x-3">
                <div className={`h-8 w-8 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center`}>
                  <svg className={`h-5 w-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {user?.firstName} {user?.lastName}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium ${
                  isDarkMode 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } transition-colors duration-200`}
              >
                <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar moderne */}
        <div className={`w-64 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} transition-colors duration-200`}>
          <div className="p-4">
            <button
              onClick={() => setShowTeacherModal(true)}
              className={`w-full flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium ${
                isDarkMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } transition-colors duration-200 shadow-sm`}
            >
              <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
              Inviter un professeur
            </button>
          </div>

          <nav className="mt-4 px-2">
            <button
              onClick={() => {
                setActiveSection('teachers');
                setSelectedTeacher(null);
              }}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                activeSection === 'teachers'
                  ? isDarkMode
                    ? 'bg-gray-700 text-white'
                    : 'bg-blue-50 text-blue-700'
                  : isDarkMode
                    ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
              Liste des professeurs
            </button>
            <button
              onClick={() => {
                setActiveSection('messages');
                setSelectedTeacher(null);
              }}
              className={`w-full mt-2 flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                activeSection === 'messages'
                  ? isDarkMode
                    ? 'bg-gray-700 text-white'
                    : 'bg-blue-50 text-blue-700'
                  : isDarkMode
                    ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Messages
            </button>
          </nav>
        </div>

        {/* Contenu principal */}
        <div className={`flex-1 overflow-auto ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-200`}>
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="animate-fadeIn">
              {activeSection === 'teachers' && (
                <TeachersList onTeacherClick={handleTeacherClick} isDarkMode={isDarkMode} />
              )}
              {activeSection === 'teacherDetails' && <TeacherDetails isDarkMode={isDarkMode} />}
              {activeSection === 'messages' && <MessagesSection isDarkMode={isDarkMode} />}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showTeacherModal && (
        <TeacherModal
          onClose={() => setShowTeacherModal(false)}
          setError={setError}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
};

export default ManagerDashboard; 