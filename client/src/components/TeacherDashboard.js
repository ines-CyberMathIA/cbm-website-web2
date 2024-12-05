import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Calendar from './teacher/Calendar';
import StudentsList from './teacher/StudentsList';
import CourseLibrary from './teacher/CourseLibrary';
import SessionReports from './teacher/SessionReports';
import Messages from './teacher/Messages';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem('user'));
  const [activeSection, setActiveSection] = useState('calendar');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    if (!user || user.role !== 'teacher') {
      navigate('/login');
    }
  }, [isDarkMode, navigate, user]);

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

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#0f172a]' : 'bg-gray-50'} transition-colors duration-300`}>
      {/* Navbar */}
      <nav className={`${
        isDarkMode 
          ? 'bg-[#1e293b] border-b border-blue-900/30 shadow-lg shadow-blue-500/10' 
          : 'bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-lg'
      } sticky top-0 z-50 transition-all duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                  CyberMathIA
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-lg ${
                  isDarkMode
                    ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-800/40'
                    : 'bg-blue-50 text-blue-500 hover:bg-blue-100'
                } transition-colors duration-200`}
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
              <span className={`${isDarkMode ? 'text-blue-100' : 'text-gray-700'} font-medium`}>
                {user?.firstName} {user?.lastName}
              </span>
              <button
                onClick={() => {
                  sessionStorage.clear();
                  navigate('/login');
                }}
                className={`px-4 py-2 rounded-lg ${
                  isDarkMode
                    ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30'
                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                } transition-colors duration-200`}
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Toggle Button - Now outside the sidebar */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`fixed left-0 top-1/2 transform -translate-y-1/2 p-2 rounded-r-lg shadow-lg z-50 transition-all duration-300 ${
            isDarkMode
              ? 'bg-[#1e293b] text-blue-400 hover:bg-[#2d3a4f]'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          } ${isSidebarOpen ? 'left-[280px]' : 'left-0'}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isSidebarOpen ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
            />
          </svg>
        </button>

        <AnimatePresence initial={false}>
          {isSidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`fixed left-0 top-16 h-[calc(100vh-4rem)] ${
                isDarkMode
                  ? 'bg-[#1e293b] border-r border-blue-900/30'
                  : 'bg-white border-r border-gray-200'
              } overflow-hidden transition-colors duration-300`}
            >
              <div className="flex flex-col h-full py-6 space-y-8">
                {menuItems.map((item) => (
                  <motion.button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full flex items-center space-x-4 p-4 text-lg font-medium rounded-xl transition-all ${
                      activeSection === item.id
                        ? isDarkMode
                          ? 'bg-blue-900/30 text-blue-400'
                          : 'bg-blue-50 text-blue-600'
                        : isDarkMode
                          ? 'text-gray-300 hover:bg-blue-900/20'
                          : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                    <span>{item.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <motion.main
          animate={{ marginLeft: isSidebarOpen ? "280px" : "0px" }}
          transition={{ duration: 0.3 }}
          className="flex-1 p-6"
        >
          {renderContent()}
        </motion.main>
      </div>
    </div>
  );
};

export default TeacherDashboard;