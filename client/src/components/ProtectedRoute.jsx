// client/src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => { // Optional: pass allowedRoles for role-based protection
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div>Loading authentication state...</div>; // Or a spinner
  }

  if (!isAuthenticated) {
    // User not authenticated, redirect to login page
    // You can also pass the current location to redirect back after login
    // return <Navigate to="/login" state={{ from: location }} replace />;
    return <Navigate to="/login" replace />;
  }

  // Optional: Role-based authorization
  // If allowedRoles are provided and the user's role is not in the list
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // User authenticated but not authorized for this route
    // Redirect to an "Unauthorized" page or home page
    console.warn(`User role "${user.role}" not authorized for this route. Allowed: ${allowedRoles.join(', ')}`);
    return <Navigate to="/" replace />; // Or to a specific /unauthorized page
  }

  // User is authenticated (and authorized if roles were checked)
  // Outlet renders the child route's element
  return <Outlet />;
};

export default ProtectedRoute;