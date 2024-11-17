import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Calendar = () => {
  const [availabilities, setAvailabilities] = useState([]);
  const [unsavedAvailabilities, setUnsavedAvailabilities] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSlot, setNewSlot] = useState({
    day: 'Lundi',
    startTime: '08:00',
    endTime: '09:30'  // Par défaut 1h30
  });
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [mode, setMode] = useState('view'); // 'view', 'add' ou 'delete'

  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  
  // Générer les créneaux de 30 minutes
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour <= 22; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 22) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    return slots;
  };

  // Modifier la fonction wouldMaintainMinimumDuration
  const wouldMaintainMinimumDuration = (day, time, isAdding) => {
    // Récupérer tous les créneaux du jour
    let daySlots = [...availabilities, ...unsavedAvailabilities]
      .filter(slot => slot.day === day)
      .filter(slot => !slot.toDelete); // Ignorer les créneaux marqués pour suppression

    // Simuler l'ajout ou la suppression
    if (isAdding) {
      daySlots.push({ day, time });
    } else {
      daySlots = daySlots.filter(slot => !(slot.day === day && slot.time === time));
    }

    // Trier les créneaux par heure
    daySlots.sort((a, b) => a.time.localeCompare(b.time));

    // Regrouper les créneaux consécutifs
    let currentGroup = [];
    const groups = [];

    daySlots.forEach((slot, index) => {
      if (currentGroup.length === 0) {
        currentGroup.push(slot);
      } else {
        const lastSlot = currentGroup[currentGroup.length - 1];
        const lastTime = new Date(`2000-01-01T${lastSlot.time}`);
        const currentTime = new Date(`2000-01-01T${slot.time}`);
        const diffMinutes = (currentTime - lastTime) / (1000 * 60);

        if (diffMinutes === 30) {
          currentGroup.push(slot);
        } else {
          groups.push([...currentGroup]);
          currentGroup = [slot];
        }
      }
    });

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    // Si aucun groupe n'est trouvé, c'est valide (pas de contrainte à vérifier)
    if (groups.length === 0) return true;

    // Vérifier que chaque groupe fait au moins 1h30 (3 créneaux de 30 minutes)
    return groups.every(group => group.length >= 3);
  };

  // Gérer le clic sur un créneau en fonction du mode
  const handleTimeSlotClick = (day, time) => {
    // Si on est en mode vue, ne rien faire
    if (mode === 'view') return;

    // En mode ajout, on ne peut cliquer que sur les cases vides
    if (mode === 'add') {
      const isAvailable = [...availabilities, ...unsavedAvailabilities]
        .some(slot => slot.day === day && slot.time === time);
      
      if (!isAvailable) {
        // Vérifier si le créneau est déjà sélectionné
        const isSelected = selectedSlots.some(slot => slot.day === day && slot.time === time);
        
        if (isSelected) {
          // Désélectionner le créneau
          setSelectedSlots(prev => prev.filter(slot => !(slot.day === day && slot.time === time)));
        } else {
          // Sélectionner le créneau
          setSelectedSlots(prev => [...prev, { day, time }]);
        }
      }
    }
    // En mode suppression, on ne peut cliquer que sur les cases disponibles
    else if (mode === 'delete') {
      const isAvailable = availabilities
        .some(slot => slot.day === day && slot.time === time);
      
      if (isAvailable) {
        const isSelected = selectedSlots
          .some(slot => slot.day === day && slot.time === time);

        if (isSelected) {
          setSelectedSlots(prev => 
            prev.filter(slot => !(slot.day === day && slot.time === time))
          );
        } else {
          setSelectedSlots(prev => [...prev, { day, time }]);
        }
      }
    }
  };

  // Vérifier si la suppression est valide
  const isValidDeletion = () => {
    // Créer une copie des disponibilités sans les créneaux sélectionnés
    const remainingSlots = availabilities
      .filter(slot => !selectedSlots.some(
        selected => selected.day === slot.day && selected.time === slot.time
      ));

    // Grouper par jour
    const slotsByDay = {};
    remainingSlots.forEach(slot => {
      if (!slotsByDay[slot.day]) {
        slotsByDay[slot.day] = [];
      }
      slotsByDay[slot.day].push(slot);
    });

    // Pour chaque jour qui a encore des créneaux
    for (const day in slotsByDay) {
      if (slotsByDay[day].length === 0) continue; // Ignorer les jours vides

      const daySlots = slotsByDay[day].sort((a, b) => a.time.localeCompare(b.time));
      let currentGroup = [];

      // Parcourir tous les créneaux du jour
      for (let i = 0; i < daySlots.length; i++) {
        const currentSlot = daySlots[i];
        
        if (currentGroup.length === 0) {
          currentGroup.push(currentSlot);
        } else {
          const lastSlot = currentGroup[currentGroup.length - 1];
          const lastTime = new Date(`2000-01-01T${lastSlot.time}`);
          const currentTime = new Date(`2000-01-01T${currentSlot.time}`);
          const diffMinutes = (currentTime - lastTime) / (1000 * 60);

          if (diffMinutes === 30) {
            currentGroup.push(currentSlot);
          } else {
            // Vérifier le groupe précédent
            if (currentGroup.length < 3) { // moins de 1h30
              return false;
            }
            currentGroup = [currentSlot];
          }
        }
      }

      // Vérifier le dernier groupe
      if (currentGroup.length > 0 && currentGroup.length < 3) {
        return false;
      }
    }

    return true;
  };

  // Supprimer les créneaux sélectionnés
  const handleDeleteSelection = () => {
    if (selectedSlots.length === 0) {
      setError("Aucun créneau sélectionné");
      return;
    }

    if (!isValidDeletion()) {
      setError("La suppression créerait une ou plusieurs plages horaires inférieures à 1h30");
      return;
    }

    // Supprimer les créneaux sélectionnés
    const newAvailabilities = availabilities.filter(slot => 
      !selectedSlots.some(selected => 
        selected.day === slot.day && selected.time === slot.time
      )
    );

    setAvailabilities(newAvailabilities);
    setSelectedSlots([]); // Réinitialiser la sélection
    setError(null);
    
    // Marquer les modifications comme non sauvegardées
    setUnsavedAvailabilities([
      ...unsavedAvailabilities,
      ...selectedSlots.map(slot => ({ ...slot, toDelete: true }))
    ]);
  };

  // Charger les disponibilités au montage du composant
  useEffect(() => {
    const fetchAvailabilities = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5003/api/teacher/availabilities', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        // Convertir les disponibilités en format de créneaux de 30 minutes
        const slots = [];
        response.data.forEach(availability => {
          const start = availability.startTime;
          const end = availability.endTime;
          let currentTime = start;
          while (currentTime < end) {
            slots.push({
              day: availability.day,
              time: currentTime
            });
            // Ajouter 30 minutes
            const [hours, minutes] = currentTime.split(':');
            const date = new Date(2000, 0, 1, parseInt(hours), parseInt(minutes));
            date.setMinutes(date.getMinutes() + 30);
            currentTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
          }
        });
        setAvailabilities(slots);
      } catch (error) {
        console.error('Erreur lors du chargement des disponibilités:', error);
        setError('Erreur lors du chargement des disponibilités');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailabilities();
  }, []);

  // Fonction pour convertir les créneaux en plages horaires pour la sauvegarde
  const convertSlotsToRanges = (slots) => {
    const ranges = [];
    const sortedSlots = [...slots].sort((a, b) => {
      if (a.day !== b.day) return days.indexOf(a.day) - days.indexOf(b.day);
      return a.time.localeCompare(b.time);
    });

    let currentRange = null;
    sortedSlots.forEach(slot => {
      if (!currentRange) {
        currentRange = {
          day: slot.day,
          startTime: slot.time,
          endTime: addMinutes(slot.time, 30)
        };
      } else if (
        currentRange.day === slot.day && 
        currentRange.endTime === slot.time
      ) {
        currentRange.endTime = addMinutes(slot.time, 30);
      } else {
        ranges.push(currentRange);
        currentRange = {
          day: slot.day,
          startTime: slot.time,
          endTime: addMinutes(slot.time, 30)
        };
      }
    });
    if (currentRange) {
      ranges.push(currentRange);
    }
    return ranges;
  };

  // Fonction utilitaire pour ajouter des minutes à une heure
  const addMinutes = (time, minutes) => {
    const [hours, mins] = time.split(':').map(Number);
    const date = new Date(2000, 0, 1, hours, mins);
    date.setMinutes(date.getMinutes() + minutes);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  // Modifier la fonction de sauvegarde
  const saveAvailabilities = async () => {
    try {
      setSaveStatus('saving');

      // Créer une copie des disponibilités actuelles
      let newAvailabilities = [...availabilities];

      // En mode ajout, ajouter les créneaux sélectionnés
      if (mode === 'add' && selectedSlots.length > 0) {
        // Vérifier que les nouveaux créneaux forment des plages valides
        const allSlots = [...availabilities, ...selectedSlots];
        const slotsByDay = groupSlotsByDay(allSlots);
        
        // Vérifier chaque jour
        for (const day in slotsByDay) {
          const groups = getConsecutiveGroups(slotsByDay[day]);
          if (!groups.every(group => group.length >= 3)) {
            setError("Les plages horaires doivent faire au moins 1h30");
            setSaveStatus('error');
            return;
          }
        }

        newAvailabilities = allSlots;
      }
      // En mode suppression, retirer les créneaux sélectionnés
      else if (mode === 'delete' && selectedSlots.length > 0) {
        // Filtrer les créneaux à conserver
        const remainingSlots = availabilities.filter(slot => 
          !selectedSlots.some(selected => 
            selected.day === slot.day && selected.time === slot.time
          )
        );

        // Vérifier que les plages restantes sont valides
        const slotsByDay = groupSlotsByDay(remainingSlots);
        
        for (const day in slotsByDay) {
          if (slotsByDay[day].length > 0) {  // Ne vérifier que les jours avec des créneaux
            const groups = getConsecutiveGroups(slotsByDay[day]);
            if (!groups.every(group => group.length >= 3)) {
              setError("La suppression créerait des plages horaires inférieures à 1h30");
              setSaveStatus('error');
              return;
            }
          }
        }

        newAvailabilities = remainingSlots;
      }

      // Convertir en plages horaires pour la sauvegarde
      const ranges = convertSlotsToRanges(newAvailabilities);
      
      // Envoyer au serveur
      await axios.post(
        'http://localhost:5003/api/teacher/availabilities',
        { availabilities: ranges },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      // Mettre à jour l'état local
      setAvailabilities(newAvailabilities);
      setSelectedSlots([]);
      setUnsavedAvailabilities([]);
      setMode('view');
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setError('Erreur lors de la sauvegarde des disponibilités');
      setSaveStatus('error');
    }
  };

  // Fonction utilitaire pour grouper les créneaux par jour
  const groupSlotsByDay = (slots) => {
    const groups = {};
    slots.forEach(slot => {
      if (!groups[slot.day]) {
        groups[slot.day] = [];
      }
      groups[slot.day].push(slot);
    });
    
    // Trier les créneaux de chaque jour
    for (const day in groups) {
      groups[day].sort((a, b) => a.time.localeCompare(b.time));
    }
    
    return groups;
  };

  // Fonction pour obtenir les groupes de créneaux consécutifs
  const getConsecutiveGroups = (slots) => {
    const groups = [];
    let currentGroup = [];

    slots.forEach((slot, index) => {
      if (currentGroup.length === 0) {
        currentGroup.push(slot);
      } else {
        const lastSlot = currentGroup[currentGroup.length - 1];
        const lastTime = new Date(`2000-01-01T${lastSlot.time}`);
        const currentTime = new Date(`2000-01-01T${slot.time}`);
        const diffMinutes = (currentTime - lastTime) / (1000 * 60);

        if (diffMinutes === 30) {
          currentGroup.push(slot);
        } else {
          groups.push([...currentGroup]);
          currentGroup = [slot];
        }
      }
    });

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  };

  // Gérer le clic sur un créneau sauvegardé
  const handleSavedSlotClick = (day, time) => {
    const isAvailable = availabilities.some(slot => slot.day === day && slot.time === time);
    if (!isAvailable) return;

    // Vérifier si la suppression maintient la durée minimale
    if (!wouldMaintainMinimumDuration(day, time, false)) {
      setError("La suppression de ce créneau créerait une plage horaire inférieure à 1h30");
      return;
    }

    // Déplacer le créneau vers les non sauvegardés pour marquer la modification
    setAvailabilities(availabilities.filter(slot => !(slot.day === day && slot.time === time)));
    setUnsavedAvailabilities([...unsavedAvailabilities, { day, time, isRemoval: true }]);
    setError(null);
  };

  // Modifier la fonction handleAddAvailability
  const handleAddAvailability = () => {
    const { day, startTime, endTime } = newSlot;

    // Convertir les heures au format HH:mm
    const formatTime = (time) => {
      return time.replace('h', ':').padStart(5, '0');
    };

    const formattedStartTime = formatTime(startTime);
    const formattedEndTime = formatTime(endTime);

    // Vérifier que l'heure de fin ne dépasse pas 22:00
    if (formattedEndTime > '22:00') {
      setError("L'heure de fin ne peut pas dépasser 22h00");
      return;
    }

    // Vérifier la durée minimale de 1h30
    const start = new Date(`2000-01-01T${formattedStartTime}`);
    const end = new Date(`2000-01-01T${formattedEndTime}`);
    const duration = (end - start) / (1000 * 60); // durée en minutes

    if (duration < 90) {
      setError("La durée minimale d'une disponibilité doit être de 1h30");
      return;
    }

    // Créer les créneaux de 30 minutes
    const slots = [];
    let currentTime = formattedStartTime;
    
    while (new Date(`2000-01-01T${currentTime}`) < new Date(`2000-01-01T${formattedEndTime}`)) {
      slots.push({
        day,
        time: currentTime,
        isNew: true  // Marquer comme nouveau créneau
      });
      
      // Ajouter 30 minutes
      const [hours, minutes] = currentTime.split(':').map(Number);
      const date = new Date(2000, 0, 1, hours, minutes);
      date.setMinutes(date.getMinutes() + 30);
      currentTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }

    // Ajouter les créneaux aux disponibilités non sauvegardées
    setUnsavedAvailabilities(prev => [...prev, ...slots]);
    setShowAddModal(false);
    setError(null);
  };

  // Modifier le useEffect pour le timer du message d'erreur
  useEffect(() => {
    let timer;
    if (error) {
      timer = setTimeout(() => {
        setError(null);
      }, 15000); // 15 secondes au lieu de 30
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [error]);

  return (
    <div className="space-y-6">
      {/* En-tête avec boutons de mode */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Planning des disponibilités
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setMode('add');
                setSelectedSlots([]);
              }}
              className={`px-4 py-2 rounded-md flex items-center ${
                mode === 'add'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Ajouter des disponibilités
            </button>
            <button
              onClick={() => {
                setMode('delete');
                setUnsavedAvailabilities([]);
              }}
              className={`px-4 py-2 rounded-md flex items-center ${
                mode === 'delete'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Supprimer des disponibilités
            </button>
            {(mode !== 'view' || selectedSlots.length > 0 || unsavedAvailabilities.length > 0) && (
              <button
                onClick={() => {
                  setMode('view');
                  setSelectedSlots([]);
                  setUnsavedAvailabilities([]);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Annuler
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {saveStatus === 'saving' && (
            <span className="text-gray-600">Sauvegarde en cours...</span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-green-600">Sauvegardé ✓</span>
          )}
          {saveStatus === 'error' && (
            <span className="text-red-600">Erreur de sauvegarde !</span>
          )}
          {(selectedSlots.length > 0 || unsavedAvailabilities.length > 0) && (
            <button
              onClick={saveAvailabilities}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              disabled={saveStatus === 'saving'}
            >
              Sauvegarder les modifications
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Grille du calendrier */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-8 border-b">
          <div className="border-r"></div>
          {days.map(day => (
            <div key={day} className="text-center font-semibold py-2 border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        <div className="overflow-y-auto max-h-[600px]">
          {generateTimeSlots().map(time => (
            <div key={time} className="grid grid-cols-8 border-b last:border-b-0">
              <div className="border-r p-2 text-sm font-medium bg-gray-100 text-gray-700 flex items-center justify-center">
                {time.replace(':', 'h')}
              </div>
              {days.map(day => {
                const isSelected = [...availabilities, ...unsavedAvailabilities]
                  .some(slot => slot.day === day && slot.time === time);
                const isSaved = availabilities
                  .some(slot => slot.day === day && slot.time === time);
                const hasCourse = courses
                  .some(c => c.day === day && c.time === time);
                const isAvailable = availabilities
                  .some(slot => slot.day === day && slot.time === time);

                return (
                  <button
                    key={`${day}-${time}`}
                    onClick={() => !hasCourse && handleTimeSlotClick(day, time)}
                    disabled={hasCourse || (mode === 'delete' && !isAvailable)}
                    className={`
                      border-r last:border-r-0 p-2 min-h-[30px] transition-all duration-200
                      ${hasCourse 
                        ? 'bg-blue-100 cursor-not-allowed' 
                        : mode === 'delete' && selectedSlots.some(slot => slot.day === day && slot.time === time)
                          ? 'bg-red-100 hover:bg-red-200 border-2 border-red-500'  // Sélectionné pour suppression
                          : mode === 'add' && selectedSlots.some(slot => slot.day === day && slot.time === time)
                            ? 'bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-500'  // Sélectionné pour ajout
                            : isAvailable
                              ? 'bg-emerald-100 hover:bg-emerald-200 border-l-4 border-emerald-500'  // Disponible
                              : mode === 'add'
                                ? 'hover:bg-emerald-50 cursor-pointer'  // Mode ajout
                                : ''  // Mode normal
                      }
                      ${mode === 'delete' && !isAvailable ? 'cursor-not-allowed opacity-50' : ''}
                    `}
                  >
                    {hasCourse && (
                      <div className="text-xs bg-blue-200 text-blue-800 rounded-lg px-2 py-1">
                        Cours
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Légende */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-medium mb-3 text-gray-700">Légende</h3>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-white border rounded-md mr-2"></div>
            <span className="text-sm text-gray-600">Non disponible</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-emerald-50 rounded-md mr-2"></div>
            <span className="text-sm text-gray-600">Sélectionné (non sauvegardé)</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-emerald-100 rounded-md mr-2 border-l-4 border-emerald-500"></div>
            <span className="text-sm text-gray-600">Disponible (sauvegardé)</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-red-50 rounded-md mr-2 border-l-4 border-red-500"></div>
            <span className="text-sm text-gray-600">À supprimer</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-blue-100 rounded-md mr-2">
              <div className="text-[8px] text-center text-blue-800 font-medium">Cours</div>
            </div>
            <span className="text-sm text-gray-600">Cours réservé</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-yellow-100 rounded-md mr-2 border-2 border-yellow-500"></div>
            <span className="text-sm text-gray-600">Sélectionné pour suppression</span>
          </div>
        </div>
      </div>

      {/* Modal d'ajout */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Ajouter une disponibilité</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Jour</label>
                <select
                  value={newSlot.day}
                  onChange={(e) => setNewSlot({...newSlot, day: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  {days.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Heure de début</label>
                <input
                  type="text"
                  value={newSlot.startTime.replace(':', 'h')}
                  onChange={(e) => {
                    const value = e.target.value.replace('h', ':');
                    setNewSlot({...newSlot, startTime: value});
                  }}
                  placeholder="14h30"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Heure de fin</label>
                <input
                  type="text"
                  value={newSlot.endTime.replace(':', 'h')}
                  onChange={(e) => {
                    const value = e.target.value.replace('h', ':');
                    setNewSlot({...newSlot, endTime: value});
                  }}
                  placeholder="16h00"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <p className="mt-1 text-sm text-gray-500">Durée minimale : 1h30</p>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddAvailability}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar; 