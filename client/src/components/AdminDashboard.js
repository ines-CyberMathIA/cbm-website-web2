import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTeachers: 0,
    totalStudents: 0,
    totalParents: 0,
    totalManagers: 0
  });
  const [usersList, setUsersList] = useState([]);
  const [activeSection, setActiveSection] = useState('overview');
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [formState, setFormState] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [modalError, setModalError] = useState('');

  // Vérification de l'authentification admin
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin-login');
    }
  }, [navigate, user]);

  // Fonction pour récupérer les statistiques
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  // Charger les statistiques au montage du composant
  useEffect(() => {
    fetchStats();
  }, []);

  // Charger la liste des utilisateurs par rôle
  const fetchUsersByRole = async (role) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5001/api/admin/users/${role}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsersList(response.data);
      setSelectedRole(role);
      setActiveSection('users');
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Composant pour afficher la liste des utilisateurs
  const UsersList = () => {
    if (!selectedRole) return null;

    return (
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Liste des {selectedRole}s</h2>
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {usersList.map((user) => (
              <li key={user._id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-indigo-600 truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <div className="flex items-center">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {user.role}
                      </span>
                      <span className="ml-2 text-sm text-gray-500">
                        Inscrit le {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  // Gestionnaire d'événements simplifié
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5001/api/admin/create-manager',
        formState,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Rafraîchir les statistiques et la liste
      await fetchStats();
      if (selectedRole === 'manager') {
        await fetchUsersByRole('manager');
      }

      // Réinitialiser et fermer
      setFormState({
        firstName: '',
        lastName: '',
        email: ''
      });
      setShowManagerModal(false);
      alert('Un email a été envoyé au manager pour finaliser la création de son compte');
    } catch (error) {
      setModalError(error.response?.data?.message || 'Erreur lors de la création du manager');
    } finally {
      setLoading(false);
    }
  };

  // Modal simplifié
  const ManagerModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-8 border w-96 shadow-2xl rounded-2xl bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Inviter un nouveau manager</h3>
          <button
            onClick={() => setShowManagerModal(false)}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {modalError && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <p className="text-red-700">{modalError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <input
                type="text"
                name="firstName"
                value={formState.firstName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input
                type="text"
                name="lastName"
                value={formState.lastName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formState.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowManagerModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? 'Envoi...' : 'Inviter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-bold text-emerald-600">Admin CyberMathIA</span>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-4">Admin</span>
              <button
                onClick={() => {
                  localStorage.clear();
                  navigate('/admin-login');
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
        <div className="w-64 bg-white h-screen shadow-sm">
          <nav className="mt-5 px-2">
            <button
              onClick={() => {
                setActiveSection('overview');
                setSelectedRole(null);
              }}
              className={`group flex items-center px-2 py-2 text-base font-medium rounded-md w-full ${
                activeSection === 'overview' ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Vue d'ensemble
            </button>
            <button
              onClick={() => setShowManagerModal(true)}
              className="mt-2 group flex items-center px-2 py-2 text-base font-medium rounded-md w-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
            >
              <svg className="mr-3 h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
              Créer un manager
            </button>
          </nav>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 p-8">
          {/* Statistiques générales */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {/* Total Utilisateurs */}
            <div 
              className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => fetchUsersByRole('all')}
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Utilisateurs
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.totalUsers}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Professeurs */}
            <div 
              className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => fetchUsersByRole('teacher')}
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Professeurs
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.totalTeachers}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Étudiants */}
            <div 
              className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => fetchUsersByRole('student')}
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Étudiants
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.totalStudents}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Parents */}
            <div 
              className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => fetchUsersByRole('parent')}
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Parents
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.totalParents}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Managers */}
            <div 
              className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => fetchUsersByRole('manager')}
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Managers
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.totalManagers}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Liste des utilisateurs */}
          {activeSection === 'users' && <UsersList />}
        </div>
      </div>

      {/* Modal de création de manager */}
      {showManagerModal && <ManagerModal />}
    </div>
  );
};

export default AdminDashboard; 