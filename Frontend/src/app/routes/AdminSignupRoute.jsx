import React from 'react';
import { Navigate } from 'react-router-dom';
import { ROUTES } from './RouteConstants';

/**
 * Admin Signup Route - Restricts access to admin signup
 * Only allows unauthenticated users (who will create a new admin account)
 * If already logged in, redirects to dashboard
 */
export default function AdminSignupRoute({ children }) {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');

  // If already authenticated, redirect to appropriate dashboard
  if (token && user) {
    try {
      const userData = JSON.parse(user);
      const role = userData.role || userData.user?.role;

      // Admin users go to admin dashboard
      if (role === 'ADMIN') {
        return <Navigate to={ROUTES.admin} replace />;
      }
      // Other authenticated users go to their respective dashboards
      if (role === 'REPRESENTATIVE') {
        return <Navigate to={ROUTES.rep} replace />;
      }
      if (role === 'CONSTITUENCY_MANAGER') {
        return <Navigate to={ROUTES.manager} replace />;
      }
      if (role === 'FIELD_OFFICER') {
        return <Navigate to={ROUTES.field} replace />;
      }
      if (role === 'CITIZEN') {
        return <Navigate to={ROUTES.citizen} replace />;
      }

      // Default: go to login
      return <Navigate to={ROUTES.login} replace />;
    } catch (err) {
      console.error('Error parsing user data:', err);
      return <Navigate to={ROUTES.login} replace />;
    }
  }

  // Unauthenticated users can access signup
  return children;
}
