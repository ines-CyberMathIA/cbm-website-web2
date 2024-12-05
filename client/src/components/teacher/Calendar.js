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
    switch (viewMode) {
      case 'day':
        return [days[currentDate.getDay()]];
      case '3days': {
        const currentDayIndex = currentDate.getDay();
        return days.slice(currentDayIndex, currentDayIndex + 3);
      }
      case 'month':
        return days;
      default: // 'week'
        return days;
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Ajuster le premier jour pour commencer par lundi
    let firstDayIndex = firstDay.getDay() - 1;
    if (firstDayIndex === -1) firstDayIndex = 6;
    
    const daysArray = [];
    
    // Ajouter les jours du mois précédent
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      daysArray.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false
      });
    }
    
    // Ajouter les jours du mois en cours
    for (let i = 1; i <= lastDay.getDate(); i++) {
      daysArray.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    // Ajouter les jours du mois suivant
    const remainingDays = 42 - daysArray.length; // 6 semaines * 7 jours
    for (let i = 1; i <= remainingDays; i++) {
      daysArray.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    
    return daysArray;
  };

  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    
    return (
      <>
        {/* En-tête du mois */}
        <div className={`p-4 border-b text-center ${
          isDarkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-800'
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
                <div
                  key={index}
                  className={`
                    min-h-[100px] p-2 border-b border-r relative
                    ${isDarkMode 
                      ? 'border-gray-700' 
                      : 'border-gray-200'
                    }
                    ${!day.isCurrentMonth 
                      ? isDarkMode 
                        ? 'bg-gray-800 text-gray-500' 
                        : 'bg-gray-50 text-gray-400'
                      : isDarkMode
                        ? 'text-gray-100'
                        : 'text-gray-800'
                    }
                  `}
                >
                  <span className="text-sm">{day.date.getDate()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderWeekView = () => (
    <>
      {/* En-tête des jours (fixe) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `80px repeat(${getVisibleDays().length}, 1fr)`,
          gridAutoFlow: 'column dense'
        }}
        className={`${
          isDarkMode 
            ? 'bg-gray-900 border-gray-700' 
            : 'bg-white border-gray-200'
        } border-b`}
      >
        <div className={`p-1.5 sm:p-2 lg:p-4 border-r text-xs sm:text-sm ${
          isDarkMode ? 'border-gray-700 text-gray-200' : 'border-gray-200'
        }`} />
        {getVisibleDays().map(day => (
          <div
            key={day}
            className={`p-1.5 sm:p-2 lg:p-4 text-center font-medium border-r text-xs sm:text-sm lg:text-base ${
              isDarkMode 
                ? 'text-gray-100 border-gray-700' 
                : 'text-gray-800 border-gray-200'
            }`}
          >
            {day.substring(0, 3)}
          </div>
        ))}
      </div>

      {/* Grille scrollable */}
      <div className={`flex-1 overflow-y-auto ${
        isDarkMode ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className="grid h-full"
          style={{
            gridTemplateColumns: `80px repeat(${getVisibleDays().length}, 1fr)`
          }}
        >
          {/* Colonne des horaires */}
          <div className="grid auto-rows-fr">
            {timeSlots.map(time => (
              <div
                key={time}
                className={`p-1.5 sm:p-2 border-b border-r flex items-center text-[10px] sm:text-xs lg:text-sm ${
                  isDarkMode ? 'border-gray-700 text-gray-200' : 'border-gray-200'
                }`}
              >
                {time}
              </div>
            ))}
          </div>

          {/* Colonnes des jours */}
          {getVisibleDays().map(day => (
            <div key={day} className="grid auto-rows-fr">
              {timeSlots.map(time => {
                const isAvailable = isSlotAvailable(day, time);
                const isSelected = isSlotSelected(day, time);
                const course = getCourseForSlot(day, time);
                const isUnsaved = unsavedAvailabilities.some(
                  slot => slot.day === day && slot.time === time
                );

                return (
                  <motion.div
                    key={`${day}-${time}`}
                    className={`
                      p-1.5 sm:p-2 border-b border-r cursor-pointer transition-colors flex items-center
                      ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}
                      ${isAvailable && !isUnsaved ? 
                        (isDarkMode ? 'bg-green-900/30' : 'bg-green-100') : 
                        (isDarkMode ? '' : '')}
                      ${isSelected ? 
                        (isDarkMode ? 'bg-indigo-900/30' : 'bg-indigo-100') :
                        ''}
                      ${course ? 
                        (isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100') :
                        ''}
                      ${isUnsaved && mode === 'delete' ? 
                        (isDarkMode ? 'bg-red-900/30' : 'bg-red-100') :
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
    </>
  );

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

  return (
    <div className="w-full h-[calc(100vh-6rem)] p-2 sm:p-4 mb-8">
      <div className={`flex flex-col lg:flex-row rounded-2xl shadow-lg overflow-hidden h-full ${
        isDarkMode 
          ? 'bg-gray-900 border border-gray-700' 
          : 'bg-white'
      }`}>
        {/* Bouton toggle sidebar */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`absolute top-8 left-4 z-20 p-2 rounded-lg transition-colors ${
            isDarkMode
              ? 'text-gray-300 hover:bg-gray-800'
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
              className={`lg:flex flex-col border-b lg:border-b-0 lg:border-r ${
                isDarkMode 
                  ? 'bg-gray-900 border-gray-700' 
                  : 'bg-gray-50 border-gray-200'
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

                {(selectedSlots.length > 0 || unsavedAvailabilities.length > 0) && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={saveAvailabilities}
                    disabled={saveStatus === 'saving'}
                    className={`
                      w-full px-4 py-2 rounded-lg text-base font-medium transition-all
                      ${isDarkMode
                        ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      }
                    `}
                  >
                    {saveStatus === 'saving' ? 'Sauvegarde...' : 'Sauvegarder'}
                  </motion.button>
                )}

                {/* Légende */}
                <div className="hidden lg:block space-y-2 sm:space-y-3">
                  <h3 className={`text-xs sm:text-sm font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Légende
                  </h3>
                  <div className="space-y-1.5 sm:space-y-2">
                    {[
                      { label: 'Disponible', color: isDarkMode ? 'bg-green-900/30' : 'bg-green-100' },
                      { label: 'Cours programmé', color: isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100' },
                      { label: 'Sélectionné', color: isDarkMode ? 'bg-indigo-900/30' : 'bg-indigo-100' },
                      { label: 'À supprimer', color: isDarkMode ? 'bg-red-900/30' : 'bg-red-100' }
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

        {/* Grille du calendrier */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {viewMode === 'month' ? renderMonthView() : renderWeekView()}
        </div>

        {(selectedSlots.length > 0 || unsavedAvailabilities.length > 0) && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={saveAvailabilities}
            disabled={saveStatus === 'saving'}
            className={`
              w-full px-4 py-2 rounded-lg text-base font-medium transition-all
              ${isDarkMode
                ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              }
            `}
          >
            {saveStatus === 'saving' ? 'Sauvegarde...' : 'Sauvegarder'}
          </motion.button>
        )}

        {saveStatus && (
          <div className={`mt-4 p-3 rounded ${
            saveStatus.includes('succès') ? 
              (isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700') : 
              (isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700')
          }`}>
            {saveStatus}
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;