import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import ParentDashboard from './components/ParentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import ManagerDashboard from './components/ManagerDashboard';
import HeroSection from './components/HeroSection';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import CompleteManagerRegistration from './components/CompleteManagerRegistration';
import CompleteTeacherRegistration from './components/CompleteTeacherRegistration';

// Composant de redirection personnalisé
const AuthRedirect = ({ to }) => {
  const navigate = useNavigate();
  React.useEffect(() => {
    navigate(to);
  }, [navigate, to]);
  return null;
};

function App() {
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });

  React.useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const isAuthenticated = () => {
    try {
      const token = sessionStorage.getItem('token');
      const userStr = sessionStorage.getItem('user');
      
      if (!token || !userStr) {
        return false;
      }

      const user = JSON.parse(userStr);
      if (!user || !user.role || !user.id) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        return false;
      }

      return true;
    } catch (error) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      return false;
    }
  };

  const getUserRole = () => {
    try {
      const userStr = sessionStorage.getItem('user');
      if (!userStr) return null;
      const user = JSON.parse(userStr);
      return user.role || null;
    } catch {
      return null;
    }
  };

  return (
    <Router>
      <div className="min-h-screen">
        <Navbar isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
        <Routes>
          <Route path="/" element={
            isAuthenticated() ? (
              <AuthRedirect to={`/${getUserRole()}/dashboard`} />
            ) : (
              <HeroSection isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
            )
          } />
          
          <Route path="/login" element={
            isAuthenticated() ? (
              <AuthRedirect to={`/${getUserRole()}/dashboard`} />
            ) : (
              <Login isDarkMode={isDarkMode} />
            )
          } />
          
          <Route path="/register" element={
            isAuthenticated() ? (
              <AuthRedirect to={`/${getUserRole()}/dashboard`} />
            ) : (
              <Register />
            )
          } />
          
          <Route path="/admin/login" element={
            isAuthenticated() && getUserRole() === 'admin' ? (
              <AuthRedirect to="/admin/dashboard" />
            ) : (
              <AdminLogin />
            )
          } />
          
          <Route path="/admin/dashboard/*" element={
            <PrivateRoute>
              <AdminDashboard />
            </PrivateRoute>
          } />
          
          <Route path="/parent/dashboard/*" element={
            <PrivateRoute>
              <ParentDashboard />
            </PrivateRoute>
          } />
          
          <Route path="/teacher/dashboard/*" element={
            <PrivateRoute>
              <TeacherDashboard />
            </PrivateRoute>
          } />
          
          <Route path="/manager/dashboard/*" element={
            <PrivateRoute>
              <ManagerDashboard />
            </PrivateRoute>
          } />

          <Route path="/complete-manager-registration" element={<CompleteManagerRegistration />} />
          <Route path="/complete-teacher-registration" element={<CompleteTeacherRegistration />} />
          
          <Route path="*" element={
            isAuthenticated() ? (
              <Navigate to={`/${getUserRole()}/dashboard`} />
            ) : (
              <Navigate to="/" />
            )
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 