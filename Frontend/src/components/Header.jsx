import React, { useState, useEffect } from "react";
import { changeLanguage, getCurrentLanguage } from "../i18n/index.js";

export default function Header({ title = "Welcome" }) {
  const [lang, setLang] = useState(getCurrentLanguage());
  const [translating, setTranslating] = useState(false);

  const handleToggle = async (next) => {
    if (next === lang || translating) return;
    setTranslating(true);
    await changeLanguage(next);
    setLang(next);
    setTranslating(false);
  };

  return (
    <header className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm text-slate-500">Good Morning,</p>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <button className="rounded-lg bg-slate-50 px-3 py-2 text-sm">Alerts</button>
        <button className="rounded-lg bg-slate-50 px-3 py-2 text-sm">Messages</button>

        {/* Language toggle — no t() needed, DOM translator handles everything */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
          <button
            onClick={() => handleToggle("en")}
            disabled={translating}
            className={`rounded px-2 py-1 text-xs font-semibold transition ${
              lang === "en" ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            EN
          </button>
          <button
            onClick={() => handleToggle("kn")}
            disabled={translating}
            className={`rounded px-2 py-1 text-xs font-semibold transition ${
              lang === "kn" ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {translating ? "…" : "ಕನ್ನಡ"}
          </button>
        </div>

        <div className="h-10 w-10 rounded-full bg-slate-200" />
      </div>
    </header>
  );
}
