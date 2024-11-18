import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TeachersList from './manager/TeachersList';
import MessagesSection from './manager/MessagesSection';
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
    const [availabilities, setAvailabilities] = useState([]);
    
    useEffect(() => {
      const fetchAvailabilities = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(
            `http://localhost:5000/api/manager/teacher/${selectedTeacher._id}/availabilities`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          console.log('Disponibilités reçues:', response.data);
          setAvailabilities(response.data);
        } catch (error) {
          console.error('Erreur lors du chargement des disponibilités:', error);
        }
      };

      if (selectedTeacher) {
        fetchAvailabilities();
      }
    }, [selectedTeacher]);

    if (!selectedTeacher) return null;

    // Fonction pour formater les horaires
    const formatTimeSlots = (availabilities) => {
      const slots = {};
      availabilities.forEach(slot => {
        if (!slots[slot.day]) {
          slots[slot.day] = [];
        }
        slots[slot.day].push(`${slot.startTime} - ${slot.endTime}`);
      });
      return slots;
    };

    const timeSlots = formatTimeSlots(availabilities);

    const WeeklyCalendar = ({ availabilities }) => {
      const hours = Array.from({ length: 32 }, (_, i) => {
        const hour = Math.floor(i / 2) + 6;
        const minutes = i % 2 === 0 ? '00' : '30';
        return `${hour.toString().padStart(2, '0')}:${minutes}`;
      });

      const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

      const isAvailable = (day, time) => {
        return availabilities.some(slot => {
          const slotStart = slot.startTime;
          const slotEnd = slot.endTime;
          return slot.day === day && time >= slotStart && time < slotEnd;
        });
      };

      return (
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* En-tête des jours */}
            <div className="grid grid-cols-8 bg-gray-50" style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)' }}>
              <div className="border-b border-r border-gray-200 bg-gray-50 h-10 flex items-center justify-center"></div>
              {days.map(day => (
                <div
                  key={day}
                  className="border-b border-r border-gray-200 h-10 flex items-center justify-center font-medium text-gray-700"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Grille des horaires */}
            <div className="relative">
              {hours.map((time) => (
                <div key={time} className="grid" style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)' }}>
                  <div className="border-b border-r border-gray-200 bg-gray-50 h-8 flex items-center justify-center text-xs text-gray-500">
                    {time}
                  </div>
                  {days.map(day => (
                    <div
                      key={`${day}-${time}`}
                      className={`border-b border-r border-gray-200 h-8 ${
                        isAvailable(day, time)
                          ? 'bg-green-100'
                          : 'bg-white'
                      }`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    };

    const Chat = ({ teacherId }) => {
      const [messages, setMessages] = useState([]);
      const [newMessage, setNewMessage] = useState('');
      const [loading, setLoading] = useState(false);
      const messagesEndRef = useRef(null);
      const user = JSON.parse(localStorage.getItem('user'));

      const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      };

      useEffect(() => {
        const fetchMessages = async () => {
          try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
              `http://localhost:5000/api/manager/messages/${teacherId}`,
              {
                headers: { Authorization: `Bearer ${token}` }
              }
            );
            setMessages(response.data);
            scrollToBottom();
          } catch (error) {
            console.error('Erreur lors de la récupération des messages:', error);
          }
        };

        fetchMessages();
        // Mettre en place un polling toutes les 5 secondes
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
      }, [teacherId]);

      const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setLoading(true);
        try {
          const token = localStorage.getItem('token');
          const response = await axios.post(
            `http://localhost:5000/api/manager/messages/${teacherId}`,
            { content: newMessage },
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          setMessages([...messages, response.data]);
          setNewMessage('');
          scrollToBottom();
        } catch (error) {
          console.error('Erreur lors de l\'envoi du message:', error);
        } finally {
          setLoading(false);
        }
      };

      return (
        <div className="bg-white rounded-lg shadow-lg p-4 h-[500px] flex flex-col">
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message._id}
                className={`flex ${message.sender._id === user.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    message.sender._id === user.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs mt-1 opacity-75">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Écrivez votre message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={loading || !newMessage.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Envoi...' : 'Envoyer'}
            </button>
          </form>
        </div>
      );
    };

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

        {/* Section du calendrier */}
        <div className="mt-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Horaires disponibles</h3>
            <div className="bg-white rounded-lg shadow">
              <WeeklyCalendar availabilities={availabilities} />
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <div className="flex items-center mr-4">
                <div className="w-3 h-3 bg-green-100 border border-green-500 rounded mr-2"></div>
                <span>Disponible</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-white border border-gray-200 rounded mr-2"></div>
                <span>Non disponible</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section chat */}
        <div className="mt-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Chat avec {selectedTeacher.firstName}</h3>
            <Chat teacherId={selectedTeacher._id} />
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
  const [isLoading, setIsLoading] = useState(false);

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
    setIsLoading(true);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/manager/create-teacher',
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      onClose();
      window.location.reload();
    } catch (error) {
      setError(error.response?.data?.message || 'Erreur lors de la création du professeur');
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Créer un nouveau professeur</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prénom
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Spécialité
              </label>
              <select
                name="speciality"
                value={formData.speciality}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="mathematics">Mathématiques</option>
                <option value="physics">Physique</option>
                <option value="chemistry">Chimie</option>
                <option value="biology">Biologie</option>
                <option value="computer_science">Informatique</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Niveaux d'enseignement
              </label>
              <div className="space-y-2">
                {['college', 'lycee', 'superieur', 'adulte'].map((level) => (
                  <label key={level} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      value={level}
                      checked={formData.level.includes(level)}
                      onChange={handleLevelChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {isLoading ? 'Création...' : 'Créer le professeur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManagerDashboard; 