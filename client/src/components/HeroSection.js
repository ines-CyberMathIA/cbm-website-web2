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
    bg: 'from-[#ffffff] via-[#f5f7ff] to-[#eef0ff]',
    text: 'text-[#2d3154]',
    gradients: {
      title1: 'from-[#2563eb] via-[#3b82f6] to-[#60a5fa]',
      title2: 'from-[#3b82f6] via-[#6366f1] to-[#8b5cf6]',
      title3: 'from-[#6366f1] to-[#8b5cf6]'
    }
  };

  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <div className={`relative min-h-screen w-full overflow-hidden ${isDarkMode ? 'bg-[#0a0b0f]' : 'bg-white'}`}>
      {/* Fond avec transition */}
      <div className={`absolute inset-0 bg-gradient-to-br ${isDarkMode ? 'from-[#1a1b2e] via-[#16181f] to-[#0a0b0f]' : 'from-[#ffffff] via-[#f5f7ff] to-[#eef0ff]'} transition-colors duration-500`}>
        <div className={`absolute inset-0 bg-gradient-to-tr ${isDarkMode ? 'from-[#2d3154]/40' : 'from-[#e0e4ff]/40'} via-transparent ${isDarkMode ? 'to-[#384878]/30' : 'to-[#b8c3ff]/30'} clip-diagonal transition-colors duration-500`}></div>
      </div>

      {/* Formes cyberpunk en arrière-plan */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Étoiles scintillantes */}
        <div className="absolute top-0 left-0 w-full h-full">
          {isDarkMode ? (
            [...Array(70)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0.1 }}
                animate={{ opacity: [0.1, 0.8, 0.1] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: "easeInOut"
                }}
                className={`absolute w-1 h-1 ${
                  isDarkMode ? 'bg-white' : 'bg-gray-800'
                }`}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
                }}
              />
            ))
          ) : (
            [...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0.8 }}
                animate={{ 
                  scale: [0.8, 1.1, 0.8],
                  y: [0, -15, 0]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
                className={`absolute rounded-full ${
                  i % 3 === 0 ? 'bg-blue-200' :
                  i % 3 === 1 ? 'bg-purple-200' :
                  'bg-pink-200'
                } mix-blend-multiply`}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: `${Math.random() * 20 + 10}px`,
                  height: `${Math.random() * 20 + 10}px`,
                  opacity: 0.4
                }}
              />
            ))
          )}
        </div>

        {/* Formes géométriques cyberpunk */}
        <motion.div
          className={`absolute top-20 right-20 w-40 h-40 ${
            isDarkMode 
              ? 'border-cyan-500 border-2 opacity-20' 
              : 'bg-gradient-to-br from-blue-300/30 to-cyan-300/30'
          }`}
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{
            clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
          }}
        />

        <motion.div
          className={`absolute bottom-40 left-20 w-60 h-60 ${
            isDarkMode 
              ? 'border-purple-500 border-2 opacity-20'
              : 'bg-gradient-to-br from-purple-300/30 to-pink-300/30'
          }`}
          initial={{ rotate: 45 }}
          animate={{ rotate: 405 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          style={{
            clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)'
          }}
        />

        {/* Lignes angulaires animées */}
        {isDarkMode ? (
          <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.1 }}>
            <motion.path
              d={`M0,100 L${window.innerWidth},${window.innerHeight/2}`}
              stroke="#fff"
              strokeWidth="1"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
              fill="none"
            />
            <motion.path
              d={`M${window.innerWidth},0 L0,${window.innerHeight}`}
              stroke="#fff"
              strokeWidth="1"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, delay: 1, repeat: Infinity, repeatType: "reverse" }}
              fill="none"
            />
          </svg>
        ) : (
          [...Array(3)].map((_, i) => (
            <motion.div
              key={`wave-${i}`}
              className="absolute w-full h-32 opacity-10"
              style={{
                top: `${20 + i * 30}%`,
                background: `linear-gradient(90deg, transparent, ${
                  i % 2 === 0 ? '#818cf8' : '#c084fc'
                }20, transparent)`,
                transform: `rotate(${-5 + i * 5}deg)`
              }}
              animate={{
                y: [0, 10, 0]
              }}
              transition={{
                duration: 5,
                delay: i * 0.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))
        )}

        {/* Hexagones flottants */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`hex-${i}`}
            className={`absolute w-32 h-32 ${
              isDarkMode 
                ? 'border-pink-500 border opacity-10'
                : 'bg-gradient-to-br from-indigo-300/20 to-purple-300/20'
            }`}
            initial={{ y: 0, rotate: 0 }}
            animate={{ 
              y: [0, -20, 0],
              rotate: 360
            }}
            transition={{
              y: {
                duration: 3,
                repeat: Infinity,
                delay: i * 1,
                ease: "easeInOut"
              },
              rotate: {
                duration: 20,
                repeat: Infinity,
                delay: i * 2,
                ease: "linear"
              }
            }}
            style={{
              left: `${25 + i * 25}%`,
              top: `${30 + i * 20}%`,
              clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'
            }}
          />
        ))}
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
            <motion.h1 className={`text-8xl font-bold ${isDarkMode ? 'text-[#e0e4ff]' : 'text-[#2d3154]'} mb-16`}>
              <motion.span className={`bg-gradient-to-r ${isDarkMode ? 'from-[#00ffff] via-[#33ccff] to-[#66b3ff]' : lightColors.gradients.title1} bg-clip-text text-transparent`}>
                Cyber
              </motion.span>
              <motion.span className={`bg-gradient-to-r ${isDarkMode ? 'from-[#66b3ff] via-[#9999ff] to-[#cc80ff]' : lightColors.gradients.title2} bg-clip-text text-transparent`}>
                Math
              </motion.span>
              <motion.span className={`bg-gradient-to-r ${isDarkMode ? 'from-[#9999ff] to-[#cc80ff]' : lightColors.gradients.title3} bg-clip-text text-transparent`}>
                IA
              </motion.span>
            </motion.h1>

            <motion.h2
              className={`text-4xl ${isDarkMode ? 'text-[#e0e4ff]' : 'text-[#2d3154]'} font-medium leading-relaxed max-w-5xl mx-auto`}
              variants={textVariants}
              custom={2}
            >
              votre site de{' '}
              <span className={`bg-gradient-to-r ${isDarkMode ? 'from-[#00ffff] via-[#33ccff] to-[#66b3ff]' : lightColors.gradients.title1} bg-clip-text text-transparent`}>
                soutien scolaire en ligne
              </span>{' '}
              qui vous propose un{' '}
              <span className={`bg-gradient-to-r ${isDarkMode ? 'from-[#66b3ff] via-[#9999ff] to-[#cc80ff]' : lightColors.gradients.title2} bg-clip-text text-transparent`}>
                accompagnement quotidien
              </span>{' '}
              et des ressources de qualité pour faire{' '}
              <span className={`bg-gradient-to-r ${isDarkMode ? 'from-[#9999ff] to-[#cc80ff]' : lightColors.gradients.title3} bg-clip-text text-transparent`}>
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
                <span className={`relative z-10 ${isDarkMode ? 'text-[#e0e4ff]' : 'text-[#2d3154]'} font-medium text-lg`}>
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
                <span className={`relative z-10 ${isDarkMode ? 'text-[#b8c3ff]' : 'text-[#1a1b2e]'} font-medium text-lg group-hover:${isDarkMode ? 'text-[#e0e4ff]' : 'text-[#2d3154]'} transition-colors duration-300`}>
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