import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
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
import { AuthProvider } from './contexts/AuthContext';

function App() {
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });

  const location = useLocation();
  const isDashboardPage = location.pathname.includes('/dashboard');

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      {!isDashboardPage && <Navbar isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />}
      <AuthProvider>
        <Routes>
          <Route 
            path="/" 
            element={
              <HeroSection isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
            } 
          />

          <Route 
            path="/login" 
            element={
              <Login isDarkMode={isDarkMode} />
            } 
          />

          <Route 
            path="/register" 
            element={
              <Register />
            } 
          />

          <Route 
            path="/admin/login" 
            element={
              <AdminLogin />
            } 
          />

          <Route
            path="/admin/dashboard/*"
            element={
              <PrivateRoute role="admin">
                <AdminDashboard isDarkMode={isDarkMode} />
              </PrivateRoute>
            }
          />

          <Route
            path="/parent/dashboard/*"
            element={
              <PrivateRoute role="parent">
                <ParentDashboard isDarkMode={isDarkMode} />
              </PrivateRoute>
            }
          />

          <Route
            path="/teacher/dashboard/*"
            element={
              <PrivateRoute role="teacher">
                <TeacherDashboard isDarkMode={isDarkMode} />
              </PrivateRoute>
            }
          />

          <Route
            path="/manager/dashboard/*"
            element={
              <PrivateRoute role="manager">
                <ManagerDashboard isDarkMode={isDarkMode} />
              </PrivateRoute>
            }
          />

          <Route
            path="/complete-manager-registration"
            element={<CompleteManagerRegistration />}
          />

          <Route
            path="/complete-teacher-registration"
            element={<CompleteTeacherRegistration />}
          />

          <Route 
            path="*" 
            element={
              <Navigate to="/" replace />
            } 
          />
        </Routes>
      </AuthProvider>
    </div>
  );
}

export default App;