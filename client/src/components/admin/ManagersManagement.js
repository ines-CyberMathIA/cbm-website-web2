import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const ManagersManagement = () => {
  const [managers, setManagers] = useState([]);
  const [pendingManagers, setPendingManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    fetchManagers();
    fetchPendingManagers();
  }, []);

  const fetchManagers = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:5000/api/admin/users/manager',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setManagers(response.data);
      setLoading(false);
    } catch (err) {
      showTemporaryError('Erreur lors du chargement des managers');
      setLoading(false);
    }
  };

  const fetchPendingManagers = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:5000/api/admin/pending-managers',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPendingManagers(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement des invitations:', err);
    }
  };

  // Fonction utilitaire pour afficher les messages de succès temporaires
  const showSuccessNotification = (message) => {
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
      <span class="font-medium">${message}</span>
    `;
    
    document.body.appendChild(notification);

    // Animation de sortie
    setTimeout(() => {
      notification.classList.add('animate-slide-out-right');
      setTimeout(() => {
        notification.remove();
      }, 500);
    }, 3000);
  };

  // Fonction pour afficher une erreur temporaire
  const showTemporaryError = (message) => {
    setErrorMessage(message);
    setTimeout(() => {
      setErrorMessage(null);
    }, 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Sauvegarder les données du formulaire avant de le réinitialiser
    const submittedData = { ...formData };
    
    // Fermer la modale et réinitialiser le formulaire immédiatement
    setShowAddForm(false);
    setFormData({ firstName: '', lastName: '', email: '' });

    try {
      const token = sessionStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/admin/create-manager',
        submittedData,  // Utiliser les données sauvegardées
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Rafraîchir les données et afficher la notification de succès
      await refreshData();
      showSuccessNotification(`Invitation envoyée avec succès à ${submittedData.email}`);

    } catch (err) {
      // En cas d'erreur, afficher l'erreur sans rouvrir la modale
      showTemporaryError(err.response?.data?.message || 'Erreur lors de la création du manager');
    }
  };

  const handleCancelInvitation = (invitationId) => {
    setPendingAction({
      type: 'cancel',
      id: invitationId,
      title: "Annuler l'invitation",
      message: "Êtes-vous sûr de vouloir annuler cette invitation ? Un email sera envoyé pour informer la personne."
    });
    setShowConfirmModal(true);
  };

  const handleDeleteManager = (managerId) => {
    setPendingAction({
      type: 'delete',
      id: managerId,
      title: "Supprimer le manager",
      message: "Êtes-vous sûr de vouloir supprimer ce manager ? Cette action est irréversible."
    });
    setShowConfirmModal(true);
  };

  const handleResendInvitation = async (invitationId) => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/admin/pending-managers/${invitationId}/resend`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Afficher un message de succès temporaire
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg';
      successMessage.textContent = 'Invitation renvoyée avec succès';
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        successMessage.remove();
      }, 3000);
    } catch (error) {
      console.error('Erreur lors du renvoi de l\'invitation:', error);
      showTemporaryError('Erreur lors du renvoi de l\'invitation');
    }
  };

  const handleConfirmAction = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        showTemporaryError('Session expirée, veuillez vous reconnecter');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      // Fermer la modal immédiatement
      setShowConfirmModal(false);
      setPendingAction(null);
      
      if (pendingAction.type === 'cancel') {
        await axios.delete(
          `http://localhost:5000/api/admin/pending-managers/${pendingAction.id}`,
          { headers }
        );
        await refreshData();
        showSuccessNotification("L'invitation a été annulée avec succès");
      } else if (pendingAction.type === 'delete') {
        await axios.delete(
          `http://localhost:5000/api/admin/users/${pendingAction.id}`,
          { headers }
        );
        await refreshData();
        showSuccessNotification("Le manager a été supprimé avec succès");
      }
    } catch (error) {
      showTemporaryError(
        error.response?.data?.message || 
        `Erreur lors de ${pendingAction.type === 'cancel' ? "l'annulation" : 'la suppression'}`
      );
    }
  };

  const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600 mb-6">{message}</p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                Confirmer
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Améliorer la fonction refreshData pour être plus robuste
  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        showTemporaryError('Session expirée, veuillez vous reconnecter');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Récupérer les données en parallèle
      const [managersResponse, pendingResponse] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/users/manager', { headers }),
        axios.get('http://localhost:5000/api/admin/pending-managers', { headers })
      ]);

      console.log('Managers actifs reçus:', managersResponse.data);
      console.log('Invitations en attente reçues:', pendingResponse.data);

      // Mettre à jour les états avec les nouvelles données
      setManagers(managersResponse.data || []);
      setPendingManagers(pendingResponse.data || []);

      // Vérifier si les données ont été mises à jour
      console.log('État managers mis à jour:', managersResponse.data);
      console.log('État pendingManagers mis à jour:', pendingResponse.data);

      // Forcer le re-rendu du composant
      setIsRefreshing(false);
      showSuccessNotification(`${pendingResponse.data.length} invitation(s) en attente trouvée(s)`);

    } catch (error) {
      console.error('Erreur lors du rafraîchissement des données:', error);
      showTemporaryError('Erreur lors du rafraîchissement des données');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Ajouter un useEffect pour surveiller les changements de pendingManagers
  useEffect(() => {
    console.log('pendingManagers a changé:', pendingManagers);
  }, [pendingManagers]);

  // Rafraîchir les données au chargement initial du composant
  useEffect(() => {
    refreshData();
  }, []);

  // Rafraîchir les données toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-full">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Managers</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300"
        >
          Ajouter un Manager
        </button>
      </div>

      {/* Bouton de rafraîchissement déplacé ici */}
      <div className="mb-4">
        <button
          onClick={refreshData}
          disabled={isRefreshing}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 focus:outline-none flex items-center space-x-2 bg-white rounded-lg shadow-sm hover:shadow transition-all duration-300"
        >
          {isRefreshing ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Rafraîchissement...</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Rafraîchir les données</span>
            </>
          )}
        </button>
      </div>

      {/* Section des invitations en attente */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Invitations en attente ({pendingManagers.length})
        </h2>
        
        {pendingManagers.length > 0 ? (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date d'invitation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expire dans
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingManagers.map((manager) => {
                  const expiresIn = new Date(manager.createdAt).getTime() + 24*60*60*1000 - Date.now();
                  const hoursLeft = Math.floor(expiresIn / (1000 * 60 * 60));
                  const minutesLeft = Math.floor((expiresIn % (1000 * 60 * 60)) / (1000 * 60));
                  
                  return (
                    <tr key={manager._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {manager.firstName} {manager.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{manager.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(manager.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          {hoursLeft}h {minutesLeft}m
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleCancelInvitation(manager._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={() => handleResendInvitation(manager._id)}
                          className="ml-4 text-blue-600 hover:text-blue-900"
                        >
                          Renvoyer
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4 text-gray-500 text-center">
            Aucune invitation en attente
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg m-4"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Ajouter un Manager</h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prénom
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Cet email sera utilisé pour la connexion et l'envoi du lien d'activation
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setFormData({ firstName: '', lastName: '', email: '' });
                      setErrorMessage(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Inviter
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nom
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date de création
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {managers.map((manager) => (
              <tr key={manager._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {manager.firstName} {manager.lastName}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{manager.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(manager.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleDeleteManager(manager._id)}
                    className="text-red-600 hover:text-red-900 transition-colors duration-200"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setPendingAction(null);
        }}
        onConfirm={handleConfirmAction}
        title={pendingAction?.title}
        message={pendingAction?.message}
      />

      {/* Message d'erreur avec animation */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManagersManagement; 