import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import config from '../../config';

const Calendar = ({ isDarkMode }) => {
  const [availabilities, setAvailabilities] = useState([]);
  const [unsavedAvailabilities, setUnsavedAvailabilities] = useState([]);
  const [courses, setCourses] = useState([]);
  const [mode, setMode] = useState('view');
  const [error, setError] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [saveStatus, setSaveStatus] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  // Modification des horaires de 6h à 22h
  const timeSlots = Array.from({ length: 33 }, (_, i) => {
    const hour = Math.floor(i / 2) + 6;
    const minutes = i % 2 === 0 ? '00' : '30';
    return `${String(hour).padStart(2, '0')}:${minutes}`;
  });

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

  useEffect(() => {
    const fetchAvailabilities = async () => {
      try {
        const response = await axios.get(`${config.API_URL}/api/teacher/availabilities`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setAvailabilities(response.data);
      } catch (error) {
        console.error('Erreur lors du chargement des disponibilités:', error);
        setError('Erreur lors du chargement des disponibilités');
      }
    };

    fetchAvailabilities();
  }, []);

  return (
    <div className="w-full h-[calc(100vh-4rem)] p-4">
      <div className={`flex rounded-2xl shadow-lg overflow-hidden h-full ${
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
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          )}
        </button>

        {/* Sidebar avec animation */}
        <AnimatePresence initial={false}>
          {isSidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex flex-col border-r ${
                isDarkMode 
                  ? 'bg-gray-900 border-gray-700' 
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              {/* Contenu de la sidebar */}
              <div className="p-8 space-y-8">
                <div className="text-center">
                  <h2 className={`text-2xl font-semibold ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    Planning
                  </h2>
                </div>

                <div className="flex flex-col space-y-4">
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
                        w-full px-6 py-4 rounded-xl text-lg font-medium transition-all
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

                {(selectedSlots.length > 0 || unsavedAvailabilities.length > 0) && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={saveAvailabilities}
                    disabled={saveStatus === 'saving'}
                    className={`
                      w-full px-6 py-4 rounded-xl text-lg font-medium transition-all
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
                <div className="space-y-4">
                  <h3 className={`text-lg font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Légende
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Disponible', color: isDarkMode ? 'bg-green-900/30' : 'bg-green-100' },
                      { label: 'Cours programmé', color: isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100' },
                      { label: 'Sélectionné', color: isDarkMode ? 'bg-indigo-900/30' : 'bg-indigo-100' },
                      { label: 'À supprimer', color: isDarkMode ? 'bg-red-900/30' : 'bg-red-100' }
                    ].map(item => (
                      <div key={item.label} className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-lg ${item.color}`} />
                        <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
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
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* En-tête des jours (fixe) */}
          <div className={`grid grid-cols-8 border-b ${
            isDarkMode 
              ? 'bg-gray-900 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className={`p-4 border-r ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`} />
            {days.map(day => (
              <div
                key={day}
                className={`p-4 text-center font-medium border-r ${
                  isDarkMode 
                    ? 'text-gray-100 border-gray-700' 
                    : 'text-gray-800 border-gray-200'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Grille scrollable */}
          <div className={`flex-1 overflow-y-auto ${
            isDarkMode ? 'bg-gray-900' : 'bg-white'
          }`}>
            <div className="grid grid-cols-8 h-full">
              {timeSlots.map(time => (
                <React.Fragment key={time}>
                  <div className={`p-2 border-b text-sm ${
                    isDarkMode ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    {time}
                  </div>
                  {days.map(day => {
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
                          relative p-2 border-b border-l cursor-pointer transition-colors
                          ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}
                          ${isAvailable && !isUnsaved ? 
                            (isDarkMode ? 'bg-green-900/30' : 'bg-green-100') : 
                            (isDarkMode ? '' : '')}
                          ${isSelected ? 
                            (isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100') : 
                            ''}
                          ${isUnsaved ? 
                            (isDarkMode ? 'bg-red-900/30' : 'bg-red-100') : 
                            ''}
                          hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}
                        `}
                        onClick={() => handleSlotClick(day, time)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {course && (
                          <div className={`
                            absolute inset-0 flex items-center justify-center text-xs font-medium
                            ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}
                          `}>
                            {course.studentName}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {(selectedSlots.length > 0 || unsavedAvailabilities.length > 0) && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={saveAvailabilities}
            disabled={saveStatus === 'saving'}
            className={`
              w-full px-6 py-4 rounded-xl text-lg font-medium transition-all
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