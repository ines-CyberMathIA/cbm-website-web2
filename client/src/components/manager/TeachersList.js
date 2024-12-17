import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import config from '../../config';

// Fonction pour formater le temps restant
const formatTimeLeft = (expiresAt) => {
  if (!expiresAt) {
    const now = new Date();
    // Si pas de date d'expiration, on considère que l'invitation est valide pour 24h à partir de maintenant
    expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  }
  
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry - now;
  
  // Si la différence est négative, l'invitation est expirée
  if (diff <= 0) return 'Expiré';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}j ${remainingHours}h`;
  }
  
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

const TeachersList = ({ onTeacherClick, isDarkMode, onInviteClick }) => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Utiliser useRef pour stocker l'intervalle
  const intervalRef = useRef(null);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const response = await axios.get(
        `${config.API_URL}/api/manager/my-teachers`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );
      
      if (response.data) {
        setTeachers(response.data);
        setError(null);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des professeurs:', error);
      setError(error.message || 'Erreur lors de la récupération des professeurs');
    } finally {
      setLoading(false);
      setLastUpdate(Date.now());
    }
  };

  useEffect(() => {
    fetchTeachers();

    // Mettre à jour toutes les 30 secondes
    intervalRef.current = setInterval(() => {
      fetchTeachers();
    }, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  if (loading && teachers.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-600">
        <p>{error}</p>
        <button 
          onClick={fetchTeachers}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

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
    <div className="space-y-12 p-6">
      {error && (
        <div className={`
          mb-4 p-4 rounded-xl shadow-lg
          ${isDarkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-100 text-red-700'}
          animate-fade-in transform transition-all duration-300
        `}>
          {error}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Professeurs
          </h1>
          <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Gérez vos professeurs et leurs invitations
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleRefresh}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Rafraîchir la liste"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={onInviteClick}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-blue-600 hover:bg-blue-700'
            } transition-colors duration-200 shadow-sm`}
          >
            <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            Inviter un professeur
          </button>
        </div>
      </div>

      {/* Section des invitations en attente */}
      <div className="transform transition-all duration-300 hover:translate-y-[-2px]">
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} flex items-center space-x-3`}>
            <span className={`inline-block w-2 h-2 rounded-full ${isDarkMode ? 'bg-yellow-400' : 'bg-yellow-500'} animate-pulse`}></span>
            <span>Invitations en attente</span>
          </h2>
          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {teachers.filter(t => t.status === 'pending').length} invitation(s)
          </span>
        </div>

        <div className={`
          overflow-hidden rounded-xl border mb-12
          ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'}
          shadow-lg backdrop-blur-sm
          transition-all duration-300 hover:shadow-xl
        `}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className={`${isDarkMode ? 'bg-gray-800/80' : 'bg-gray-50'}`}>
              <tr>
                <th scope="col" className={`px-6 py-4 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Professeur
                </th>
                <th scope="col" className={`px-6 py-4 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Spécialité
                </th>
                <th scope="col" className={`px-6 py-4 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Niveaux
                </th>
                <th scope="col" className={`px-6 py-4 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Temps restant
                </th>
                <th scope="col" className={`px-6 py-4 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`${isDarkMode ? 'bg-gray-900/50' : 'bg-white'} divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center space-x-3">
                      <div className={`animate-spin rounded-full h-6 w-6 border-2 ${isDarkMode ? 'border-blue-500' : 'border-indigo-600'} border-t-transparent`}></div>
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Chargement des invitations...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : teachers.filter(t => t.status === 'pending').length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center">
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Aucune invitation en attente
                    </div>
                  </td>
                </tr>
              ) : (
                teachers
                  .filter(teacher => teacher.status === 'pending')
                  .map((teacher) => (
                    <tr 
                      key={teacher._id}
                      className={`
                        group hover:${isDarkMode ? 'bg-gray-800/70' : 'bg-gray-50'}
                        transition-all duration-200
                      `}
                    >
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`
                            h-12 w-12 rounded-xl
                            ${isDarkMode ? 'bg-gray-800 group-hover:bg-gray-700' : 'bg-gray-100 group-hover:bg-gray-200'}
                            flex items-center justify-center
                            transition-all duration-200
                          `}>
                            <span className={`text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {teacher.firstName.charAt(0)}{teacher.lastName.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {teacher.firstName} {teacher.lastName}
                            </div>
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {teacher.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`
                          px-3 py-1.5 inline-flex items-center
                          text-xs font-medium rounded-full
                          transition-all duration-200
                          ${isDarkMode 
                            ? 'bg-gray-800 text-gray-300 group-hover:bg-gray-700' 
                            : 'bg-gray-100 text-gray-700 group-hover:bg-gray-200'}
                        `}>
                          {formatSpeciality(teacher.speciality)}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex flex-wrap gap-2">
                          {teacher.level.map((level) => (
                            <span
                              key={level}
                              className={`
                                px-3 py-1.5 inline-flex items-center
                                text-xs font-medium rounded-full
                                transition-all duration-200
                                ${isDarkMode 
                                  ? 'bg-gray-800 text-gray-300 group-hover:bg-gray-700' 
                                  : 'bg-gray-100 text-gray-700 group-hover:bg-gray-200'}
                              `}
                            >
                              {formatLevel(level)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`
                          px-3 py-1.5 inline-flex items-center
                          text-xs font-medium rounded-full
                          transition-all duration-200
                          ${isDarkMode 
                            ? 'bg-yellow-900/30 text-yellow-300 group-hover:bg-yellow-900/50' 
                            : 'bg-yellow-100 text-yellow-800 group-hover:bg-yellow-200'}
                        `}>
                          {formatTimeLeft(calculateExpiryTime(teacher.createdAt))}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResendInvitation(teacher._id);
                            }}
                            className={`
                              inline-flex items-center px-3 py-1.5 rounded-lg
                              text-sm font-medium
                              transition-all duration-200
                              ${isDarkMode 
                                ? 'bg-blue-900/30 text-blue-300 hover:bg-blue-900/50' 
                                : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}
                            `}
                          >
                            <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Renvoyer
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelInvitation(teacher._id);
                            }}
                            className={`
                              inline-flex items-center px-3 py-1.5 rounded-lg
                              text-sm font-medium
                              transition-all duration-200
                              ${isDarkMode 
                                ? 'bg-red-900/30 text-red-300 hover:bg-red-900/50' 
                                : 'bg-red-100 text-red-800 hover:bg-red-200'}
                            `}
                          >
                            <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Annuler
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section des professeurs actifs */}
      <div className="transform transition-all duration-300 hover:translate-y-[-2px]">
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} flex items-center space-x-3`}>
            <span className={`inline-block w-2 h-2 rounded-full ${isDarkMode ? 'bg-green-400' : 'bg-green-500'} animate-pulse`}></span>
            <span>Professeurs actifs</span>
          </h2>
          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {teachers.filter(t => t.status === 'active').length} professeur(s)
          </span>
        </div>
        
        <div className={`
          overflow-hidden rounded-xl border
          ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'}
          shadow-lg backdrop-blur-sm
          transition-all duration-300 hover:shadow-xl
        `}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className={`${isDarkMode ? 'bg-gray-800/80' : 'bg-gray-50'}`}>
              <tr>
                <th scope="col" className={`px-6 py-4 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Professeur
                </th>
                <th scope="col" className={`px-6 py-4 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Spécialité
                </th>
                <th scope="col" className={`px-6 py-4 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Niveaux
                </th>
                <th scope="col" className={`px-6 py-4 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`${isDarkMode ? 'bg-gray-900/50' : 'bg-white'} divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center space-x-3">
                      <div className={`animate-spin rounded-full h-6 w-6 border-2 ${isDarkMode ? 'border-blue-500' : 'border-indigo-600'} border-t-transparent`}></div>
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Chargement des professeurs...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : teachers.filter(t => t.status === 'active').length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center">
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Aucun professeur actif
                    </div>
                  </td>
                </tr>
              ) : (
                teachers
                  .filter(teacher => teacher.status === 'active')
                  .map((teacher) => (
                    <tr 
                      key={teacher._id}
                      className={`
                        group hover:${isDarkMode ? 'bg-gray-800/70' : 'bg-gray-50'} 
                        cursor-pointer transition-all duration-200
                      `}
                      onClick={() => onTeacherClick(teacher)}
                    >
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`
                            h-12 w-12 rounded-xl
                            ${isDarkMode ? 'bg-blue-900/30 group-hover:bg-blue-900/50' : 'bg-blue-100 group-hover:bg-blue-200'}
                            flex items-center justify-center
                            transition-all duration-200
                          `}>
                            <span className={`text-lg font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                              {teacher.firstName.charAt(0)}{teacher.lastName.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                              {teacher.firstName} {teacher.lastName}
                            </div>
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {teacher.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`
                          px-3 py-1.5 inline-flex items-center
                          text-xs font-medium rounded-full
                          transition-all duration-200
                          ${isDarkMode 
                            ? 'bg-purple-900/30 text-purple-300 group-hover:bg-purple-900/50' 
                            : 'bg-purple-100 text-purple-800 group-hover:bg-purple-200'}
                        `}>
                          {formatSpeciality(teacher.speciality)}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex flex-wrap gap-2">
                          {teacher.level.map((level) => (
                            <span
                              key={level}
                              className={`
                                px-3 py-1.5 inline-flex items-center
                                text-xs font-medium rounded-full
                                transition-all duration-200
                                ${isDarkMode 
                                  ? 'bg-green-900/30 text-green-300 group-hover:bg-green-900/50' 
                                  : 'bg-green-100 text-green-800 group-hover:bg-green-200'}
                              `}
                            >
                              {formatLevel(level)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTeacherClick(teacher);
                          }}
                          className={`
                            inline-flex items-center px-4 py-2 rounded-lg
                            text-sm font-medium
                            transition-all duration-200
                            ${isDarkMode 
                              ? 'bg-blue-900/30 text-blue-300 hover:bg-blue-900/50' 
                              : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}
                          `}
                        >
                          <span>Voir détails</span>
                          <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeachersList;