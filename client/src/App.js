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
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  const location = useLocation();
  const isDashboardPage = location.pathname.includes('/dashboard');

  return (
    <ThemeProvider>
      <AuthProvider>
        <div>
          {!isDashboardPage && <Navbar />}
          <Routes>
            <Route 
              path="/" 
              element={<HeroSection />} 
            />

            <Route 
              path="/login" 
              element={<Login />} 
            />

            <Route 
              path="/register" 
              element={<Register />}
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
                  <AdminDashboard />
                </PrivateRoute>
              }
            />

            <Route
              path="/parent/dashboard/*"
              element={
                <PrivateRoute role="parent">
                  <ParentDashboard />
                </PrivateRoute>
              }
            />

            <Route
              path="/teacher/dashboard/*"
              element={
                <PrivateRoute role="teacher">
                  <TeacherDashboard />
                </PrivateRoute>
              }
            />

            <Route
              path="/manager/dashboard/*"
              element={
                <PrivateRoute role="manager">
                  <ManagerDashboard />
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
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;