import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import TeachersList from './manager/TeachersList';
import MessagesSection from './manager/MessagesSection';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { useNotification } from '../contexts/NotificationContext';

// Ajouter le composant TeacherModal
const TeacherModal = ({ onClose, setError }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    speciality: 'mathematics',
    level: ['college']
  });
  const [isLoading, setIsLoading] = useState(false);
  const { darkMode } = useTheme();

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
    <div 
      className={`fixed inset-0 z-50 overflow-y-auto`}
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay avec effet de flou */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
        onClick={onClose}
      />
      
      {/* Container pour centrer la modale */}
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        {/* Modale */}
        <div 
          className={`
            relative transform overflow-hidden rounded-2xl 
            ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}
            border ${darkMode ? 'border-gray-700' : 'border-gray-200'}
            p-8 text-left shadow-xl transition-all
            w-full max-w-md
            animate-modal-appear
          `}
        >
          {/* En-tête */}
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]`}>
              Inviter un professeur
            </h2>
            <button 
              onClick={onClose}
              className={`
                rounded-full p-1.5
                text-gray-400 hover:text-gray-500
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                transition-colors duration-200
              `}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Prénom
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className={`
                  w-full px-4 py-2.5
                  ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}
                  rounded-lg
                  focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                  transition-all duration-200
                  placeholder-gray-400
                `}
                required
                placeholder="Jean"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Nom
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className={`
                  w-full px-4 py-2.5
                  ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}
                  rounded-lg
                  focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                  transition-all duration-200
                  placeholder-gray-400
                `}
                required
                placeholder="Dupont"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`
                  w-full px-4 py-2.5
                  ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}
                  rounded-lg
                  focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                  transition-all duration-200
                  placeholder-gray-400
                `}
                required
                placeholder="jean.dupont@example.com"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Spécialité
              </label>
              <select
                value={formData.speciality}
                onChange={(e) => setFormData({ ...formData, speciality: e.target.value })}
                className={`
                  w-full px-4 py-2.5
                  ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}
                  rounded-lg
                  focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                  transition-all duration-200
                `}
              >
                <option value="mathematics">Mathématiques</option>
                <option value="physics">Physique</option>
                <option value="chemistry">Chimie</option>
                <option value="biology">Biologie</option>
                <option value="computer_science">Informatique</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Niveaux d'enseignement
              </label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'college', label: 'Collège' },
                  { id: 'lycee', label: 'Lycée' },
                  { id: 'superieur', label: 'Supérieur' },
                  { id: 'adulte', label: 'Adulte' }
                ].map(({ id, label }) => (
                  <label
                    key={id}
                    className={`
                      flex items-center space-x-2 p-3
                      ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'}
                      border ${darkMode ? 'border-gray-700' : 'border-gray-200'}
                      rounded-lg cursor-pointer
                      transition-colors duration-200
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={formData.level.includes(id)}
                      onChange={(e) => {
                        const newLevel = e.target.checked
                          ? [...formData.level, id]
                          : formData.level.filter(l => l !== id);
                        setFormData({ ...formData, level: newLevel });
                      }}
                      className="
                        h-4 w-4 text-indigo-600
                        focus:ring-indigo-500 border-gray-300
                        rounded transition-colors duration-200
                      "
                    />
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className={`
                  px-4 py-2 rounded-lg
                  ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}
                  text-sm font-medium
                  transition-colors duration-200
                `}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`
                  px-4 py-2 rounded-lg
                  bg-indigo-600 hover:bg-indigo-700
                  text-white text-sm font-medium
                  transition-colors duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center space-x-2
                `}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Envoi en cours...</span>
                  </>
                ) : (
                  <span>Envoyer l'invitation</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem('user'));
  const { darkMode, toggleTheme } = useTheme();
  const { user: authUser } = useAuth();
  const { socket, isConnected } = useSocket();
  const { addNotification } = useNotification();

  const [activeSection, setActiveSection] = useState('teachers');
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [error, setError] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [teachers, setTeachers] = useState([]);

  // Charger toutes les données au démarrage
  useEffect(() => {
    const loadAllData = async () => {
      console.log('📥 Chargement initial des données...');
      
      try {
        // Charger les professeurs
        const teachersResponse = await axios.get('http://localhost:5000/api/manager/my-teachers', {
          headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
        });
        setTeachers(teachersResponse.data);
        console.log('👥 Professeurs chargés:', teachersResponse.data);

        // Notification de succès pour les professeurs
        addNotification({
          title: 'Données chargées',
          message: 'Les données principales ont été synchronisées',
          type: 'success'
        });
      } catch (error) {
        console.error('❌ Erreur lors du chargement des professeurs:', error);
        addNotification({
          title: 'Erreur',
          message: 'Impossible de charger la liste des professeurs',
          type: 'error'
        });
      }
    };

    if (isConnected) {
      loadAllData();
    }
  }, [isConnected, addNotification]);

  // Gestion des événements socket
  React.useEffect(() => {
    if (!socket) return;

    // Écouter les nouveaux messages
    socket.on('new_message', (data) => {
      const { message, channelId } = data;
      
      // Vérifier si le message n'est pas de l'utilisateur actuel
      if (message.senderId !== user.userId) {
        // Récupérer les infos de l'expéditeur
        const senderName = message.sender?.firstName || 'Quelqu\'un';
        
        addNotification({
          title: 'Nouveau message',
          message: `${senderName} vous a envoyé un message : ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
          type: 'info'
        });
      }
    });

    // Nettoyer les écouteurs
    return () => {
      socket.off('new_message');
    };
  }, [socket, user.userId, addNotification]);

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

  // Log de l'état de la connexion
  React.useEffect(() => {
    console.log('🔌 État de la connexion socket (ManagerDashboard):', isConnected);
  }, [isConnected]);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-200`}>
      {/* Navbar moderne */}
      <nav className={`${darkMode ? 'bg-gray-800' : 'bg-white'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} transition-colors duration-200`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`
                  p-2 rounded-lg
                  text-gray-400 hover:text-gray-500
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                  transition-colors duration-200
                `}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-6 w-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                  />
                </svg>
              </button>
              <div className="flex-shrink-0 flex items-center">
                <span className={`text-2xl font-bold ${
                  darkMode 
                    ? 'bg-gradient-to-r from-blue-400 via-pink-400 to-purple-400'
                    : 'bg-gradient-to-r from-blue-600 via-pink-600 to-purple-600'
                } bg-clip-text text-transparent drop-shadow-sm`}>
                  CyberMathIA
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => toggleTheme()}
                className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 text-yellow-300' : 'bg-gray-100 text-gray-500'} hover:opacity-80 transition-all duration-200`}
                aria-label={darkMode ? 'Activer le mode clair' : 'Activer le mode sombre'}
              >
                {darkMode ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </button>
              <div className="flex items-center space-x-3">
                <div className={`h-8 w-8 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center`}>
                  <svg className={`h-5 w-5 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {authUser?.firstName} {authUser?.lastName}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium ${
                  darkMode 
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

      {/* Menu overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/10 backdrop-blur-sm z-40 flex items-center justify-center"
            onClick={() => setIsMenuOpen(false)}
          >
            {/* Menu content */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-80 rounded-xl overflow-hidden bg-transparent"
              onClick={e => e.stopPropagation()}
            >
              <div className="py-4 flex flex-col items-center space-y-4">
                <button
                  onClick={() => {
                    setActiveSection('teachers');
                    setIsMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-center space-x-4 px-6 py-4 rounded-xl
                    group relative text-lg transition-all duration-500
                    ${activeSection === 'teachers'
                      ? darkMode 
                        ? 'bg-cyan-500/10 text-white'
                        : 'bg-cyan-500/5 text-gray-900'
                      : darkMode
                        ? 'text-gray-200 hover:text-white hover:bg-gray-800'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    }
                  `}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" 
                    className={`h-7 w-7 transition-all duration-500 ${
                      activeSection === 'teachers'
                        ? darkMode
                          ? '[filter:drop-shadow(0_0_8px_rgba(103,232,249,0.5))_drop-shadow(0_0_12px_rgba(34,211,238,0.4))_drop-shadow(0_0_16px_rgba(6,182,212,0.3))]'
                          : '[filter:drop-shadow(0_0_8px_rgba(34,211,238,0.5))_drop-shadow(0_0_12px_rgba(8,145,178,0.4))_drop-shadow(0_0_16px_rgba(14,116,144,0.3))]'
                        : darkMode
                          ? 'group-hover:[filter:drop-shadow(0_0_8px_rgba(103,232,249,0.5))_drop-shadow(0_0_12px_rgba(34,211,238,0.4))_drop-shadow(0_0_16px_rgba(6,182,212,0.3))]'
                          : 'group-hover:[filter:drop-shadow(0_0_8px_rgba(34,211,238,0.5))_drop-shadow(0_0_12px_rgba(8,145,178,0.4))_drop-shadow(0_0_16px_rgba(14,116,144,0.3))]'
                    }`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className={`font-medium transition-all duration-500 ${
                    activeSection === 'teachers'
                      ? darkMode
                        ? '[filter:drop-shadow(0_0_8px_rgba(103,232,249,0.5))_drop-shadow(0_0_12px_rgba(34,211,238,0.4))_drop-shadow(0_0_16px_rgba(6,182,212,0.3))]'
                        : '[filter:drop-shadow(0_0_8px_rgba(34,211,238,0.5))_drop-shadow(0_0_12px_rgba(8,145,178,0.4))_drop-shadow(0_0_16px_rgba(14,116,144,0.3))]'
                      : darkMode
                        ? 'group-hover:[filter:drop-shadow(0_0_8px_rgba(103,232,249,0.5))_drop-shadow(0_0_12px_rgba(34,211,238,0.4))_drop-shadow(0_0_16px_rgba(6,182,212,0.3))]'
                        : 'group-hover:[filter:drop-shadow(0_0_8px_rgba(34,211,238,0.5))_drop-shadow(0_0_12px_rgba(8,145,178,0.4))_drop-shadow(0_0_16px_rgba(14,116,144,0.3))]'
                  }`}>Liste des professeurs</span>
                </button>
                <button
                  onClick={() => {
                    setActiveSection('messages');
                    setIsMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-center space-x-4 px-6 py-4 rounded-xl
                    group relative text-lg transition-all duration-500
                    ${activeSection === 'messages'
                      ? darkMode 
                        ? 'bg-cyan-500/10 text-white'
                        : 'bg-cyan-500/5 text-gray-900'
                      : darkMode
                        ? 'text-gray-200 hover:text-white hover:bg-gray-800'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    }
                  `}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" 
                    className={`h-7 w-7 transition-all duration-500 ${
                      activeSection === 'messages'
                        ? darkMode
                          ? '[filter:drop-shadow(0_0_8px_rgba(103,232,249,0.5))_drop-shadow(0_0_12px_rgba(34,211,238,0.4))_drop-shadow(0_0_16px_rgba(6,182,212,0.3))]'
                          : '[filter:drop-shadow(0_0_8px_rgba(34,211,238,0.5))_drop-shadow(0_0_12px_rgba(8,145,178,0.4))_drop-shadow(0_0_16px_rgba(14,116,144,0.3))]'
                        : darkMode
                          ? 'group-hover:[filter:drop-shadow(0_0_8px_rgba(103,232,249,0.5))_drop-shadow(0_0_12px_rgba(34,211,238,0.4))_drop-shadow(0_0_16px_rgba(6,182,212,0.3))]'
                          : 'group-hover:[filter:drop-shadow(0_0_8px_rgba(34,211,238,0.5))_drop-shadow(0_0_12px_rgba(8,145,178,0.4))_drop-shadow(0_0_16px_rgba(14,116,144,0.3))]'
                    }`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <span className={`font-medium transition-all duration-500 ${
                    activeSection === 'messages'
                      ? darkMode
                        ? '[filter:drop-shadow(0_0_8px_rgba(103,232,249,0.5))_drop-shadow(0_0_12px_rgba(34,211,238,0.4))_drop-shadow(0_0_16px_rgba(6,182,212,0.3))]'
                        : '[filter:drop-shadow(0_0_8px_rgba(34,211,238,0.5))_drop-shadow(0_0_12px_rgba(8,145,178,0.4))_drop-shadow(0_0_16px_rgba(14,116,144,0.3))]'
                      : darkMode
                        ? 'group-hover:[filter:drop-shadow(0_0_8px_rgba(103,232,249,0.5))_drop-shadow(0_0_12px_rgba(34,211,238,0.4))_drop-shadow(0_0_16px_rgba(6,182,212,0.3))]'
                        : 'group-hover:[filter:drop-shadow(0_0_8px_rgba(34,211,238,0.5))_drop-shadow(0_0_12px_rgba(8,145,178,0.4))_drop-shadow(0_0_16px_rgba(14,116,144,0.3))]'
                  }`}>Messages</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className={`flex-1 overflow-auto transition-all duration-300 ${isMenuOpen ? 'filter blur-sm' : ''}`}>
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="animate-fadeIn">
            {activeSection === 'teachers' && (
              <>
                <TeachersList
                  onTeacherClick={handleTeacherClick}
                  isDarkMode={darkMode}
                  onInviteClick={() => setShowTeacherModal(true)}
                />
                {showTeacherModal && (
                  <TeacherModal
                    onClose={() => setShowTeacherModal(false)}
                    setError={setError}
                  />
                )}
              </>
            )}
            {activeSection === 'messages' && <MessagesSection />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;