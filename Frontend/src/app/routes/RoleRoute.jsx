import React from "react";
import { Navigate } from "react-router-dom";

export default function RoleRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || !role) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-lg shadow-red-100/60">
          <h1 className="mb-3 text-xl font-semibold text-red-700">Access Denied</h1>
          <p className="text-sm text-slate-600">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return children;
}
