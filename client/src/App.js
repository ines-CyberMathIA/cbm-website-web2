import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import ParentDashboard from './components/ParentDashboard';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import ManagerDashboard from './components/ManagerDashboard';
import CompleteManagerRegistration from './components/CompleteManagerRegistration';
import CompleteTeacherRegistration from './components/CompleteTeacherRegistration';

const Home = () => {
  return (
    <div className="relative min-h-screen">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold text-white">CyberMathIA</div>
          <div className="hidden md:flex space-x-8">
            <a href="#" className="text-white hover:text-indigo-200 transition">Accueil</a>
            <a href="#" className="text-white hover:text-indigo-200 transition">Cours</a>
            <a href="#" className="text-white hover:text-indigo-200 transition">Tarifs</a>
            <a href="#" className="text-white hover:text-indigo-200 transition">Contact</a>
          </div>
          <div>
            <a href="/login" className="bg-white text-indigo-600 px-6 py-2 rounded-full font-medium hover:bg-indigo-50 transition">
              Connexion
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative gradient-bg">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-40">
          <div className="text-center relative z-10">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
              Propulsez<br/>Vos Moyennes !
            </h1>
            <p className="text-xl md:text-2xl text-indigo-100 mb-12 max-w-3xl mx-auto">
              La plateforme de cours en ligne en mathématiques et informatique 
              qui accompagne les élèves du collège au lycée vers la réussite.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a href="/register" className="inline-block bg-white text-indigo-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-indigo-50 transition shadow-lg">
                Créer un compte gratuit
              </a>
              <a href="#features" className="inline-block border-2 border-white text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-indigo-600 transition">
                Découvrir nos formules
              </a>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gray-50 geometric-bg" style={{clipPath: 'polygon(0 100%, 100% 100%, 100% 0, 0 100%)'}}></div>
        
        {/* Floating Elements */}
        <div className="absolute top-1/4 left-1/4 w-12 h-12 bg-blue-500 rounded-full opacity-20 floating" style={{animationDelay: '0s'}}></div>
        <div className="absolute top-1/3 right-1/4 w-8 h-8 bg-purple-500 rounded-full opacity-20 floating" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-16 h-16 bg-indigo-500 rounded-full opacity-20 floating" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Features Preview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20" id="features">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-2xl shadow-xl">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Suivi Personnalisé</h3>
            <p className="text-gray-600">Un accompagnement sur mesure pour progresser à votre rythme et atteindre vos objectifs.</p>
          </div>

          <div className="p-6 bg-white rounded-2xl shadow-xl">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Experts Pédagogiques</h3>
            <p className="text-gray-600">Des cours rédigés par nos experts pour une compréhension optimale des concepts.</p>
          </div>

          <div className="p-6 bg-white rounded-2xl shadow-xl">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Coaching Réussite</h3>
            <p className="text-gray-600">Des méthodes et conseils personnalisés pour optimiser votre apprentissage et vos résultats.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/parent-dashboard" element={<ParentDashboard />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/manager-dashboard" element={<ManagerDashboard />} />
        <Route path="/complete-registration" element={<CompleteManagerRegistration />} />
        <Route path="/complete-teacher-registration" element={<CompleteTeacherRegistration />} />
      </Routes>
    </Router>
  );
}

export default App; 