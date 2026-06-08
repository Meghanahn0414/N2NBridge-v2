import React from "react";

export default function Header({ title = "Welcome" }) {
  return (
    <header className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm text-slate-500">Good Morning,</p>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <button className="rounded-lg bg-slate-50 px-3 py-2 text-sm">Alerts</button>
        <button className="rounded-lg bg-slate-50 px-3 py-2 text-sm">Messages</button>
        <div className="h-10 w-10 rounded-full bg-slate-200" />
      </div>
    </header>
  );
}
