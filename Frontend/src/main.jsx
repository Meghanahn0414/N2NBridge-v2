import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { initLanguage } from "./i18n/index.js";

const container = document.getElementById("root");

// Guard against HMR double-init
if (!container._reactRoot) {
  container._reactRoot = ReactDOM.createRoot(container);
}

container._reactRoot.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Init language AFTER React's first paint so the DOM exists
setTimeout(() => initLanguage(), 100);
