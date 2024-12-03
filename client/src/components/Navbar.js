import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Navbar = ({ isDarkMode }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className="fixed w-full z-50 bg-transparent transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className={`flex items-center space-x-2 group ${isDarkMode ? 'text-[#f0f0f0]' : 'text-gray-800'} text-2xl font-bold`}>
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity duration-300">
              CyberMathIA
            </span>
          </Link>

          <div className="flex items-center">
            <Link
              to="/login"
              className="px-6 py-2.5 relative group overflow-hidden rounded-lg bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:shadow-lg transition-all duration-300"
            >
              <span className="relative text-white z-10 font-medium">Connexion</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
