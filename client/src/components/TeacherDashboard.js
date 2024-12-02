import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from './teacher/Calendar';
import StudentsList from './teacher/StudentsList';
import CourseLibrary from './teacher/CourseLibrary';
import SessionReports from './teacher/SessionReports';
import Messages from './teacher/Messages';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem('user'));
  const [activeSection, setActiveSection] = useState('calendar');

  // Vérification de l'authentification
  React.useEffect(() => {
    if (!user || user.role !== 'teacher') {
      navigate('/login');
    }
  }, [navigate, user]);

  // Rendu du contenu principal
  const renderContent = () => {
    switch (activeSection) {
      case 'calendar':
        return <Calendar />;
      case 'students':
        return <StudentsList />;
      case 'courses':
        return <CourseLibrary />;
      case 'reports':
        return <SessionReports />;
      case 'messages':
        return <Messages />;
      default:
        return <Calendar />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
                  sessionStorage.clear();
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
          <nav className="mt-5 px-2 space-y-2">
            <button
              onClick={() => setActiveSection('calendar')}
              className={`w-full flex items-center px-2 py-2 text-base font-medium rounded-md ${
                activeSection === 'calendar'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <svg className="mr-3 h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Calendrier
            </button>

            <button
              onClick={() => setActiveSection('students')}
              className={`w-full flex items-center px-2 py-2 text-base font-medium rounded-md ${
                activeSection === 'students'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <svg className="mr-3 h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Mes élèves
            </button>

            <button
              onClick={() => setActiveSection('courses')}
              className={`w-full flex items-center px-2 py-2 text-base font-medium rounded-md ${
                activeSection === 'courses'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <svg className="mr-3 h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Bibliothèque de cours
            </button>

            <button
              onClick={() => setActiveSection('reports')}
              className={`w-full flex items-center px-2 py-2 text-base font-medium rounded-md ${
                activeSection === 'reports'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <svg className="mr-3 h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Comptes rendus
            </button>

            <button
              onClick={() => setActiveSection('messages')}
              className={`w-full flex items-center px-2 py-2 text-base font-medium rounded-md ${
                activeSection === 'messages'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <svg className="mr-3 h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Messages
            </button>
          </nav>
        </div>

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

export default TeacherDashboard; 