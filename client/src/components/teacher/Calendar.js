import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Calendar = () => {
  const [view, setView] = useState('weekly');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availabilities, setAvailabilities] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSlot, setNewSlot] = useState({
    day: 'Lundi',
    startTime: '08:00',
    endTime: '09:00'
  });

  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const hours = Array.from({ length: 17 }, (_, i) => `${(i + 6).toString().padStart(2, '0')}:00`);

  // Charger les disponibilités existantes
  useEffect(() => {
    const fetchAvailabilities = async () => {
      try {
        const response = await axios.get('http://localhost:5003/api/teacher/availabilities', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setAvailabilities(response.data);
      } catch (error) {
        console.error('Erreur lors du chargement des disponibilités:', error);
      }
    };

    fetchAvailabilities();
  }, []);

  // Fonction pour vérifier si une plage horaire respecte la durée minimale
  const isValidDuration = (startTime, endTime) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffInMinutes = (end - start) / (1000 * 60);
    return diffInMinutes >= 90; // 1h30 = 90 minutes
  };

  // Fonction pour vérifier si l'ajout/suppression d'un créneau maintient la durée minimale
  const wouldMaintainMinimumDuration = (day, time, isAdding) => {
    // Trouver tous les créneaux contigus pour ce jour
    const dayAvailabilities = availabilities
      .filter(a => a.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Simuler l'ajout ou la suppression du créneau
    let newAvailabilities = [...dayAvailabilities];
    if (isAdding) {
      newAvailabilities.push({ startTime: time, endTime: addMinutes(time, 30) });
    } else {
      newAvailabilities = newAvailabilities.filter(a => 
        !(a.startTime <= time && addMinutes(time, 30) <= a.endTime)
      );
    }

    // Fusionner les créneaux contigus
    const mergedSlots = mergeContiguousSlots(newAvailabilities);

    // Vérifier que chaque plage fusionnée respecte la durée minimale
    return mergedSlots.every(slot => isValidDuration(slot.startTime, slot.endTime));
  };

  // Fonction utilitaire pour ajouter des minutes à une heure au format "HH:mm"
  const addMinutes = (time, minutes) => {
    const [hours, mins] = time.split(':').map(Number);
    const date = new Date(2000, 0, 1, hours, mins);
    date.setMinutes(date.getMinutes() + minutes);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  // Fonction pour fusionner les créneaux contigus
  const mergeContiguousSlots = (slots) => {
    if (slots.length === 0) return [];
    
    const sortedSlots = slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
    const merged = [{ ...sortedSlots[0] }];

    for (let i = 1; i < sortedSlots.length; i++) {
      const current = sortedSlots[i];
      const previous = merged[merged.length - 1];

      if (previous.endTime === current.startTime) {
        previous.endTime = current.endTime;
      } else {
        merged.push({ ...current });
      }
    }

    return merged;
  };

  // Modification de handleAddAvailability pour inclure la vérification
  const handleAddAvailability = () => {
    if (!isValidDuration(newSlot.startTime, newSlot.endTime)) {
      setError("La durée minimale d'une disponibilité doit être de 1h30");
      return;
    }

    const newAvailability = {
      id: `${newSlot.day}-${newSlot.startTime}-${newSlot.endTime}`,
      day: newSlot.day,
      startTime: newSlot.startTime,
      endTime: newSlot.endTime
    };

    // Vérifier que l'ajout maintient la durée minimale pour les créneaux existants
    if (!wouldMaintainMinimumDuration(newSlot.day, newSlot.startTime, true)) {
      setError("Cette modification créerait une plage horaire inférieure à 1h30");
      return;
    }

    setAvailabilities([...availabilities, newAvailability]);
    setShowAddModal(false);
    setError(null);
  };

  // Modification du modal d'ajout pour inclure la validation
  const handleTimeChange = (field, value) => {
    const updatedSlot = { ...newSlot, [field]: value };
    if (field === 'startTime') {
      // Calculer automatiquement une heure de fin minimum de 1h30
      const minEndTime = addMinutes(value, 90);
      if (updatedSlot.endTime < minEndTime) {
        updatedSlot.endTime = minEndTime;
      }
    }
    setNewSlot(updatedSlot);
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec navigation et bouton d'ajout */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Planning des disponibilités
          </h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter une disponibilité
          </button>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() - 7)))}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            ←
          </button>
          <span className="font-medium">
            {selectedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + 7)))}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            →
          </button>
        </div>
      </div>

      {/* Grille du calendrier */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-8 border-b">
          {/* Cellule vide pour la colonne des heures */}
          <div className="border-r"></div>
          {/* En-têtes des jours */}
          {days.map(day => (
            <div key={day} className="text-center font-semibold py-2 border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Corps du calendrier */}
        <div className="overflow-y-auto max-h-[600px]">
          {hours.map(hour => (
            <div key={hour} className="grid grid-cols-8 border-b last:border-b-0">
              {/* Colonne des heures */}
              <div className="border-r p-2 text-sm font-medium text-gray-500 bg-gray-50">
                {hour}
              </div>
              {/* Cellules pour chaque jour */}
              {days.map(day => {
                const hasAvailability = availabilities.some(a => 
                  a.day === day && 
                  a.startTime <= hour && 
                  a.endTime > hour
                );
                const hasCourse = courses.some(c => 
                  c.day === day && 
                  c.startTime <= hour && 
                  c.endTime > hour
                );

                return (
                  <div
                    key={`${day}-${hour}`}
                    className={`border-r last:border-r-0 p-2 min-h-[60px] ${
                      hasCourse
                        ? 'bg-blue-50'
                        : hasAvailability
                        ? 'bg-green-50'
                        : ''
                    }`}
                  >
                    {hasCourse && (
                      <div className="text-xs bg-blue-100 rounded p-1">
                        Cours réservé
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Modal d'ajout de disponibilité */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Ajouter une disponibilité</h3>
            {error && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 text-red-700">
                {error}
              </div>
            )}
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
                  type="time"
                  value={newSlot.startTime}
                  onChange={(e) => handleTimeChange('startTime', e.target.value)}
                  min="06:00"
                  max="22:00"
                  step="1800"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Heure de fin</label>
                <input
                  type="time"
                  value={newSlot.endTime}
                  onChange={(e) => handleTimeChange('endTime', e.target.value)}
                  min={addMinutes(newSlot.startTime, 90)}
                  max="22:00"
                  step="1800"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Durée minimale : 1h30
                </p>
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

      {/* Légende */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-medium mb-2">Légende</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-white border rounded mr-2"></div>
            <span className="text-sm">Non disponible</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-50 rounded mr-2"></div>
            <span className="text-sm">Disponible</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-50 rounded mr-2"></div>
            <span className="text-sm">Cours réservé</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar; 