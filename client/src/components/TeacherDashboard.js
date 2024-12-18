import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Calendar from './teacher/Calendar';
import StudentsList from './teacher/StudentsList';
import CourseLibrary from './teacher/CourseLibrary';
import SessionReports from './teacher/SessionReports';
import Messages from './teacher/Messages';
import { useSocket } from '../hooks/useSocket';
import { useNotification } from '../contexts/NotificationContext';
import { useTeacherSocket } from '../hooks/useTeacherSocket';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem('user'));
  const [activeSection, setActiveSection] = useState('calendar');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });
  const { socket, isConnected } = useTeacherSocket();
  const { addNotification } = useNotification();

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    if (!user || user.role !== 'teacher') {
      navigate('/login');
    }
  }, [isDarkMode, navigate, user]);

  // Log de l'état de la connexion
  useEffect(() => {
    console.log('🔌 État de la connexion socket (TeacherDashboard):', isConnected);
  }, [isConnected]);

  // Écouter les notifications globales
  useEffect(() => {
    if (!socket) {
      console.log('⚠️ Socket non initialisé dans TeacherDashboard');
      return;
    }

    console.log('👂 Configuration des écouteurs globaux (TeacherDashboard)');

    // Écouter les nouveaux messages même hors de MessagesSection
    socket.on('new_message', ({ message }) => {
      console.log('📨 Message reçu dans TeacherDashboard:', message);
      addNotification({
        title: `Nouveau message de ${message.sender?.firstName || 'Quelqu\'un'}`,
        message: message.content.substring(0, 50) + (message.content.length > 50 ? '...' : ''),
        type: 'info'
      });
    });

    return () => {
      console.log('🧹 Nettoyage des écouteurs (TeacherDashboard)');
      socket.off('new_message');
    };
  }, [socket, addNotification]);

  // Test de notification au montage
  useEffect(() => {
    console.log('🔌 Test de notification...');
    addNotification({
      title: 'Bienvenue',
      message: 'Vous êtes connecté au tableau de bord professeur',
      type: 'success'
    });
  }, []); // Uniquement au montage

  const menuItems = [
    { 
      id: 'calendar', 
      icon: 'M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z', 
      label: 'Calendrier' 
    },
    { id: 'students', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', label: 'Mes élèves' },
    { id: 'courses', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', label: 'Bibliothèque' },
    { id: 'reports', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', label: 'Rapports' },
    { id: 'messages', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z', label: 'Messages' }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'calendar': return <Calendar isDarkMode={isDarkMode} />;
      case 'students': return <StudentsList isDarkMode={isDarkMode} />;
      case 'courses': return <CourseLibrary isDarkMode={isDarkMode} />;
      case 'reports': return <SessionReports isDarkMode={isDarkMode} />;
      case 'messages': return <Messages isDarkMode={isDarkMode} />;
      default: return <Calendar isDarkMode={isDarkMode} />;
    }
  };

  const handleLogout = () => {
    try {
      // Nettoyer le localStorage et sessionStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');

      // Utiliser un setTimeout pour s'assurer que le nettoyage est terminé
      setTimeout(() => {
        // Rediriger vers la page de connexion
        navigate('/login', { replace: true });
      }, 0);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Indicateur de connexion */}
      <div className={`fixed top-4 right-4 w-3 h-3 rounded-full ${
        isConnected ? 'bg-green-500' : 'bg-red-500'
      }`} />

      {/* Header avec bouton menu */}
      <header className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Partie gauche */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsMenuOpen(true)}
                className={`p-2 rounded-lg ${
                  isDarkMode 
                    ? 'hover:bg-gray-700 text-gray-200' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              {/* Logo avec gradient */}
              <div className="flex items-center flex-shrink-0">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  CyberMathIA
                </h1>
              </div>
            </div>

            {/* Partie droite */}
            <div className="flex items-center space-x-6">
              {/* Nom du professeur */}
              <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                {user?.firstName} {user?.lastName}
              </span>

              {/* Toggle Dark Mode */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-lg ${
                  isDarkMode 
                    ? 'hover:bg-gray-700 text-gray-200' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {/* Bouton déconnexion */}
              <button
                onClick={handleLogout}
                className={`p-2 rounded-lg ${
                  isDarkMode 
                    ? 'hover:bg-gray-700 text-gray-200' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
                aria-label="Se déconnecter"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Menu modal */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Overlay avec flou */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`fixed inset-0 backdrop-blur-md z-40 ${
                isDarkMode ? 'bg-black/30' : 'bg-black/10'
              }`}
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            >
              <div className="relative flex flex-col items-center space-y-4 pointer-events-auto">
                {menuItems.map((item) => (
                  <motion.button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id);
                      setIsMenuOpen(false);
                    }}
                    className="relative group"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {/* Effet de lumière adapté au mode */}
                    <div className={`
                      absolute inset-0 rounded-lg blur-xl 
                      group-hover:opacity-100 opacity-0 
                      transition-opacity duration-300
                      ${isDarkMode 
                        ? 'bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30'
                        : 'bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20'
                      }
                    `} />
                    
                    {/* Contenu du bouton */}
                    <div className={`
                      relative flex items-center space-x-4 px-8 py-4 rounded-lg
                      ${activeSection === item.id
                        ? isDarkMode 
                          ? 'text-white bg-white/20'
                          : 'text-gray-900 bg-black/10'
                        : isDarkMode
                          ? 'text-white/90 hover:text-white'
                          : 'text-gray-700 hover:text-gray-900'
                      }
                      transition-all duration-300
                    `}>
                      <svg className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-gray-700'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </svg>
                      <span className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {item.label}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Contenu principal */}
      <main className={`p-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {renderContent()}
      </main>
    </div>
  );
};

export default TeacherDashboard;