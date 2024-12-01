import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TeachersList from './manager/TeachersList';
import MessagesSection from './manager/MessagesSection';

// Ajouter le composant TeacherModal
const TeacherModal = ({ onClose, setError }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    speciality: 'mathematics',
    level: ['college']
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/manager/create-teacher',
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }

      onClose();
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
        <span class="font-medium">Invitation envoyée avec succès</span>
      `;
      
      document.body.appendChild(notification);

      setTimeout(() => {
        notification.classList.add('animate-slide-out-right');
        setTimeout(() => {
          notification.remove();
        }, 500);
      }, 3000);

    } catch (error) {
      setError(error.response?.data?.message || 'Erreur lors de la création du professeur');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Inviter un professeur</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Prénom</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Nom</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Spécialité</label>
            <select
              value={formData.speciality}
              onChange={(e) => setFormData({ ...formData, speciality: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="mathematics">Mathématiques</option>
              <option value="physics">Physique</option>
              <option value="chemistry">Chimie</option>
              <option value="biology">Biologie</option>
              <option value="computer_science">Informatique</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Niveaux</label>
            <div className="mt-2 space-y-2">
              {['college', 'lycee', 'superieur', 'adulte'].map((level) => (
                <label key={level} className="inline-flex items-center mr-4">
                  <input
                    type="checkbox"
                    checked={formData.level.includes(level)}
                    onChange={(e) => {
                      const newLevels = e.target.checked
                        ? [...formData.level, level]
                        : formData.level.filter(l => l !== level);
                      setFormData({ ...formData, level: newLevels });
                    }}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {level === 'college' ? 'Collège' :
                     level === 'lycee' ? 'Lycée' :
                     level === 'superieur' ? 'Supérieur' : 'Adulte'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {isLoading ? 'Envoi...' : 'Inviter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const [activeSection, setActiveSection] = useState('teachers');
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [error, setError] = useState('');

  // Gestion de la sélection d'un professeur
  const handleTeacherClick = (teacher) => {
    setSelectedTeacher(teacher);
    setActiveSection('teacherDetails');
  };

  // Composant pour afficher les détails d'un professeur
  const TeacherDetails = () => {
    const [availabilities, setAvailabilities] = useState([]);
    
    useEffect(() => {
      const fetchAvailabilities = async () => {
        if (!selectedTeacher) return;
        
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(
            `http://localhost:5000/api/manager/teacher/${selectedTeacher._id}/availabilities`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          setAvailabilities(response.data);
        } catch (error) {
          console.error('Erreur lors du chargement des disponibilités:', error);
        }
      };

      fetchAvailabilities();
    }, []); // Supprimé selectedTeacher des dépendances

    if (!selectedTeacher) return null;

    // ... reste du code de TeacherDetails ...
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-bold text-indigo-600">CyberMathIA</span>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-4">
                {user?.firstName} {user?.lastName}
              </span>
              <button
                onClick={() => {
                  localStorage.clear();
                  navigate('/login');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white h-[calc(100vh-4rem)] shadow-sm">
          <div className="p-4">
            <button
              onClick={() => setShowTeacherModal(true)}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
              Inviter un professeur
            </button>
          </div>

          <nav className="mt-4">
            <button
              onClick={() => {
                setActiveSection('teachers');
                setSelectedTeacher(null);
              }}
              className={`w-full flex items-center px-4 py-2 text-sm font-medium ${
                activeSection === 'teachers'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
              Liste des professeurs
            </button>
            <button
              onClick={() => {
                setActiveSection('messages');
                setSelectedTeacher(null);
              }}
              className={`w-full flex items-center px-4 py-2 text-sm font-medium ${
                activeSection === 'messages'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Messages
            </button>
          </nav>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 p-8">
          {activeSection === 'teachers' && (
            <TeachersList onTeacherClick={handleTeacherClick} />
          )}
          {activeSection === 'teacherDetails' && <TeacherDetails />}
          {activeSection === 'messages' && <MessagesSection />}
        </div>
      </div>

      {/* Modal d'invitation de professeur */}
      {showTeacherModal && (
        <TeacherModal
          onClose={() => setShowTeacherModal(false)}
          setError={setError}
        />
      )}
    </div>
  );
};

export default ManagerDashboard; 