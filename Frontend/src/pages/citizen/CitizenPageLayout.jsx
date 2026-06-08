import React from "react";

export default function CitizenPageLayout({ title, subtitle, action, children, maxWidth = "max-w-5xl" }) {
  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className={`mx-auto w-full ${maxWidth} px-4 sm:px-6 lg:px-8`}>
        <div className="mb-8 rounded-[2rem] bg-white p-8 shadow-lg shadow-slate-200/40">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
              {subtitle && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{subtitle}</p>}
            </div>
            {action && <div className="flex items-center justify-end">{action}</div>}
          </div>
        </div>

        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
}
