import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const { darkMode, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full z-50 ${isScrolled ? (darkMode ? 'bg-[#1a1b2e]/80 backdrop-blur-lg' : 'bg-white/80 backdrop-blur-lg') : 'bg-transparent'} transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className={`flex items-center space-x-2 group ${darkMode ? 'text-[#f0f0f0]' : 'text-gray-800'} text-2xl font-bold`}>
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity duration-300">
              CyberMathIA
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            {/* Bouton Dark Mode */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className={`p-2 rounded-full ${
                darkMode 
                  ? 'bg-[#2d3154] text-yellow-300 hover:bg-[#3d4174]' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } transition-colors duration-300`}
              aria-label={darkMode ? 'Activer le mode clair' : 'Activer le mode sombre'}
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </motion.button>

            {!isLoginPage && (
              <Link to="/login">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-lg ${
                    darkMode
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                  } transition-colors duration-300`}
                >
                  Connexion
                </motion.button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
