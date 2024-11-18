import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

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
  const [showDeleteButtons, setShowDeleteButtons] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Vérification de l'authentification admin
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin-login');
    }
  }, [navigate, user]);

  // Fonction pour récupérer les statistiques
  const fetchStats = async () => {
    try {
      console.log('Récupération des statistiques...');
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Statistiques reçues:', response.data);
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
      console.log('Récupération des utilisateurs pour le rôle:', role);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/admin/users/${role}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`Utilisateurs trouvés: ${response.data.length}`);
      setUsersList(response.data);
      setSelectedRole(role);
      setActiveSection('users');
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour ouvrir la modal de confirmation
  const handleDeleteClick = (user) => {
    console.log('Ouverture de la modal de suppression pour:', user);
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  // Fonction pour effectuer la suppression
  const confirmDelete = async () => {
    try {
      console.log('Tentative de suppression de l\'utilisateur:', userToDelete._id);
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/users/${userToDelete._id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Mettre à jour la liste des utilisateurs
      setUsersList(usersList.filter(user => user._id !== userToDelete._id));

      // Mettre à jour les statistiques
      setStats(prev => ({
        ...prev,
        [`total${userToDelete.role.charAt(0).toUpperCase() + userToDelete.role.slice(1)}s`]: prev[`total${userToDelete.role.charAt(0).toUpperCase() + userToDelete.role.slice(1)}s`] - 1,
        totalUsers: prev.totalUsers - 1
      }));

      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setModalError(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  // Modal de confirmation de suppression
  const DeleteConfirmationModal = () => {
    return (
      <Transition appear show={showDeleteModal} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setShowDeleteModal(false)}
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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Confirmer la suppression
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Êtes-vous sûr de vouloir supprimer le compte de{' '}
                      <span className="font-medium text-gray-700">
                        {userToDelete?.firstName} {userToDelete?.lastName}
                      </span>
                      {' '}({userToDelete?.role}) ?
                    </p>
                    <p className="mt-2 text-sm text-red-500">
                      Cette action est irréversible.
                    </p>
                  </div>

                  <div className="mt-4 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      onClick={() => setShowDeleteModal(false)}
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                      onClick={confirmDelete}
                    >
                      Supprimer
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    );
  };

  // Composant pour afficher la liste des utilisateurs
  const UsersList = () => {
    if (!selectedRole) return null;

    return (
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Liste des {selectedRole}s</h2>
          {selectedRole !== 'admin' && (
            <button
              onClick={() => setShowDeleteButtons(!showDeleteButtons)}
              className={`px-4 py-2 rounded-md flex items-center ${
                showDeleteButtons ? 'bg-gray-200 text-gray-700' : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {showDeleteButtons ? 'Terminer' : 'Gérer les comptes'}
            </button>
          )}
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <ul className="divide-y divide-gray-200">
            {usersList.map((user) => (
              <li key={user._id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-indigo-800 font-medium">
                          {user.firstName[0]}{user.lastName[0]}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.email}
                      </div>
                    </div>
                    <span className="ml-4 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                      {user.role}
                    </span>
                  </div>
                  {showDeleteButtons && user.role !== 'admin' && (
                    <button
                      onClick={() => handleDeleteClick(user)}
                      className="ml-2 inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-opacity duration-200"
                    >
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Supprimer
                    </button>
                  )}
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

  // Modal simplifié avec gestion correcte des événements
  const ManagerModal = () => {
    // État local du formulaire dans le modal
    const [localFormState, setLocalFormState] = useState({
      firstName: '',
      lastName: '',
      email: ''
    });

    // Gestionnaire d'événements local
    const handleLocalChange = (e) => {
      const { name, value } = e.target;
      setLocalFormState(prev => ({
        ...prev,
        [name]: value
      }));
    };

    // Soumission locale
    const handleLocalSubmit = async (e) => {
      e.preventDefault();
      setModalError('');
      setLoading(true);

      try {
        const token = localStorage.getItem('token');
        await axios.post(
          'http://localhost:5001/api/admin/create-manager',
          localFormState,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        await fetchStats();
        if (selectedRole === 'manager') {
          await fetchUsersByRole('manager');
        }

        setShowManagerModal(false);
        alert('Un email a été envoyé au manager pour finaliser la création de son compte');
      } catch (error) {
        setModalError(error.response?.data?.message || 'Erreur lors de la création du manager');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full z-50"
        onClick={() => setShowManagerModal(false)}
      >
        <div 
          className="relative top-20 mx-auto p-8 border w-96 shadow-2xl rounded-2xl bg-white"
          onClick={e => e.stopPropagation()}
        >
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

          <form onSubmit={handleLocalSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                <input
                  type="text"
                  name="firstName"
                  value={localFormState.firstName}
                  onChange={handleLocalChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                  required
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  name="lastName"
                  value={localFormState.lastName}
                  onChange={handleLocalChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                  required
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={localFormState.email}
                  onChange={handleLocalChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                  required
                  autoComplete="off"
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
  };

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
      <DeleteConfirmationModal />
    </div>
  );
};

export default AdminDashboard; 