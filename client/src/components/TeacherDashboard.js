import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const [activeSection, setActiveSection] = useState('overview');

  // Vérification de l'authentification
  React.useEffect(() => {
    if (!user || user.role !== 'teacher') {
      navigate('/login');
    }
  }, [navigate, user]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar supérieure */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-bold text-indigo-600">CyberMathIA</span>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-4">Bienvenue, {user?.firstName}</span>
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

      {/* Layout principal */}
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200">
          <nav className="mt-5 px-2">
            <a href="#" className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-indigo-600 bg-indigo-50">
              Vue d'ensemble
            </a>
            <a href="#" className="mt-1 group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900">
              Mes cours
            </a>
            <a href="#" className="mt-1 group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900">
              Mes élèves
            </a>
            <a href="#" className="mt-1 group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900">
              Planning
            </a>
            <a href="#" className="mt-1 group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900">
              Ressources
            </a>
          </nav>
        </div>

        {/* Contenu principal */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-semibold text-gray-900">
              Tableau de bord professeur
            </h1>
            {/* Contenu à venir */}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TeacherDashboard; 