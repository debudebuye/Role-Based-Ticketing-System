import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, role }) => {
  const { token, user } = useSelector((state) => state.auth);

  if (!token) {
    // Redirect to login if no token is found
    return <Navigate to="/login" replace />;
  }

  if (role && user?.role !== role) {
    // Redirect to a default route if the user doesn't have the required role
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return children;
};

export default ProtectedRoute;