import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import config from '../../config';

const Calendar = ({ isDarkMode }) => {
  const [availabilities, setAvailabilities] = useState([]);
  const [unsavedAvailabilities, setUnsavedAvailabilities] = useState([]);
  const [error, setError] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [saveStatus, setSaveStatus] = useState('');
  const [viewMode, setViewMode] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mode, setMode] = useState('view');
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [selectionType, setSelectionType] = useState('single');

  const isSlotAvailable = (day, time) => {
    return availabilities.some(slot => {
      if (!slot.startTime || !slot.endTime) return false;
      const slotStart = new Date(`2000-01-01T${slot.startTime}`);
      const slotEnd = new Date(`2000-01-01T${slot.endTime}`);
      const currentTime = new Date(`2000-01-01T${time}`);
      return slot.day === day && 
             currentTime >= slotStart && 
             currentTime < slotEnd;
    });
  };

  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  // Définition des items du menu d'ajout
  const addMenuItems = [
    { 
      id: 'weekly', 
      label: 'Disponibilités hebdomadaires', 
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      onClick: () => {
        setMode('add');
        setSelectionType('weekly');
        setSelectedSlots([]);
        setIsAddMenuOpen(false);
        setViewMode('week');
      }
    },
    { 
      id: 'meeting', 
      label: 'Réunion avec manager', 
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      onClick: () => {
        setMode('add');
        setSelectionType('single');
        setSelectedSlots([]);
        setIsAddMenuOpen(false);
      }
    },
    { 
      id: 'workshop', 
      label: 'Disponibilités stage', 
      icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
      onClick: () => {
        setMode('add');
        setSelectionType('single');
        setSelectedSlots([]);
        setIsAddMenuOpen(false);
      }
    }
  ];

  // Modification des horaires de 6h à 22h
  const timeSlots = Array.from({ length: 33 }, (_, i) => {
    const hour = Math.floor(i / 2) + 6;
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  });

  // Au début du composant Calendar, ajouter la configuration du fuseau horaire
  const parisTimeZone = 'Europe/Paris';

  // Fonction pour obtenir une date dans le fuseau horaire de Paris
  const getParisDate = (date) => {
    return new Date(date.toLocaleString('en-US', { timeZone: parisTimeZone }));
  };

  const getVisibleDays = () => {
    // Obtenir la date dans le fuseau horaire de Paris
    const currentDayDate = getParisDate(new Date(currentDate));
    const currentDayIndex = currentDayDate.getDay() === 0 ? 6 : currentDayDate.getDay() - 1;
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
          {getVisibleDays().map((day, index) => {
            // Obtenir la date d'aujourd'hui dans le fuseau horaire de Paris
            const today = getParisDate(new Date());
            
            // Calculer la date pour chaque jour selon le mode
            const currentDayDate = getParisDate(new Date(currentDate));
            let dayDate;
            
            if (viewMode === 'day') {
              // En mode jour, utiliser directement la date sélectionnée sans modification
              dayDate = currentDayDate;
            } else {
              // En mode semaine, calculer à partir du lundi
              const monday = new Date(currentDayDate);
              monday.setDate(currentDayDate.getDate() - (currentDayDate.getDay() || 7) + 1);
              dayDate = new Date(monday);
              dayDate.setDate(monday.getDate() + index);
            }
            
            // Vérifier si c'est aujourd'hui
            const isToday = 
              today.getDate() === dayDate.getDate() &&
              today.getMonth() === dayDate.getMonth() &&
              today.getFullYear() === dayDate.getFullYear();
            
            return (
              <div
                key={day}
                className={`p-1.5 sm:p-2 lg:p-4 text-center font-medium border-r text-xs sm:text-sm lg:text-base flex flex-col items-center ${
                  isDarkMode 
                    ? 'text-gray-100 border-gray-700' 
                    : 'text-gray-800 border-gray-200'
                } ${
                  isToday
                    ? isDarkMode
                      ? 'bg-blue-800/40'
                      : 'bg-blue-100'
                    : ''
                }`}
              >
                <span>{day.substring(0, 3)}</span>
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {dayDate.getDate()}
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
                  className={`h-[40px] p-1.5 sm:p-2 lg:p-4 text-xs sm:text-sm border-b flex items-center ${
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
                  const isAvailable = isSlotAvailable(day, time);
                  const isUnsaved = unsavedAvailabilities.some(
                    slot => slot.day === day && slot.time === time
                  );
                  const isSelected = selectedSlots.some(
                    slot => slot.day === day && slot.time === time
                  );

                  return (
                    <motion.div
                      key={`${day}-${time}`}
                      className={`
                        h-[40px] p-1.5 sm:p-2 lg:p-4 border-b cursor-pointer
                        ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}
                        ${isAvailable ?
                          (isDarkMode ? 'bg-green-800/40' : 'bg-green-100') :
                          ''}
                        ${isUnsaved && mode === 'delete' ?
                          (isDarkMode ? 'bg-red-800/40' : 'bg-red-100') :
                          ''}
                        ${isSelected && mode === 'add' ?
                          (isDarkMode ? 'bg-indigo-800/40' : 'bg-indigo-100') :
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

  const handleSlotClick = (day, time) => {
    if (mode === 'view') return;

    if (mode === 'add') {
      setSelectedSlots(prev => {
        // Vérifier si le créneau est déjà sélectionné
        const isAlreadySelected = prev.some(slot => 
          slot.day === day && slot.time === time
        );

        // Si le créneau est déjà sélectionné, on le retire
        if (isAlreadySelected) {
          if (selectionType === 'weekly') {
            // En mode hebdomadaire, retirer le créneau pour tous les jours
            return prev.filter(slot => slot.time !== time);
          } else {
            // En mode normal, retirer seulement le créneau sélectionné
            return prev.filter(slot => !(slot.day === day && slot.time === time));
          }
        }

        // Si le créneau n'est pas sélectionné, on l'ajoute
        if (selectionType === 'weekly') {
          // En mode hebdomadaire, ajouter le créneau pour tous les jours
          const newSlots = [...prev];
          days.forEach(d => {
            newSlots.push({ day: d, time });
          });
          return newSlots;
        } else {
          // En mode normal, ajouter seulement le créneau sélectionné
          return [...prev, { day, time }];
        }
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

    // Regrouper les créneaux par jour
    slots.forEach(slot => {
      if (!slotsByDay[slot.day]) {
        slotsByDay[slot.day] = new Set();
      }
      slotsByDay[slot.day].add(slot.time);
    });

    // Pour chaque jour, convertir les créneaux en plages horaires
    Object.entries(slotsByDay).forEach(([day, timesSet]) => {
      const times = Array.from(timesSet).sort();
      let currentRange = {
        day,
        startTime: null,
        endTime: null
      };

      times.forEach((time, index) => {
        if (!currentRange.startTime) {
          currentRange.startTime = time;
        }

        // Si c'est le dernier créneau ou si le prochain créneau n'est pas consécutif
        if (index === times.length - 1 || 
            !isConsecutiveTime(time, times[index + 1])) {
          currentRange.endTime = addMinutes(time, 30);
          ranges.push({ ...currentRange });
          currentRange.startTime = null;
        }
      });
    });

    return ranges;
  };

  const isConsecutiveTime = (time1, time2) => {
    const [h1, m1] = time1.split(':').map(Number);
    const [h2, m2] = time2.split(':').map(Number);
    const minutes1 = h1 * 60 + m1;
    const minutes2 = h2 * 60 + m2;
    return minutes2 - minutes1 === 30;
  };

  const validateTimeSlots = (slots) => {
    // Trier les créneaux par jour et heure
    const sortedSlots = [...slots].sort((a, b) => {
      if (a.day !== b.day) return days.indexOf(a.day) - days.indexOf(b.day);
      return a.time.localeCompare(b.time);
    });

    // Regrouper par jour
    const slotsByDay = {};
    sortedSlots.forEach(slot => {
      if (!slotsByDay[slot.day]) slotsByDay[slot.day] = [];
      slotsByDay[slot.day].push(slot.time);
    });

    // Vérifier chaque jour
    for (const day in slotsByDay) {
      const times = slotsByDay[day].sort();
      let currentGroup = [];

      // Parcourir tous les créneaux du jour
      for (let i = 0; i < times.length; i++) {
        const currentTime = times[i];
        
        if (currentGroup.length === 0) {
          currentGroup.push(currentTime);
        } else {
          const lastTime = currentGroup[currentGroup.length - 1];
          
          // Calculer la différence en minutes
          const [lastHour, lastMin] = lastTime.split(':').map(Number);
          const [currentHour, currentMin] = currentTime.split(':').map(Number);
          const lastTotalMins = lastHour * 60 + lastMin;
          const currentTotalMins = currentHour * 60 + currentMin;
          
          if (currentTotalMins - lastTotalMins === 30) {
            // Les créneaux sont consécutifs
            currentGroup.push(currentTime);
          } else {
            // Si le groupe précédent est trop petit, retourner false
            if (currentGroup.length < 3) {
              return false;
            }
            // Commencer un nouveau groupe
            currentGroup = [currentTime];
          }
        }
      }

      // Vérifier le dernier groupe
      if (currentGroup.length < 3) {
        return false;
      }
    }

    return true;
  };

  const saveAvailabilities = async () => {
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const user = JSON.parse(sessionStorage.getItem('user'));

      if (!token || !user) {
        setError('Session expirée. Veuillez vous reconnecter.');
        setSaveStatus('error');
        return;
      }

      setSaveStatus('saving');
      setError(null);

      if (mode === 'add' && selectedSlots.length > 0) {
        if (!validateTimeSlots(selectedSlots)) {
          setError('Chaque plage horaire doit faire au minimum 1h30 (3 créneaux consécutifs)');
          setSaveStatus('error');
          return;
        }

        // Convertir uniquement les nouveaux créneaux sélectionnés
        const ranges = convertSlotsToRanges(selectedSlots);
        
        console.log('Données envoyées au serveur:', {
          availabilities: ranges,
          token: token
        });
        
        // Sauvegarder les nouvelles disponibilités
        const saveResponse = await axios.post(
          `${config.API_URL}/api/teacher/availabilities`,
          { availabilities: ranges },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (saveResponse.data) {
          // Recharger les disponibilités depuis le serveur
          const getResponse = await axios.get(
            `${config.API_URL}/api/teacher/availabilities`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          // Mettre à jour l'état avec les données fraîches du serveur
          setAvailabilities(getResponse.data);
          setSelectedSlots([]);
          setSaveStatus('saved');
          setMode('view');
          setSelectionType('single');

          console.log('Disponibilités mises à jour:', getResponse.data);

          setTimeout(() => {
            setSaveStatus('');
            setError(null);
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      console.error('Détails de l\'erreur:', error.response?.data);
      if (error.response?.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
      } else {
        setError(error.response?.data?.message || 'Erreur serveur: ' + (error.response?.data?.error || error.message));
      }
      setSaveStatus('error');
    }
  };

  // Fonction pour convertir un créneau en disponibilité
  const convertSlotToAvailability = (slot) => {
    return {
      day: slot.day,
      time: slot.time,
      startTime: slot.time,
      endTime: addMinutes(slot.time, 30)
    };
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
      default:
        newDate.setDate(newDate.getDate() + direction);
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

  // Dans le composant Calendar, modifier la partie des boutons de la sidebar
  const sidebarButtons = [
    {
      mode: 'view',
      label: 'Voir',
      icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
      onClick: () => {
        setMode('view');
        setSelectionType('single');
        setSelectedSlots([]);
        setIsAddMenuOpen(false);
      }
    },
    {
      mode: 'add',
      label: 'Ajouter',
      icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
      onClick: () => {
        setIsAddMenuOpen(!isAddMenuOpen);
        if (!isAddMenuOpen) {
          setMode('add');
          setSelectionType('single');
          setSelectedSlots([]);
        }
      }
    },
    {
      mode: 'delete',
      label: 'Supprimer',
      icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
      onClick: () => {
        setMode('delete');
        setSelectionType('single');
        setSelectedSlots([]);
        setIsAddMenuOpen(false);
      }
    }
  ];

  // Ajouter cette fonction pour rendre les boutons de la sidebar selon le mode
  const renderSidebarButtons = () => {
    // Modifier les styles des boutons dans renderSidebarButtons
    const buttonBaseStyle = `
      w-full px-4 py-3 rounded-lg font-medium
      relative overflow-hidden
      transition-all duration-300
      border border-opacity-20
      flex items-center justify-center
      gap-2
      backdrop-filter backdrop-blur-sm
      shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]
    `;

    // Style pour les boutons d'action (Sauvegarder/Confirmer)
    const actionButtonStyle = `
      ${buttonBaseStyle}
      ${isDarkMode
        ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
        : 'bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border-emerald-200'
      }
    `;

    // Style pour les boutons d'annulation
    const cancelButtonStyle = `
      ${buttonBaseStyle}
      ${isDarkMode
        ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-400/50 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
        : 'bg-rose-50 hover:bg-rose-100/80 text-rose-700 border-rose-200'
      }
    `;

    // Style pour les boutons normaux
    const normalButtonStyle = `
      ${buttonBaseStyle}
      ${isDarkMode
        ? 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 border-gray-500/30'
        : 'bg-white/80 hover:bg-gray-50/80 text-gray-700 border-gray-200'
      }
    `;

    // Style pour le bouton actif
    const activeButtonStyle = `
      ${buttonBaseStyle}
      ${isDarkMode
        ? 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border-indigo-400/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
        : 'bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 border-indigo-200'
      }
    `;

    // Mode de sélection (add avec un type de sélection)
    if (mode === 'add' && selectionType) {
      return (
        <div className="flex flex-col space-y-3">
          <motion.button
            whileHover={{ scale: 1.02, translateY: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={saveAvailabilities}
            className={actionButtonStyle}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Sauvegarder
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02, translateY: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setMode('view');
              setSelectionType(null);
              setSelectedSlots([]);
            }}
            className={cancelButtonStyle}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Annuler
          </motion.button>
        </div>
      );
    }

    // Mode de suppression
    if (mode === 'delete') {
      return (
        <div className="flex flex-col space-y-3">
          <motion.button
            whileHover={{ scale: 1.02, translateY: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={saveAvailabilities}
            className={actionButtonStyle}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Confirmer
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02, translateY: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setMode('view');
              setUnsavedAvailabilities([]);
            }}
            className={cancelButtonStyle}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Annuler
          </motion.button>
        </div>
      );
    }

    // Mode vue normale
    return (
      <div className="flex flex-col space-y-2">
        {sidebarButtons.map(({ mode: buttonMode, label, icon, onClick }) => (
          <div key={buttonMode} className="relative">
            <motion.button
              whileHover={{ scale: 1.02, translateY: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (onClick) {
                  onClick();
                } else {
                  setMode(buttonMode);
                  setSelectedSlots([]);
                  setUnsavedAvailabilities([]);
                }
              }}
              className={mode === buttonMode ? activeButtonStyle : normalButtonStyle}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
              </svg>
              {label}
            </motion.button>

            {/* Menu déroulant pour le bouton Ajouter */}
            {buttonMode === 'add' && isAddMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`
                  absolute z-50 left-0 mt-2 w-64 rounded-lg
                  backdrop-filter backdrop-blur-md
                  border border-opacity-20
                  shadow-[0_0_15px_rgba(0,0,0,0.1)]
                  ${isDarkMode 
                    ? 'bg-gray-900/70 border-gray-700' 
                    : 'bg-white/90 border-gray-200'
                  }
                `}
              >
                <div className="py-1">
                  {addMenuItems.map((item) => (
                    <motion.button
                      key={item.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={item.onClick}
                      className={`
                        w-full flex items-center px-4 py-2 text-sm
                        ${isDarkMode
                          ? 'text-gray-200 hover:bg-gray-700'
                          : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </svg>
                      {item.label}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        ))}
      </div>
    );
  };

  useEffect(() => {
    const fetchAvailabilities = async () => {
      try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        const user = JSON.parse(sessionStorage.getItem('user'));

        if (!token || !user) {
          setError('Session expirée. Veuillez vous reconnecter.');
          return;
        }

        const response = await axios.get(
          `${config.API_URL}/api/teacher/availabilities`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        setAvailabilities(response.data);
      } catch (error) {
        console.error('Erreur lors du chargement des disponibilités:', error);
        if (error.response?.status === 401) {
          setError('Session expirée. Veuillez vous reconnecter.');
        } else {
          setError('Erreur lors du chargement des disponibilités');
        }
      }
    };

    fetchAvailabilities();
  }, []);

  return (
    <div className="w-full h-[calc(100vh-6rem)] p-2 sm:p-4 mb-8">
      <div className={`flex rounded-2xl shadow-lg overflow-hidden h-full ${
        isDarkMode 
          ? 'bg-gray-800 border border-gray-700' 
          : 'bg-white'
      }`}>
        {/* Sidebar toujours visible */}
        <div className={`w-52 p-4 border-r ${
          isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200'
        }`}>
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

            {/* Boutons d'action */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className={`h-px flex-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {mode === 'view' ? 'Action' : mode === 'add' ? 'Sélection' : 'Suppression'}
                </span>
                <div className={`h-px flex-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
              </div>
              {renderSidebarButtons()}
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
        </div>

        {/* Contenu principal */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Barre de navigation */}
          <div className="flex items-center justify-between p-4">
            {/* Navigation et titre */}
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

            {/* Menu de vision */}
            <div className="relative">
              <button
                onClick={() => setIsViewMenuOpen(!isViewMenuOpen)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
                  isDarkMode 
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}
              >
                <span>Vision {viewMode === 'day' ? 'Jour' : viewMode === 'week' ? 'Semaine' : 'Mois'}</span>
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Menu déroulant */}
              {isViewMenuOpen && (
                <div className={`absolute right-0 mt-2 w-40 rounded-md shadow-lg ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white'
                } ring-1 ring-black ring-opacity-5 z-50`}>
                  <div className="py-1" role="menu">
                    {['day', 'week', 'month'].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => {
                          setViewMode(mode);
                          setIsViewMenuOpen(false);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm ${
                          isDarkMode
                            ? 'text-gray-200 hover:bg-gray-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        } ${viewMode === mode ? 'font-medium' : ''}`}
                      >
                        {mode === 'day' ? 'Jour' : mode === 'week' ? 'Semaine' : 'Mois'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Conteneur du calendrier avec hauteur fixe et scroll */}
          <div className="flex-1 overflow-hidden">
            <div className="h-[calc(100vh-16rem)] overflow-y-auto">
              <div className="h-full flex flex-col relative">
                {/* Contenu du calendrier */}
                {viewMode === 'month' ? renderMonthView() : renderWeekView()}
              </div>
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

        {/* Message d'erreur */}
        {error && (
          <div className={`
            fixed top-4 right-4 p-4 rounded-lg shadow-lg
            ${isDarkMode ? 'bg-red-900/90 text-red-200' : 'bg-red-100 text-red-800'}
          `}>
            {error}
          </div>
        )}

        {/* Message de succès */}
        {saveStatus === 'saved' && (
          <div className={`
            fixed top-4 right-4 p-4 rounded-lg shadow-lg
            ${isDarkMode ? 'bg-green-900/90 text-green-200' : 'bg-green-100 text-green-800'}
          `}>
            Disponibilités sauvegardées avec succès
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;