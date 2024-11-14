import React from 'react';
import { useNavigate } from 'react-router-dom';

const ParentDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  // Vérifier si l'utilisateur est connecté et est un parent
  React.useEffect(() => {
    if (!user || user.role !== 'parent') {
      navigate('/login');
    }
  }, [navigate, user]);

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-bold text-indigo-600">CyberMathIA</span>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700">Bienvenue, {user?.firstName}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-4">
            <h1 className="text-2xl font-bold text-gray-900">Tableau de bord Parent</h1>
            <div className="mt-4">
              <h2 className="text-xl font-semibold">Mes enfants</h2>
              {/* Liste des enfants à implémenter */}
              <button className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md">
                Ajouter un enfant
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard; 