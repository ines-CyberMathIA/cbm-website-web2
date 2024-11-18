import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TeachersList from './manager/TeachersList';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showTeacherDetails, setShowTeacherDetails] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherAvailabilities, setTeacherAvailabilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Vérification de l'authentification manager
  useEffect(() => {
    if (!user || user.role !== 'manager') {
      navigate('/login');
    }
  }, [navigate, user]);

  // Fonction pour charger les disponibilités d'un professeur
  const loadTeacherAvailabilities = async (teacherId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/teacher/${teacherId}/availabilities`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Disponibilités chargées:', response.data);
      setTeacherAvailabilities(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des disponibilités:', error);
      setError('Impossible de charger les disponibilités');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour ouvrir les détails d'un professeur
  const handleTeacherClick = async (teacher) => {
    console.log('Professeur sélectionné:', teacher);
    if (teacher.status === 'active') {
      setSelectedTeacher(teacher);
      await loadTeacherAvailabilities(teacher._id);
      setShowTeacherDetails(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">
              Dashboard Manager
            </h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            {/* Section des actions */}
            <div className="px-4 py-6 sm:px-0">
              <div className="flex justify-end mb-6">
                <button
                  onClick={() => setShowTeacherModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Inviter un professeur
                </button>
              </div>

              {/* Liste des professeurs */}
              <div className="bg-white shadow rounded-lg">
                <TeachersList onTeacherClick={handleTeacherClick} />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal pour créer un professeur */}
      {showTeacherModal && (
        <TeacherModal
          onClose={() => setShowTeacherModal(false)}
          setError={setError}
          setLoading={setLoading}
        />
      )}

      {/* Modal des détails du professeur */}
      <Transition appear show={showTeacherDetails} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setShowTeacherDetails(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  {selectedTeacher && (
                    <>
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-medium leading-6 text-gray-900 mb-4"
                      >
                        Détails du professeur
                      </Dialog.Title>
                      
                      {/* Informations du professeur */}
                      <div className="mb-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Nom complet</h4>
                            <p className="mt-1 text-sm text-gray-900">
                              {selectedTeacher.firstName} {selectedTeacher.lastName}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Email</h4>
                            <p className="mt-1 text-sm text-gray-900">{selectedTeacher.email}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Spécialité</h4>
                            <p className="mt-1 text-sm text-gray-900">{selectedTeacher.speciality}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Niveaux</h4>
                            <p className="mt-1 text-sm text-gray-900">
                              {selectedTeacher.level?.join(', ')}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Disponibilités */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Disponibilités</h4>
                        {teacherAvailabilities.length > 0 ? (
                          <div className="border rounded-lg divide-y">
                            {teacherAvailabilities.map((availability, index) => (
                              <div key={index} className="p-3">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">{availability.day}</span>
                                  <span className="text-sm text-gray-500">
                                    {availability.startTime} - {availability.endTime}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">
                            Aucune disponibilité définie
                          </p>
                        )}
                      </div>

                      <div className="mt-6 flex justify-end">
                        <button
                          type="button"
                          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-900 hover:bg-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                          onClick={() => setShowTeacherDetails(false)}
                        >
                          Fermer
                        </button>
                      </div>
                    </>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
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