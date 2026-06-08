import React from "react";

const menuItems = [
  "Dashboard",
  "Complaints",
  "Alerts",
  "Citizens",
  "CRM",
  "Events",
  "Campaigns",
  "Tasks",
  "Analytics",
  "Reports",
  "AI Insights",
  "Settings",
];

export default function Sidebar() {
  return (
    <aside className="hidden w-72 flex-none flex-col gap-6 border-r border-slate-100 bg-slate-900 p-6 text-white lg:flex">
      <div className="text-lg font-bold">Constituency Platform</div>
      <nav className="flex flex-col gap-2">
        {menuItems.map((item) => (
          <button key={item} className="w-full rounded-lg px-4 py-2 text-left hover:bg-slate-800/60">
            {item}
          </button>
        ))}
      </nav>
    </aside>
  );
}
