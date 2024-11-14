import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';

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
        {/* ... (reste du contenu de la hero section) ... */}
      </div>

      {/* Features Preview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* ... (reste du contenu des features) ... */}
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
      </Routes>
    </Router>
  );
}

export default App; 