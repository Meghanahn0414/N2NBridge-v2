import React from "react";

export default function AlertPanel({ alerts = [] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Critical Alerts</h3>
      <div className="mt-4 space-y-3">
        {alerts.map((a) => (
          <div key={a.id} className="flex items-start justify-between rounded-lg bg-slate-50 p-3">
            <div>
              <p className="font-semibold text-slate-900">{a.title}</p>
              <p className="text-xs text-slate-500">{a.time} • {a.level}</p>
            </div>
            <div className="text-sm text-slate-600">{a.level}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
