import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './common';

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole) {
    const hierarchy = { admin: 3, manager: 2, viewer: 1 };
    const userLevel = hierarchy[user.role]     || 0;
    const reqLevel  = hierarchy[requiredRole]  || 0;
    if (userLevel < reqLevel) {
      return (
        <div className="flex items-center justify-center h-full py-24">
          <div className="text-center">
            <div className="text-5xl mb-3">🔒</div>
            <h2 className="text-white font-bold text-lg mb-1">Access Denied</h2>
            <p className="text-muted text-sm">You need <span className="text-brand-400">{requiredRole}</span> role to view this page.</p>
          </div>
        </div>
      );
    }
  }

  return children;
}
