import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './admin/Sidebar';
import Overview from './admin/Overview';  // Le dashboard actuel
import ManagersManagement from './admin/ManagersManagement';
import UsersList from './admin/UsersList';
import UserRelations from './admin/UserRelations';
import ConnectionHistory from './admin/ConnectionHistory';

const AdminDashboard = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/managers" element={<ManagersManagement />} />
          <Route path="/users" element={<UsersList />} />
          <Route path="/relations" element={<UserRelations />} />
          <Route path="/connections" element={<ConnectionHistory />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminDashboard; 