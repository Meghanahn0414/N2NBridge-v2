import React from "react";

export default function AIInsights({ items = [] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">AI Constituency Insights</h3>
      <div className="mt-4 space-y-3">
        {items.map((it) => (
          <div key={it.id} className="rounded-lg bg-slate-50 p-3">
            <p className="font-semibold text-slate-900">{it.title}</p>
            <p className="text-sm text-slate-600">{it.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
