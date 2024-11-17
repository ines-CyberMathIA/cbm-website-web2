import React, { useState } from 'react';

const Calendar = () => {
  const [view, setView] = useState('weekly'); // 'weekly' ou 'monthly'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availabilities, setAvailabilities] = useState([]);
  const [courses, setCourses] = useState([]);

  // Générer les créneaux horaires pour la vue hebdomadaire
  const generateWeeklySlots = () => {
    const slots = [];
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const hours = ['14:00', '15:00', '16:00', '17:00', '18:00'];

    days.forEach(day => {
      hours.forEach(hour => {
        slots.push({
          id: `${day}-${hour}`,
          day,
          hour,
          available: availabilities.includes(`${day}-${hour}`),
          course: courses.find(c => c.day === day && c.hour === hour)
        });
      });
    });

    return slots;
  };

  // Générer le calendrier mensuel
  const generateMonthlyCalendar = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Ajouter les jours du mois
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      days.push({
        date,
        courses: courses.filter(c => {
          const courseDate = new Date(c.date);
          return courseDate.toDateString() === date.toDateString();
        })
      });
    }

    return days;
  };

  // Sauvegarder les disponibilités
  const handleSaveAvailabilities = async () => {
    try {
      // TODO: Appel API pour sauvegarder les disponibilités
      console.log('Sauvegarde des disponibilités:', availabilities);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec sélecteur de vue */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {view === 'weekly' ? 'Planning hebdomadaire' : 'Calendrier mensuel'}
        </h2>
        <div className="flex space-x-4">
          <button
            onClick={() => setView('weekly')}
            className={`px-4 py-2 rounded-md ${
              view === 'weekly'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Vue hebdomadaire
          </button>
          <button
            onClick={() => setView('monthly')}
            className={`px-4 py-2 rounded-md ${
              view === 'monthly'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Vue mensuelle
          </button>
        </div>
      </div>

      {/* Vue hebdomadaire */}
      {view === 'weekly' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-6 gap-4">
            {/* En-têtes des jours */}
            {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map(day => (
              <div key={day} className="text-center font-semibold py-2 bg-gray-50">
                {day}
              </div>
            ))}

            {/* Créneaux horaires */}
            {generateWeeklySlots().map(slot => (
              <button
                key={slot.id}
                onClick={() => {
                  if (slot.course) return; // Ne pas modifier si un cours est déjà prévu
                  setAvailabilities(prev =>
                    prev.includes(slot.id)
                      ? prev.filter(id => id !== slot.id)
                      : [...prev, slot.id]
                  );
                }}
                className={`p-2 text-sm rounded-md transition-colors ${
                  slot.course
                    ? 'bg-blue-100 text-blue-800 cursor-default'
                    : slot.available
                    ? 'bg-green-100 hover:bg-green-200 text-green-800'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }`}
              >
                {slot.hour}
                {slot.course && <div className="text-xs mt-1">{slot.course.title}</div>}
              </button>
            ))}
          </div>

          {/* Bouton de sauvegarde */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSaveAvailabilities}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Sauvegarder les disponibilités
            </button>
          </div>
        </div>
      )}

      {/* Vue mensuelle */}
      {view === 'monthly' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-7 gap-4">
            {/* En-têtes des jours */}
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
              <div key={day} className="text-center font-semibold">
                {day}
              </div>
            ))}

            {/* Jours du mois */}
            {generateMonthlyCalendar().map((day, index) => (
              <div
                key={index}
                className="min-h-[100px] border rounded-md p-2"
              >
                <div className="font-medium">{day.date.getDate()}</div>
                {day.courses.map((course, i) => (
                  <div
                    key={i}
                    className="text-xs mt-1 p-1 bg-blue-100 text-blue-800 rounded"
                  >
                    {course.title} - {course.hour}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Légende */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-medium mb-2">Légende</h3>
        <div className="flex space-x-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-100 rounded mr-2"></div>
            <span className="text-sm">Non disponible</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-100 rounded mr-2"></div>
            <span className="text-sm">Disponible</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-100 rounded mr-2"></div>
            <span className="text-sm">Cours prévu</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar; 