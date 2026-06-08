import React from "react";

export default function EventList({ events = [] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Upcoming Events</h3>
      <div className="mt-4 space-y-3">
        {events.map((e) => (
          <div key={e.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
            <div>
              <p className="font-semibold text-slate-900">{e.title}</p>
              <p className="text-xs text-slate-500">{e.date}</p>
            </div>
            <div className="text-sm text-slate-600">{e.registered}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
