import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserRelations = () => {
  const [managers, setManagers] = useState([]);
  const [selectedManager, setSelectedManager] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchManagers();
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
      setError('Erreur lors du chargement des managers');
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-full">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
    </div>
  );

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Relations Utilisateurs</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Liste des managers */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Managers</h2>
          <div className="space-y-4">
            {managers.map((manager) => (
              <div
                key={manager._id}
                onClick={() => setSelectedManager(manager)}
                className={`p-4 rounded-lg cursor-pointer transition-colors ${
                  selectedManager?._id === manager._id
                    ? 'bg-indigo-50 border-2 border-indigo-500'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="font-medium">{manager.firstName} {manager.lastName}</div>
                <div className="text-sm text-gray-600">{manager.email}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Détails du manager sélectionné */}
        {selectedManager && (
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">
                Détails de {selectedManager.firstName} {selectedManager.lastName}
              </h2>
              
              {/* Statistiques */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Email</div>
                  <div className="font-medium">{selectedManager.email}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">Date de création</div>
                  <div className="font-medium">
                    {new Date(selectedManager.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Liste des professeurs gérés */}
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Professeurs gérés</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Cette partie nécessite une API pour récupérer les professeurs liés */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="font-medium">Professeur 1</div>
                    <div className="text-sm text-gray-600">email@example.com</div>
                  </div>
                  {/* ... autres professeurs ... */}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserRelations; 