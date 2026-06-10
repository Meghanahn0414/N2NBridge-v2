import React from "react";
import MobileBottomNav from "../../components/MobileBottomNav";
import "./mobile-layout.css";

export default function MobileLayout({ children }) {
  return (
    <div className="mobile-layout">
      <div className="mobile-layout-content citizen-page-with-nav">
        {children}
      </div>
      <MobileBottomNav />
    </div>
  );
}
