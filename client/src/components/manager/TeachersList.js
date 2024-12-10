import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Fonction pour formater le temps restant
const formatTimeLeft = (expiresAt) => {
  if (!expiresAt) return 'Expiré';
  
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry - now;
  
  if (diff <= 0) return 'Expiré';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
};

// Fonction pour formater la spécialité
const formatSpeciality = (speciality) => {
  const mapping = {
    mathematics: 'Mathématiques',
    physics: 'Physique',
    chemistry: 'Chimie',
    biology: 'Biologie',
    computer_science: 'Informatique'
  };
  return mapping[speciality] || speciality;
};

// Fonction pour formater le niveau
const formatLevel = (level) => {
  const mapping = {
    college: 'Collège',
    lycee: 'Lycée',
    superieur: 'Supérieur',
    adulte: 'Adulte'
  };
  return mapping[level] || level;
};

const TeachersList = ({ onTeacherClick, isDarkMode }) => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Utiliser useRef pour stocker l'intervalle
  const intervalRef = React.useRef(null);

  const fetchTeachers = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error('Token manquant');
      }

      const response = await axios.get('http://localhost:5000/api/manager/my-teachers', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.data) {
        throw new Error('Données invalides reçues du serveur');
      }

      setTeachers(response.data);
      setError(null);
      setLoading(false);
      setLastUpdate(Date.now());
    } catch (error) {
      console.error('Erreur lors de la récupération des professeurs:', error);
      
      if (error.response?.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
        setLoading(false);
        return;
      }

      setError('Impossible de charger la liste des professeurs');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();

    // Mettre à jour toutes les 30 secondes au lieu de continuellement
    intervalRef.current = setInterval(() => {
      fetchTeachers();
    }, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Ajouter un gestionnaire d'événements pour le rafraîchissement manuel
  const handleRefresh = () => {
    setLoading(true);
    fetchTeachers();
  };

  const handleResendInvitation = async (teacherId) => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/manager/resend-invitation/${teacherId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      fetchTeachers();
    } catch (error) {
      setError('Erreur lors du renvoi de l\'invitation');
    }
  };

  const handleCancelInvitation = async (teacherId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette invitation ?')) {
      return;
    }

    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      
      console.log('Tentative d\'annulation pour:', {
        teacherId,
        token: token ? 'présent' : 'manquant'
      });

      const response = await axios.delete(
        `http://localhost:5000/api/manager/cancel-invitation/${teacherId}`,
        {
          headers: { 
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('Réponse de l\'annulation:', response.data);

      // Afficher une notification de succès
      const notification = document.createElement('div');
      notification.className = `
        fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50
        transform transition-all duration-500 ease-out
        flex items-center space-x-2
        animate-slide-in-right
      `;
      
      notification.innerHTML = `
        <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
        <span class="font-medium">Invitation annulée avec succès</span>
      `;
      
      document.body.appendChild(notification);

      setTimeout(() => {
        notification.classList.add('animate-slide-out-right');
        setTimeout(() => {
          notification.remove();
        }, 500);
      }, 3000);

      // Rafraîchir la liste immédiatement
      await fetchTeachers();

    } catch (error) {
      console.error('Erreur lors de l\'annulation:', error.response || error);
      
      const errorMessage = error.response?.data?.message || 
        error.response?.data?.details ||
        'Erreur lors de l\'annulation de l\'invitation';

      setError(errorMessage);

      // Afficher une notification d'erreur
      const errorNotification = document.createElement('div');
      errorNotification.className = `
        fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50
        transform transition-all duration-500 ease-out
        flex items-center space-x-2
        animate-slide-in-right
      `;
      
      errorNotification.innerHTML = `
        <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
        <span class="font-medium">${errorMessage}</span>
      `;
      
      document.body.appendChild(errorNotification);

      setTimeout(() => {
        errorNotification.classList.add('animate-slide-out-right');
        setTimeout(() => {
          errorNotification.remove();
        }, 500);
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    fetchTeachers();
  };

  const calculateExpiryTime = (createdAt) => {
    if (!createdAt) return null;
    const creationDate = new Date(createdAt);
    return new Date(creationDate.getTime() + 24 * 60 * 60 * 1000); // +24 heures
  };

  return (
    <div>
      {error && (
        <div className={`mb-4 p-4 rounded-lg ${isDarkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-100 text-red-700'}`}>
          {error}
        </div>
      )}

      <div className={`overflow-hidden rounded-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} shadow-sm`}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <tr>
              <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                Professeur
              </th>
              <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                Spécialité
              </th>
              <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                Niveaux
              </th>
              <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                Temps restant
              </th>
              <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center">
                  <div className={`animate-pulse text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Chargement des professeurs...
                  </div>
                </td>
              </tr>
            ) : teachers.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center">
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Aucun professeur trouvé
                  </div>
                </td>
              </tr>
            ) : (
              teachers.map((teacher) => (
                <tr 
                  key={teacher._id}
                  className={`hover:${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} cursor-pointer transition-colors duration-150`}
                  onClick={() => onTeacherClick(teacher)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`h-10 w-10 rounded-full ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'} flex items-center justify-center`}>
                        <span className={`text-lg font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                          {teacher.firstName.charAt(0)}{teacher.lastName.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                          {teacher.firstName} {teacher.lastName}
                        </div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {teacher.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${isDarkMode 
                        ? 'bg-purple-900/30 text-purple-300' 
                        : 'bg-purple-100 text-purple-800'}`}>
                      {formatSpeciality(teacher.speciality)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {teacher.level.map((level) => (
                        <span
                          key={level}
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${isDarkMode 
                              ? 'bg-green-900/30 text-green-300' 
                              : 'bg-green-100 text-green-800'}`}
                        >
                          {formatLevel(level)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${isDarkMode 
                        ? 'bg-yellow-900/30 text-yellow-300' 
                        : 'bg-yellow-100 text-yellow-800'}`}>
                      {formatTimeLeft(teacher.subscription?.expiresAt)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTeacherClick(teacher);
                      }}
                      className={`text-sm font-medium ${
                        isDarkMode 
                          ? 'text-blue-400 hover:text-blue-300' 
                          : 'text-blue-600 hover:text-blue-900'
                      }`}
                    >
                      Voir détails
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeachersList;