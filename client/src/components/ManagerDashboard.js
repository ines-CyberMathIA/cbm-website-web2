import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TeachersList from './manager/TeachersList';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const [activeSection, setActiveSection] = useState('teachers');
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Gestion de la sélection d'un professeur
  const handleTeacherClick = (teacher) => {
    setSelectedTeacher(teacher);
    setActiveSection('teacherDetails');
  };

  // Composant pour afficher les détails d'un professeur
  const TeacherDetails = () => {
    if (!selectedTeacher) return null;

    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Détails du professeur
          </h2>
          <button
            onClick={() => {
              setSelectedTeacher(null);
              setActiveSection('teachers');
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2 md:col-span-1">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations personnelles</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nom complet</label>
                  <p className="mt-1 text-gray-900">{selectedTeacher.firstName} {selectedTeacher.lastName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="mt-1 text-gray-900">{selectedTeacher.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Spécialité</label>
                  <p className="mt-1 text-gray-900">{selectedTeacher.speciality}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Niveaux</label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {selectedTeacher.level?.map((level) => (
                      <span
                        key={level}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                      >
                        {level}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-2 md:col-span-1">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-sm font-medium text-gray-500">Cours donnés</div>
                  <div className="mt-1 text-2xl font-semibold text-indigo-600">0</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-sm font-medium text-gray-500">Élèves actifs</div>
                  <div className="mt-1 text-2xl font-semibold text-indigo-600">0</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-sm font-medium text-gray-500">Heures de cours</div>
                  <div className="mt-1 text-2xl font-semibold text-indigo-600">0h</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="text-sm font-medium text-gray-500">Note moyenne</div>
                  <div className="mt-1 text-2xl font-semibold text-indigo-600">-</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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
              Créer un professeur
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
          </nav>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 p-8">
          {activeSection === 'teachers' && (
            <TeachersList onTeacherClick={handleTeacherClick} />
          )}
          {activeSection === 'teacherDetails' && <TeacherDetails />}
        </div>
      </div>

      {/* Modal de création de professeur */}
      {showTeacherModal && (
        <TeacherModal
          onClose={() => setShowTeacherModal(false)}
          setError={setError}
          setLoading={setLoading}
        />
      )}
    </div>
  );
};

// Composant Modal pour créer un professeur
const TeacherModal = ({ onClose, setError, setLoading }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    speciality: 'mathematics',
    level: ['college']
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLevelChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      level: checked 
        ? [...prev.level, value]
        : prev.level.filter(l => l !== value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/manager/create-teacher',
        formData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      onClose();
      window.location.reload(); // Rafraîchir la page pour voir le nouveau professeur
    } catch (error) {
      console.error('Erreur détaillée:', error.response?.data || error);
      setError(error.response?.data?.message || 'Erreur lors de la création du professeur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Inviter un nouveau professeur
          </h3>
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Prénom</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Nom</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Spécialité</label>
              <select
                name="speciality"
                value={formData.speciality}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="mathematics">Mathématiques</option>
                <option value="physics">Physique</option>
                <option value="chemistry">Chimie</option>
                <option value="biology">Biologie</option>
                <option value="computer_science">Informatique</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Niveaux</label>
              <div className="mt-2 space-y-2">
                {['college', 'lycee', 'superieur', 'adulte'].map((level) => (
                  <div key={level} className="flex items-center">
                    <input
                      type="checkbox"
                      id={level}
                      value={level}
                      checked={formData.level.includes(level)}
                      onChange={handleLevelChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor={level} className="ml-2 text-sm text-gray-700">
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
              >
                Inviter
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard; 