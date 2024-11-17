import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TeachersList from './manager/TeachersList';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const [activeSection, setActiveSection] = useState('overview');
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [stats, setStats] = useState({
    totalTeachers: 0,
    activeTeachers: 0,
    totalSessions: 0,
    upcomingSessions: 0,
    averageRating: 0
  });
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Vérification de l'authentification manager
  useEffect(() => {
    if (!user || user.role !== 'manager') {
      navigate('/login');
    }
  }, [navigate, user]);

  // Charger la liste des professeurs
  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/manager/teachers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeachers(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des professeurs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger les professeurs au montage du composant
  useEffect(() => {
    fetchTeachers();
  }, []);

  // Modal pour créer un professeur
  const TeacherModal = () => {
    const [formData, setFormData] = useState({
      firstName: '',
      lastName: '',
      email: '',
      speciality: '',
      level: []
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
          'http://localhost:5001/api/manager/create-teacher',
          formData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        setShowTeacherModal(false);
        fetchTeachers();  // Rafraîchir la liste des professeurs
        alert('Un email a été envoyé au professeur pour finaliser son inscription');
      } catch (error) {
        setError(error.response?.data?.message || 'Erreur lors de la création du professeur');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-8 border w-[600px] shadow-2xl rounded-2xl bg-white">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Inviter un nouveau professeur</h3>
            <button
              onClick={() => setShowTeacherModal(false)}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                <input
                  type="text"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Spécialité</label>
              <select
                name="speciality"
                required
                value={formData.speciality}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Sélectionner une spécialité</option>
                <option value="mathematics">Mathématiques</option>
                <option value="physics">Physique</option>
                <option value="chemistry">Chimie</option>
                <option value="biology">Biologie</option>
                <option value="computer_science">Informatique</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Niveaux d'enseignement</label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      value="college"
                      checked={formData.level.includes('college')}
                      onChange={handleLevelChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2">Collège</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      value="lycee"
                      checked={formData.level.includes('lycee')}
                      onChange={handleLevelChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2">Lycée</span>
                  </label>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      value="superieur"
                      checked={formData.level.includes('superieur')}
                      onChange={handleLevelChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2">Supérieur</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      value="adulte"
                      checked={formData.level.includes('adulte')}
                      onChange={handleLevelChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2">Formation adulte</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowTeacherModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Envoi...' : 'Inviter le professeur'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'teachers':
        return <TeachersList />;
      default:
        return <div>Tableau de bord</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-bold text-indigo-600">Manager CyberMathIA</span>
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

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* En-tête avec bouton d'action */}
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Tableau de bord</h1>
          <button
            onClick={() => setShowTeacherModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            Ajouter un professeur
          </button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* ... Cartes de statistiques ... */}
        </div>

        {/* Liste des professeurs */}
        <div className="mt-8">
          {/* ... Liste des professeurs ... */}
        </div>
      </div>

      {/* Modal de création de professeur */}
      {showTeacherModal && <TeacherModal />}
    </div>
  );
};

export default ManagerDashboard; 