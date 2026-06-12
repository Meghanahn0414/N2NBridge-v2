import React from "react";
import { Navigate } from "react-router-dom";
import { getAuthRole, getAuthToken } from "../../services/authStorage";
import { ROUTES } from "./RouteConstants";

/**
 * AdminLoginRoute - Restricts access to admin login for non-citizens only
 * - Unauthenticated users: can access admin login
 * - Authenticated non-citizens (ADMIN, REPRESENTATIVE, CONSTITUENCY_MANAGER, FIELD_OFFICER): redirects to their dashboard
 * - Authenticated citizens: redirects to citizen dashboard (not admin login)
 */
export default function AdminLoginRoute({ children }) {
  const role = getAuthRole();
  const token = getAuthToken();

  const redirectByRole = {
    CITIZEN: ROUTES.citizen, // Citizens redirect to citizen dashboard
    FIELD_OFFICER: ROUTES.field,
    CONSTITUENCY_MANAGER: ROUTES.manager,
    REPRESENTATIVE: ROUTES.rep,
    ADMIN: ROUTES.admin,
  };

  // If user is authenticated, redirect based on role
  if (token && role) {
    return <Navigate to={redirectByRole[role] ?? "/"} replace />;
  }

  // Unauthenticated users can access admin login
  return children;
}
