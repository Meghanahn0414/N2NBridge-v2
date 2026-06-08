import React from "react";

export default function TeamPerformance() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Team Performance</h3>
      <div className="mt-4 text-sm text-slate-600">Active Officers: 82 • Tasks Assigned: 1,245 • Avg. Closure Time: 2.3 Days</div>
      <div className="mt-4 space-y-2">
        <div className="rounded-lg bg-slate-50 p-3">Officer Arjun — Tasks Completed: 156 — Resolution: 95%</div>
        <div className="rounded-lg bg-slate-50 p-3">Officer Priya — Tasks Completed: 142 — Resolution: 93%</div>
      </div>
    </div>
  );
}
