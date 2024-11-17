import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TeachersList = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await axios.get('http://localhost:5003/api/manager/my-teachers', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setTeachers(response.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des professeurs:', error);
        setError('Impossible de charger la liste des professeurs');
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
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
        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
          {teachers.length} professeur{teachers.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="border-t border-gray-200">
        <ul className="divide-y divide-gray-200">
          {teachers.map((teacher) => (
            <li key={teacher._id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-800 font-medium">
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
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Créé le {new Date(teacher.createdAt).toLocaleDateString('fr-FR')}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TeachersList; 