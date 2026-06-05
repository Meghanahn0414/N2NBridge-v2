import React from "react";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-4xl rounded-3xl bg-white p-8 shadow-lg shadow-slate-200/40">
        <h1 className="mb-6 text-3xl font-semibold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-600">Manage users, configure system rules, and review analytics.</p>
      </div>
    </div>
  );
}
