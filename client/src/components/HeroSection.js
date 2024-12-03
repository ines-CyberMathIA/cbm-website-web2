import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const HeroSection = () => {
  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.8,
        ease: [0.43, 0.13, 0.23, 0.96]
      }
    })
  };

  return (
    <div className="min-h-screen bg-[#0a0b0f] overflow-hidden relative">
      {/* Formes géométriques et effets d'arrière-plan */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Dégradé de fond principal avec plus de couleurs */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1b2e] via-[#16181f] to-[#0a0b0f]">
          {/* Effet de coupure diagonal */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#2d3154]/40 via-transparent to-[#384878]/30 clip-diagonal"></div>
        </div>
        
        {/* Formes géométriques avec blur plus prononcé */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-[#4a5aff]/30 to-[#7b68ee]/30 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-0 right-0 w-3/4 h-3/4 bg-gradient-to-tl from-[#4158d0]/30 to-[#8b5cf6]/30 rounded-full blur-[120px]"
        />

        {/* Formes géométriques plus visibles */}
        <div className="absolute top-1/4 left-1/4 w-48 h-48">
          <div className="absolute inset-0 border-2 border-[#4a5aff]/40 rounded-full transform rotate-45"></div>
          <div className="absolute inset-4 border-2 border-[#7b68ee]/30 rounded-full transform -rotate-45"></div>
        </div>
        
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64">
          <div className="absolute inset-0 border-2 border-[#4158d0]/40 transform rotate-12">
            <div className="absolute inset-0 border-2 border-[#8b5cf6]/30 transform rotate-45"></div>
          </div>
        </div>

        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-1/3 right-1/3 w-96 h-96"
        >
          <div className="absolute inset-0 border-t-2 border-r-2 border-[#4a5aff]/40 rounded-full"></div>
          <div className="absolute inset-8 border-b-2 border-l-2 border-[#7b68ee]/30 rounded-full"></div>
        </motion.div>

        {/* Lignes diagonales avec dégradé plus visible */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-0.5 h-full bg-gradient-to-b from-[#4a5aff]/50 via-[#7b68ee]/30 to-transparent transform -rotate-45"></div>
          <div className="absolute top-0 right-1/4 w-0.5 h-full bg-gradient-to-b from-[#4158d0]/50 via-[#8b5cf6]/30 to-transparent transform rotate-45"></div>
        </div>

        {/* Effet de grille avec points plus visibles */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(74, 90, 255, 0.15) 1px, transparent 0)',
          backgroundSize: '48px 48px'
        }}></div>

        {/* Nouveaux effets de lumière */}
        <div className="absolute top-1/2 left-1/2 w-96 h-96 -translate-x-1/2 -translate-y-1/2">
          <div className="absolute inset-0 bg-gradient-to-r from-[#4a5aff]/10 via-[#7b68ee]/5 to-transparent blur-3xl transform rotate-45"></div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-48">
        <div className="text-center space-y-32">
          {/* Titre principal avec animation lettre par lettre */}
          <div className="space-y-16">
            <motion.div className="overflow-hidden mb-12">
              <motion.h1 
                className="text-8xl font-bold tracking-tight mb-8"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.1
                    }
                  }
                }}
              >
                <motion.span 
                  className="inline-block bg-gradient-to-r from-[#00ffff] via-[#33ccff] to-[#66b3ff] bg-clip-text text-transparent"
                  variants={textVariants}
                  custom={0}
                >
                  Cyber
                </motion.span>
                <motion.span 
                  className="inline-block bg-gradient-to-r from-[#66b3ff] via-[#9999ff] to-[#cc80ff] bg-clip-text text-transparent ml-2"
                  variants={textVariants}
                  custom={1}
                >
                  MathIA
                </motion.span>
              </motion.h1>
            </motion.div>
            <motion.p 
              className="text-2xl text-[#e0e4ff] max-w-3xl mx-auto leading-relaxed tracking-wide"
              initial="hidden"
              animate="visible"
              variants={textVariants}
              custom={2}
            >
              Explorez une nouvelle dimension de l'apprentissage avec notre plateforme
              <span className="bg-gradient-to-r from-[#33ccff] via-[#9999ff] to-[#cc80ff] bg-clip-text text-transparent font-medium"> alimentée par l'IA</span>
            </motion.p>
          </div>

          {/* Boutons d'action */}
          <motion.div 
            className="flex justify-center gap-12"
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
                <span className="relative z-10 text-[#e0e4ff] font-medium text-lg">
                  Commencer l'expérience
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#6e8eff]/90 to-[#8b9eff]/90 rounded-full transform group-hover:scale-110 transition-transform duration-300"></div>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6e8eff] to-[#8b9eff] rounded-full opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300"></div>
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
                <span className="relative z-10 text-[#b8c3ff] font-medium text-lg group-hover:text-[#e0e4ff] transition-colors duration-300">
                  En savoir plus
                </span>
                <div className="absolute inset-0 border-2 border-[#8b9eff] rounded-full transform group-hover:scale-110 group-hover:border-opacity-100 transition-all duration-300"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-[#6e8eff]/90 to-[#8b9eff]/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            </motion.div>
          </motion.div>

          {/* Section des caractéristiques */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-24 mt-40"
          >
            {[
              "Intelligence Artificielle Avancée",
              "Apprentissage Personnalisé",
              "Support 24/7"
            ].map((feature, index) => (
              <motion.div 
                key={index}
                className="px-8"
                variants={textVariants}
                custom={index + 4}
              >
                <p className="text-[#c7d0ff] font-medium text-xl">{feature}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;