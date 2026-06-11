import React from "react";
import { Navigate } from "react-router-dom";
import { getAuthRole, getAuthToken } from "../../services/authStorage";

export default function PrivateRoute({ children }) {
  const token = getAuthToken();
  const role = getAuthRole();

  if (!token || !role) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
