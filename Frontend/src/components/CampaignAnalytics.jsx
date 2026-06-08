import React from "react";

export default function CampaignAnalytics() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Campaign Performance</h3>
      <div className="mt-4 text-sm text-slate-600">Messages Sent: 150,000 • Delivered: 142,000 • Read Rate: 78%</div>
    </div>
  );
}
