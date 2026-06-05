import React from "react";
import { Navigate } from "react-router-dom";
import { ROUTES } from "./RouteConstants";

const redirectByRole = {
  CITIZEN: ROUTES.citizen,
  FIELD_OFFICER: ROUTES.field,
  CONSTITUENCY_MANAGER: ROUTES.manager,
  REPRESENTATIVE: ROUTES.rep,
  ADMIN: ROUTES.admin,
};

export default function PublicRoute({ children }) {
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  if (token && role) {
    return <Navigate to={redirectByRole[role] ?? "/"} replace />;
  }

  return children;
}
