import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import config from '../../config';

const Calendar = ({ isDarkMode }) => {
  const [availabilities, setAvailabilities] = useState([]);
  const [unsavedAvailabilities, setUnsavedAvailabilities] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [saveStatus, setSaveStatus] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mode, setMode] = useState('view');

  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  // Modification des horaires de 6h à 22h
  const timeSlots = Array.from({ length: 33 }, (_, i) => {
    const hour = Math.floor(i / 2) + 6;
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  });

  const getVisibleDays = () => {
    // On s'assure que la date est dans le bon fuseau horaire
    const adjustedDate = new Date(currentDate);
    adjustedDate.setHours(adjustedDate.getHours() - adjustedDate.getTimezoneOffset() / 60);
    const currentDayIndex = adjustedDate.getDay() === 0 ? 6 : adjustedDate.getDay() - 1;
    const currentDayName = days[currentDayIndex];
    
    switch (viewMode) {
      case 'day':
        return [currentDayName];
      case '3days':
        return [
          days[currentDayIndex],
          days[(currentDayIndex + 1) % 7],
          days[(currentDayIndex + 2) % 7]
        ];
      case 'week':
        return days;
      default:
        return days;
    }
  };

  const isCurrentDay = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isToday = (dayName) => {
    const today = new Date();
    const currentDayName = days[today.getDay() === 0 ? 6 : today.getDay() - 1];
    return dayName === currentDayName;
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Ajuster le premier jour pour commencer par lundi (1 = Lundi, 0 = Dimanche)
    let firstDayIndex = firstDay.getDay();
    if (firstDayIndex === 0) firstDayIndex = 7; // Si c'est dimanche (0), on le met à 7
    firstDayIndex--; // On soustrait 1 pour avoir lundi = 0
    
    const daysArray = [];
    
    // Ajouter les jours du mois précédent
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, prevMonthDays - i);
      daysArray.push({
        date: prevDate,
        isCurrentMonth: false
      });
    }
    
    // Ajouter les jours du mois en cours
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const currentDate = new Date(year, month, i);
      daysArray.push({
        date: currentDate,
        isCurrentMonth: true
      });
    }
    
    // Calculer combien de jours du mois suivant sont nécessaires pour compléter la dernière semaine
    const remainingDays = 7 - (daysArray.length % 7);
    if (remainingDays < 7) {
      for (let i = 1; i <= remainingDays; i++) {
        const nextDate = new Date(year, month + 1, i);
        daysArray.push({
          date: nextDate,
          isCurrentMonth: false
        });
      }
    }
    
    return daysArray;
  };

  const handleDayClick = (date) => {
    setCurrentDate(date);
    setViewMode('day');
  };

  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    
    return (
      <>
        {/* En-tête du mois */}
        <div className={`p-4 border-b text-center ${
          isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-800'
        }`}>
          <h2 className="text-lg font-semibold">
            {months[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
        </div>

        {/* Grille des jours */}
        <div className="flex-1 overflow-y-auto">
          <div className="h-full">
            {/* En-tête des jours de la semaine */}
            <div className="grid grid-cols-7">
              {days.map(day => (
                <div
                  key={day}
                  className={`p-2 text-center font-medium border-b border-r text-sm ${
                    isDarkMode 
                      ? 'border-gray-700 text-gray-300' 
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  {day.substring(0, 3)}
                </div>
              ))}
            </div>

            {/* Jours du mois */}
            <div className="grid grid-cols-7">
              {daysInMonth.map((day, index) => (
                <motion.div
                  key={index}
                  className={`
                    min-h-[100px] p-2 border-b border-r relative cursor-pointer
                    ${isDarkMode 
                      ? 'border-gray-700' 
                      : 'border-gray-200'
                    }
                    ${!day.isCurrentMonth 
                      ? isDarkMode 
                        ? 'bg-gray-900/30' 
                        : 'bg-gray-50'
                      : isDarkMode
                        ? 'text-gray-100'
                        : 'text-gray-800'
                    }
                    ${isCurrentDay(day.date) 
                      ? isDarkMode
                        ? 'bg-blue-800/20'
                        : 'bg-blue-50'
                      : ''
                    }
                    hover:bg-opacity-80
                  `}
                  onClick={() => handleDayClick(day.date)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className={`text-sm ${
                    isCurrentDay(day.date)
                      ? isDarkMode
                        ? 'text-blue-300'
                        : 'text-blue-600'
                      : !day.isCurrentMonth
                        ? 'text-gray-400'
                        : ''
                  }`}>
                    {day.date.getDate()}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  };

  const formatDayViewDate = (date) => {
    // S'assurer que nous utilisons une copie de la date
    const d = new Date(date);
    const dayName = days[d.getDay() === 0 ? 6 : d.getDay() - 1];
    const dayNumber = d.getDate();
    const monthName = months[d.getMonth()];
    
    return `${dayName} ${dayNumber} ${monthName}`;
  };

  const renderWeekView = () => {
    return (
      <div className="flex flex-col h-full">
        {/* En-tête des jours (fixe) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `80px repeat(${getVisibleDays().length}, 1fr)`,
          }}
          className={`${
            isDarkMode 
              ? 'bg-gray-800 border border-gray-700' 
              : 'bg-white border-gray-200'
          } border-b`}
        >
          {/* Cellule vide pour l'alignement avec les heures */}
          <div className={`p-1.5 sm:p-2 lg:p-4 border-r text-xs sm:text-sm ${
            isDarkMode ? 'border-gray-700 text-gray-200' : 'border-gray-200'
          }`}>
            {/* Laisser vide */}
          </div>
          
          {/* En-têtes des jours */}
          {getVisibleDays().map(day => {
            // Obtenir la date d'aujourd'hui
            const today = new Date();
            // Vérifier si le jour est aujourd'hui en comparant avec today au lieu de currentDate
            const isToday = day === days[today.getDay() === 0 ? 6 : today.getDay() - 1];
            
            return (
              <div
                key={day}
                className={`p-1.5 sm:p-2 lg:p-4 text-center font-medium border-r text-xs sm:text-sm lg:text-base flex flex-col items-center ${
                  isDarkMode 
                    ? 'text-gray-100 border-gray-700' 
                    : 'text-gray-800 border-gray-200'
                } ${
                  isToday  // Utiliser isToday au lieu de isCurrentDay
                    ? isDarkMode
                      ? 'bg-blue-800/40'
                      : 'bg-blue-100'
                    : ''
                }`}
              >
                <span>{day.substring(0, 3)}</span>
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {currentDate.getDate()}
                </span>
              </div>
            );
          })}
        </div>

        {/* Grille scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `80px repeat(${getVisibleDays().length}, 1fr)`,
            }}
            className="h-full"
          >
            {/* Colonne des heures */}
            <div className="border-r">
              {timeSlots.map((time) => (
                <div
                  key={time}
                  className={`p-1.5 sm:p-2 lg:p-4 text-xs sm:text-sm border-b ${
                    isDarkMode
                      ? 'border-gray-700 text-gray-300'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  {time}
                </div>
              ))}
            </div>

            {/* Colonnes des jours */}
            {getVisibleDays().map((day) => (
              <div key={day} className="border-r">
                {timeSlots.map((time) => {
                  const isAvailable = availabilities.some(
                    slot => slot.day === day && slot.time === time
                  );
                  const isUnsaved = unsavedAvailabilities.some(
                    slot => slot.day === day && slot.time === time
                  );

                  return (
                    <motion.div
                      key={`${day}-${time}`}
                      className={`
                        p-1.5 sm:p-2 lg:p-4 border-b cursor-pointer
                        ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}
                        ${isAvailable && mode === 'view' ?
                          (isDarkMode ? 'bg-green-800/40' : 'bg-green-100') :
                          ''}
                        ${isUnsaved && mode === 'delete' ?
                          (isDarkMode ? 'bg-red-800/40' : 'bg-red-100') :
                          ''}
                        hover:bg-opacity-80
                      `}
                      onClick={() => handleSlotClick(day, time)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const isSlotAvailable = (day, time) => {
    return availabilities.some(slot => slot.day === day && slot.time === time);
  };

  const isSlotSelected = (day, time) => {
    return selectedSlots.some(slot => slot.day === day && slot.time === time);
  };

  const getCourseForSlot = (day, time) => {
    return courses.find(course => course.day === day && course.time === time);
  };

  const handleSlotClick = (day, time) => {
    if (mode === 'view') return;

    if (mode === 'add') {
      setSelectedSlots(prev => {
        const isAlreadySelected = prev.some(slot => slot.day === day && slot.time === time);
        if (isAlreadySelected) {
          return prev.filter(slot => !(slot.day === day && slot.time === time));
        }
        return [...prev, { day, time }];
      });
    } else if (mode === 'delete') {
      if (isSlotAvailable(day, time)) {
        setUnsavedAvailabilities(prev => {
          const isAlreadyMarked = prev.some(slot => slot.day === day && slot.time === time);
          if (isAlreadyMarked) {
            return prev.filter(slot => !(slot.day === day && slot.time === time));
          }
          return [...prev, { day, time }];
        });
      }
    }
  };

  const addMinutes = (time, minutes) => {
    const [hours, mins] = time.split(':').map(Number);
    const date = new Date(2000, 0, 1, hours, mins);
    date.setMinutes(date.getMinutes() + minutes);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const convertSlotsToRanges = (slots) => {
    const ranges = [];
    const slotsByDay = {};

    slots.forEach(slot => {
      if (!slotsByDay[slot.day]) {
        slotsByDay[slot.day] = [];
      }
      slotsByDay[slot.day].push(slot.time);
    });

    Object.entries(slotsByDay).forEach(([day, times]) => {
      times.sort();
      
      let startTime = null;
      let lastTime = null;

      times.forEach((time, index) => {
        if (!startTime) {
          startTime = time;
          lastTime = time;
        } else {
          const lastDate = new Date(`2000-01-01T${lastTime}`);
          const currentDate = new Date(`2000-01-01T${time}`);
          const diffMinutes = (currentDate - lastDate) / (1000 * 60);

          if (diffMinutes > 30) {
            ranges.push({
              day,
              startTime,
              endTime: addMinutes(lastTime, 30)
            });
            startTime = time;
          }
          lastTime = time;

          if (index === times.length - 1) {
            ranges.push({
              day,
              startTime,
              endTime: addMinutes(time, 30)
            });
          }
        }
      });
    });

    return ranges;
  };

  const saveAvailabilities = async () => {
    try {
      setSaveStatus('saving');
      let newAvailabilities = [...availabilities];

      if (mode === 'add' && selectedSlots.length > 0) {
        newAvailabilities = [...availabilities, ...selectedSlots];
      } else if (mode === 'delete' && unsavedAvailabilities.length > 0) {
        newAvailabilities = availabilities.filter(slot => 
          !unsavedAvailabilities.some(
            unsaved => unsaved.day === slot.day && unsaved.time === slot.time
          )
        );
      }

      const ranges = convertSlotsToRanges(newAvailabilities);
      
      await axios.post(
        `${config.API_URL}/api/teacher/availabilities`,
        { availabilities: ranges },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      setAvailabilities(newAvailabilities);
      setSelectedSlots([]);
      setUnsavedAvailabilities([]);
      setSaveStatus('saved');
      setMode('view');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setError(error.response?.data?.message || 'Erreur lors de la sauvegarde');
      setSaveStatus('error');
    }
  };

  const navigatePeriod = (direction) => {
    const newDate = new Date(currentDate);
    
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + direction);
        break;
      case '3days':
        newDate.setDate(newDate.getDate() + (direction * 3));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction * 7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + direction);
        break;
    }
    
    setCurrentDate(newDate);
  };

  const formatPeriodLabel = () => {
    const options = { month: 'long', year: 'numeric' };
    switch (viewMode) {
      case 'day':
        return `${days[currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1]} ${currentDate.getDate()} ${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
      case '3days':
        const endDate = new Date(currentDate);
        endDate.setDate(endDate.getDate() + 2);
        return `${currentDate.getDate()} - ${endDate.getDate()} ${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
      case 'week':
        const weekStart = new Date(currentDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return `${weekStart.getDate()} - ${weekEnd.getDate()} ${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
      case 'month':
        return currentDate.toLocaleDateString('fr-FR', options);
      default:
        return '';
    }
  };

  return (
    <div className="w-full h-[calc(100vh-6rem)] p-2 sm:p-4 mb-8">
      <div className={`flex flex-col lg:flex-row rounded-2xl shadow-lg overflow-hidden h-full ${
        isDarkMode 
          ? 'bg-gray-800 border border-gray-700' 
          : 'bg-white'
      }`}>
        
        {/* Bouton toggle sidebar */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`absolute top-8 left-4 z-20 p-2 rounded-lg transition-colors ${
            isDarkMode
              ? 'text-gray-300 hover:bg-gray-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {isSidebarOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          )}
        </button>

        {/* Sidebar avec animation */}
        <AnimatePresence initial={false}>
          {isSidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "auto", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`lg:w-52 p-4 border-r ${
                isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200'
              }`}
            >
              {/* Contenu de la sidebar */}
              <div className="p-3 sm:p-4 lg:p-6 flex flex-col space-y-3 sm:space-y-4 lg:space-y-6">
                {/* Titre Planning */}
                <div className="text-center lg:text-left">
                  <h2 className={`text-lg sm:text-xl font-semibold ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    Planning
                  </h2>
                </div>

                {/* Sélecteur de vue */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className={`h-px flex-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Vision</span>
                    <div className={`h-px flex-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                  </div>
                  <div className="flex flex-row lg:flex-col space-x-2 lg:space-x-0 lg:space-y-2">
                    {[
                      { id: 'month', label: 'Mois' },
                      { id: 'week', label: 'Semaine' },
                      { id: '3days', label: '3 Jours' },
                      { id: 'day', label: 'Jour' }
                    ].map(({ id, label }) => (
                      <motion.button
                        key={id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setViewMode(id)}
                        className={`
                          flex-1 lg:flex-none px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all
                          ${viewMode === id
                            ? isDarkMode
                              ? 'bg-purple-600 text-white'
                              : 'bg-purple-100 text-purple-700'
                            : isDarkMode
                              ? 'text-gray-300 hover:bg-gray-700'
                              : 'text-gray-600 hover:bg-gray-100'
                          }
                        `}
                      >
                        {label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className={`h-px flex-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Action</span>
                    <div className={`h-px flex-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                  </div>
                  <div className="flex flex-row lg:flex-col space-x-2 lg:space-x-0 lg:space-y-2">
                    {['view', 'add', 'delete'].map((buttonMode) => (
                      <motion.button
                        key={buttonMode}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setMode(buttonMode);
                          setSelectedSlots([]);
                          setUnsavedAvailabilities([]);
                        }}
                        className={`
                          flex-1 lg:flex-none px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all
                          ${mode === buttonMode
                            ? isDarkMode
                              ? 'bg-indigo-600 text-white'
                              : 'bg-indigo-100 text-indigo-700'
                            : isDarkMode
                              ? 'text-gray-300 hover:bg-gray-700'
                              : 'text-gray-600 hover:bg-gray-100'
                          }
                        `}
                      >
                        {buttonMode === 'view' ? 'Voir' : buttonMode === 'add' ? 'Ajouter' : 'Supprimer'}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Légende */}
                <div className="hidden lg:block space-y-2 sm:space-y-3">
                  <h3 className={`text-xs sm:text-sm font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Légende
                  </h3>
                  <div className="space-y-1.5 sm:space-y-2">
                    {[
                      { label: 'Disponible', color: isDarkMode ? 'bg-green-800/40' : 'bg-green-100' },
                      { label: 'Cours programmé', color: isDarkMode ? 'bg-blue-800/40' : 'bg-blue-100' },
                      { label: 'Sélectionné', color: isDarkMode ? 'bg-indigo-800/40' : 'bg-indigo-100' },
                      { label: 'À supprimer', color: isDarkMode ? 'bg-red-800/40' : 'bg-red-100' }
                    ].map(item => (
                      <div key={item.label} className="flex items-center space-x-2">
                        <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded ${item.color}`} />
                        <span className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Contenu principal */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Barre de navigation */}
          <div className={`flex items-center justify-between p-4 border-b ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigatePeriod(-1)}
                className={`p-2 rounded-lg ${
                  isDarkMode 
                    ? 'hover:bg-gray-700 text-gray-300' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </motion.button>
              
              <h2 className={`text-lg font-semibold ${
                isDarkMode ? 'text-gray-100' : 'text-gray-800'
              }`}>
                {formatPeriodLabel()}
              </h2>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigatePeriod(1)}
                className={`p-2 rounded-lg ${
                  isDarkMode 
                    ? 'hover:bg-gray-700 text-gray-300' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </motion.button>
            </div>
          </div>

          {/* Conteneur du calendrier avec hauteur fixe et scroll */}
          <div className="flex-1 overflow-hidden">
            <div className="h-[calc(100vh-16rem)] overflow-y-auto">
              {viewMode === 'month' ? renderMonthView() : renderWeekView()}
            </div>
          </div>
        </div>

        {/* Bouton de sauvegarde flottant */}
        {(selectedSlots.length > 0 || unsavedAvailabilities.length > 0) && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={saveAvailabilities}
            disabled={saveStatus === 'saving'}
            className={`
              fixed bottom-4 right-4 px-6 py-3 rounded-lg text-base font-medium shadow-lg transition-all
              ${isDarkMode
                ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              }
            `}
          >
            {saveStatus === 'saving' ? 'Sauvegarde...' : 'Sauvegarder'}
          </motion.button>
        )}

        {/* Notification de sauvegarde */}
        {saveStatus && (
          <div className={`fixed bottom-20 right-4 p-4 rounded-lg shadow-lg ${
            saveStatus.includes('succès') ? 
              (isDarkMode ? 'bg-green-800/90 text-green-300' : 'bg-green-100 text-green-700') : 
              (isDarkMode ? 'bg-red-800/90 text-red-300' : 'bg-red-100 text-red-700')
          }`}>
            {saveStatus}
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;