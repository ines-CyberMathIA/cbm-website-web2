import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Fonction pour formater le temps restant
const formatTimeLeft = (expiresAt) => {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry - now;
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours < 0 || minutes < 0) return 'Expiré';
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

const TeachersList = ({ onTeacherClick }) => {
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={handleRetry}
              className="mt-2 text-sm font-medium text-red-600 hover:text-red-500"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900">
            Mes Professeurs
          </h3>
          <div className="flex space-x-4">
            <span className="px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium">
              {teachers.filter(t => t.status === 'active').length} actif(s)
            </span>
            <span className="px-4 py-2 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium">
              {teachers.filter(t => t.status === 'pending').length} en attente
            </span>
          </div>
        </div>
      </div>

      {teachers.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun professeur</h3>
          <p className="mt-1 text-sm text-gray-500">Commencez par inviter un professeur à rejoindre votre équipe.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {/* Section des invitations en attente */}
          {teachers.filter(t => t.status === 'pending').length > 0 && (
            <div className="p-6">
              <h4 className="text-sm font-medium text-gray-500 mb-4">Invitations en attente</h4>
              <div className="space-y-4">
                {teachers.filter(t => t.status === 'pending').map((teacher) => (
                  <div key={teacher._id} className="bg-yellow-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h5 className="text-sm font-medium text-gray-900">
                          {teacher.firstName} {teacher.lastName}
                        </h5>
                        <p className="text-sm text-gray-500">{teacher.email}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Expire dans: {formatTimeLeft(teacher.expiresAt)}
                        </p>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleResendInvitation(teacher._id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                        >
                          Renvoyer
                        </button>
                        <button
                          onClick={() => handleCancelInvitation(teacher._id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section des professeurs actifs */}
          <div className="p-6">
            <h4 className="text-sm font-medium text-gray-500 mb-4">Professeurs actifs</h4>
            <div className="space-y-4">
              {teachers.filter(t => t.status === 'active').map((teacher) => (
                <div
                  key={teacher._id}
                  onClick={() => onTeacherClick(teacher)}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h5 className="text-sm font-medium text-gray-900">
                        {teacher.firstName} {teacher.lastName}
                      </h5>
                      <p className="text-sm text-gray-500">{teacher.email}</p>
                      <div className="flex mt-2 space-x-2">
                        {teacher.speciality && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {formatSpeciality(teacher.speciality)}
                          </span>
                        )}
                        {teacher.level?.map((lvl) => (
                          <span key={lvl} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {formatLevel(lvl)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachersList; 