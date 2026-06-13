import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider }   from './context/ToastContext';
import { AuthProvider }    from './context/AuthContext';
import ProtectedRoute      from './components/ProtectedRoute';
import Layout              from './components/layout/Sidebar';

import Login           from './pages/Auth/Login';
import Signup          from './pages/Auth/Signup';
import Dashboard       from './pages/Dashboard';
import Customers       from './pages/Customers';
import CustomerProfile from './pages/Customers/CustomerProfile';
import Orders          from './pages/Orders';
import Segments        from './pages/Segments';
import Campaigns       from './pages/Campaigns';
import Analytics       from './pages/Analytics';
import AIAssistant     from './pages/AIAssistant';
import Settings        from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public */}
            <Route path="/login"  element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected — all inside Layout */}
            <Route path="/*" element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/"              element={<Dashboard />} />
                    <Route path="/customers"     element={<Customers />} />
                    <Route path="/customers/:id" element={<CustomerProfile />} />
                    <Route path="/orders"        element={<Orders />} />
                    <Route path="/segments"      element={<Segments />} />
                    <Route path="/campaigns"     element={<Campaigns />} />
                    <Route path="/analytics"     element={<Analytics />} />
                    <Route path="/assistant"     element={<AIAssistant />} />
                    <Route path="/settings"      element={<Settings />} />
                    <Route path="*"              element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}