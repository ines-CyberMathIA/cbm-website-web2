import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ConnectionHistory = () => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'today', 'week', 'month'

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:5000/api/admin/connections',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConnections(response.data);
      setLoading(false);
    } catch (err) {
      setError('Erreur lors du chargement de l\'historique des connexions');
      setLoading(false);
    }
  };

  const filterConnections = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const week = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const month = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return connections.filter(connection => {
      const date = new Date(connection.timestamp);
      switch (filter) {
        case 'today':
          return date >= today;
        case 'week':
          return date >= week;
        case 'month':
          return date >= month;
        default:
          return true;
      }
    });
  };

  if (loading) return (
    <div className="flex justify-center items-center h-full">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
    </div>
  );

  const filteredConnections = filterConnections();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Historique des Connexions</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Toutes les connexions</option>
          <option value="today">Aujourd'hui</option>
          <option value="week">Cette semaine</option>
          <option value="month">Ce mois</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Utilisateur
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rôle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date et Heure
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                IP
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Navigateur
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredConnections.map((connection, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {connection.userName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    connection.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    connection.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                    connection.role === 'teacher' ? 'bg-green-100 text-green-800' :
                    connection.role === 'parent' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {connection.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(connection.timestamp).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {connection.ip}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {connection.userAgent}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ConnectionHistory; 