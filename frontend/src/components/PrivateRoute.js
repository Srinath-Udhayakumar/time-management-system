import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children, role }) {
  const { auth } = useAuth();

  if (!auth) return <Navigate to="/login" replace />;
  if (role && auth.role !== role) {
    return <Navigate to={auth.role === 'MANAGER' ? '/manager' : '/employee'} replace />;
  }
  return children;
}
