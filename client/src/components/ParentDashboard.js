import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './dashboard/Sidebar';
import Tutorial from './dashboard/Tutorial';
import AddChild from './dashboard/AddChild';
import ChildDashboard from './dashboard/ChildDashboard';

const ParentDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const [selectedChild, setSelectedChild] = useState(null);
  const [activeSection, setActiveSection] = useState('tutorial');
  const [children, setChildren] = useState([]);

  // Vérification de l'authentification
  React.useEffect(() => {
    if (!user || user.role !== 'parent') {
      navigate('/login');
    }
  }, [navigate, user]);

  // Gestion du contenu principal
  const renderContent = () => {
    switch (activeSection) {
      case 'tutorial':
        return <Tutorial />;
      case 'addChild':
        return <AddChild onChildAdded={(child) => {
          setChildren([...children, child]);
          setActiveSection(child.id); // Rediriger vers le dashboard de l'enfant
        }} />;
      default:
        // Si activeSection est un ID d'enfant
        const child = children.find(c => c.id === activeSection);
        return child ? <ChildDashboard child={child} /> : <Tutorial />;
    }
  };

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
        <Sidebar
          children={children}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        {/* Contenu principal */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ParentDashboard; 