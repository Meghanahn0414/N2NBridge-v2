import React from "react";
import logoSrc from "./assets/images/Logo.png";

export default function Logo() {
  return (
    <div className="sidebar-logo">
      <img src={logoSrc} alt="App Logo" className="sidebar-logo-image"/>
    </div>
  );
}
