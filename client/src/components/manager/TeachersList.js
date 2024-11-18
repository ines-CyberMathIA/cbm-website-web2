import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TeachersList = ({ onTeacherClick }) => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTeachers = async () => {
    try {
      console.log('Récupération des professeurs...');
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/manager/my-teachers', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('Professeurs reçus:', response.data);
      setTeachers(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des professeurs:', error);
      setError('Impossible de charger la liste des professeurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Charger initialement
    fetchTeachers();

    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchTeachers, 30000);

    // Nettoyer l'intervalle
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Mes Professeurs
        </h3>
        <div className="flex items-center space-x-4">
          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
            {teachers.filter(t => t.status === 'active').length} actif(s)
          </span>
          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            {teachers.filter(t => t.status === 'pending').length} en attente
          </span>
        </div>
      </div>
      <div className="border-t border-gray-200">
        {teachers.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            Aucun professeur pour le moment
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {teachers.map((teacher) => (
              <li 
                key={teacher._id} 
                className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer"
                onClick={() => onTeacherClick(teacher)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        teacher.status === 'active' ? 'bg-green-100' : 'bg-yellow-100'
                      }`}>
                        <span className={`font-medium ${
                          teacher.status === 'active' ? 'text-green-800' : 'text-yellow-800'
                        }`}>
                          {teacher.firstName[0]}{teacher.lastName[0]}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {teacher.firstName} {teacher.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {teacher.email}
                      </div>
                      <div className="text-xs text-gray-400">
                        Spécialité: {teacher.speciality}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      Créé le {new Date(teacher.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                    {teacher.status === 'pending' && (
                      <div className="flex items-center space-x-2">
                        <div className="text-xs text-yellow-600">
                          Expire le {new Date(teacher.expiresAt).toLocaleString('fr-FR')}
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              const token = localStorage.getItem('token');
                              await axios.delete(`http://localhost:5000/api/manager/pending-teachers/${teacher._id}`, {
                                headers: { Authorization: `Bearer ${token}` }
                              });
                              // Rafraîchir la liste
                              fetchTeachers();
                            } catch (error) {
                              console.error('Erreur lors de la suppression de l\'invitation:', error);
                            }
                          }}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Annuler l'invitation
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TeachersList; 