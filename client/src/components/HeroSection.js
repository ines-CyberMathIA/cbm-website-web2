import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

const HeroSection = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (custom) => ({
      opacity: 1,
      y: 0,
      transition: { delay: custom * 0.2 }
    })
  };

  // Appliquer le mode au body et sauvegarder la préférence
  useEffect(() => {
    document.body.style.backgroundColor = isDarkMode ? '#0a0b0f' : '#ffffff';
    localStorage.setItem('darkMode', isDarkMode);
  }, [isDarkMode]);

  // Récupérer la préférence au chargement
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      setIsDarkMode(savedMode === 'true');
    }
  }, []);

  const darkColors = {
    bg: 'from-[#1a1b2e] via-[#16181f] to-[#0a0b0f]',
    text: 'text-[#e0e4ff]',
    accent1: '#4a5aff',
    accent2: '#7b68ee',
    accent3: '#4158d0',
    accent4: '#8b5cf6',
  };

  const lightColors = {
    bg: 'from-[#ffffff] via-[#f8f9ff] to-[#f0f2ff]',
    text: 'text-[#1a1b2e]',
    accent1: '#6e8eff',
    accent2: '#8b9eff',
    accent3: '#7b68ee',
    accent4: '#9999ff',
  };

  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <div className={`relative min-h-screen w-full overflow-hidden ${isDarkMode ? 'bg-[#0a0b0f]' : 'bg-white'}`}>
      {/* Fond avec transition */}
      <div className={`absolute inset-0 bg-gradient-to-br ${isDarkMode ? 'from-[#1a1b2e] via-[#16181f] to-[#0a0b0f]' : 'from-white via-[#f8f9ff] to-[#f0f2ff]'} transition-colors duration-500`}>
        <div className={`absolute inset-0 bg-gradient-to-tr ${isDarkMode ? 'from-[#2d3154]/40' : 'from-[#e0e4ff]/40'} via-transparent ${isDarkMode ? 'to-[#384878]/30' : 'to-[#b8c3ff]/30'} clip-diagonal transition-colors duration-500`}></div>
      </div>

      {/* Bouton de changement de mode */}
      <motion.button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={`fixed top-8 right-8 p-3 rounded-full ${isDarkMode ? 'bg-[#e0e4ff]/10 hover:bg-[#e0e4ff]/20' : 'bg-[#1a1b2e]/10 hover:bg-[#1a1b2e]/20'} backdrop-blur-sm transition-all duration-300 z-50`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {isDarkMode ? (
          <SunIcon className="w-6 h-6 text-[#e0e4ff]" />
        ) : (
          <MoonIcon className="w-6 h-6 text-[#1a1b2e]" />
        )}
      </motion.button>

      {/* Contenu principal */}
      <div className="relative z-10 container mx-auto px-4 py-32">
        <div className="flex flex-col items-center justify-center text-center space-y-24">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={textVariants}
            custom={1}
            className="space-y-8"
          >
            <motion.h1 className={`text-8xl font-bold ${colors.text} mb-16`}>
              <motion.span className="bg-gradient-to-r from-[#00ffff] via-[#33ccff] to-[#66b3ff] bg-clip-text text-transparent">
                Cyber
              </motion.span>
              <motion.span className="bg-gradient-to-r from-[#66b3ff] via-[#9999ff] to-[#cc80ff] bg-clip-text text-transparent">
                Math
              </motion.span>
              <motion.span className="bg-gradient-to-r from-[#9999ff] to-[#cc80ff] bg-clip-text text-transparent">
                IA
              </motion.span>
            </motion.h1>

            <motion.h2
              className={`text-4xl ${colors.text} font-medium leading-relaxed max-w-5xl mx-auto`}
              variants={textVariants}
              custom={2}
            >
              votre site de{' '}
              <span className="bg-gradient-to-r from-[#00ffff] via-[#33ccff] to-[#66b3ff] bg-clip-text text-transparent">
                soutien scolaire en ligne
              </span>{' '}
              qui vous propose un{' '}
              <span className="bg-gradient-to-r from-[#66b3ff] via-[#9999ff] to-[#cc80ff] bg-clip-text text-transparent">
                accompagnement quotidien
              </span>{' '}
              et des ressources de qualité pour faire{' '}
              <span className="bg-gradient-to-r from-[#9999ff] to-[#cc80ff] bg-clip-text text-transparent">
                décoller vos moyennes
              </span>
            </motion.h2>
          </motion.div>

          {/* Boutons d'action */}
          <motion.div 
            className="flex justify-center gap-16 mt-24"
            initial="hidden"
            animate="visible"
            variants={textVariants}
            custom={3}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/login"
                className="group relative px-12 py-5"
              >
                <span className={`relative z-10 ${colors.text} font-medium text-lg`}>
                  Commencer l'expérience
                </span>
                <div className={`absolute inset-0 bg-gradient-to-r ${isDarkMode ? 'from-[#6e8eff]/90' : 'from-[#6e8eff]/90'} to-[#8b9eff]/90 rounded-full transform group-hover:scale-110 transition-transform duration-300`}></div>
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${isDarkMode ? 'from-[#6e8eff]' : 'from-[#6e8eff]'} to-[#8b9eff] rounded-full opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300`}></div>
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/register"
                className="group relative px-12 py-5"
              >
                <span className={`relative z-10 ${isDarkMode ? 'text-[#b8c3ff]' : 'text-[#1a1b2e]'} font-medium text-lg group-hover:${colors.text} transition-colors duration-300`}>
                  En savoir plus
                </span>
                <div className={`absolute inset-0 border-2 border-[${isDarkMode ? '#8b9eff' : '#6e8eff'}] rounded-full transform group-hover:scale-110 group-hover:border-opacity-100 transition-all duration-300`}></div>
                <div className={`absolute inset-0 bg-gradient-to-r ${isDarkMode ? 'from-[#6e8eff]/90' : 'from-[#6e8eff]/90'} to-[#8b9eff]/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;