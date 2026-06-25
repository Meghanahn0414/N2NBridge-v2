import React from "react";
import { useNavigate } from "react-router-dom";
import { getAuthUser, clearAuth } from "../../services/authStorage";

export default function CitizenDashboard() {
  const navigate = useNavigate();
  const user = getAuthUser();

  const handleLogout = () => {
    clearAuth();
    navigate("/citizen-login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Jan Seva CRM</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-red-600 hover:underline"
        >
          Logout
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            Welcome, {user?.fullName || "Citizen"}
          </h2>
          <p className="text-sm text-slate-500">{user?.mobile || user?.email}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "My Complaints", icon: "📋", path: "/citizen/complaints" },
            { label: "New Complaint", icon: "➕", path: "/citizen/create-complaint" },
            { label: "Events", icon: "📅", path: "/citizen/events" },
            { label: "My Profile", icon: "👤", path: "/citizen/profile" },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="bg-white rounded-2xl border border-slate-200 p-5 text-left hover:border-indigo-400 hover:shadow-md transition"
            >
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="text-sm font-medium text-slate-800">{item.label}</div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
