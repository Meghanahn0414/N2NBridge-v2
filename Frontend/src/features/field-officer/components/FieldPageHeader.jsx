import React from "react";
import { getAuthUser } from "../../../services/authStorage";

export default function FieldPageHeader({ subtitle }) {
  const user = getAuthUser();
  const name = user?.fullName || user?.name || "Officer";
  const firstName = name.split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <header style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "22px 34px",
      background: "#F3F5FA",
      position: "sticky",
      top: 0,
      zIndex: 10,
      borderBottom: "1px solid #E5E9F1",
      flexShrink: 0,
      fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
    }}>
      {/* Left: date + greeting */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: "#8590A6", marginBottom: 3 }}>
          {today}
        </div>
        <h1 style={{
          margin: 0,
          font: "400 28px 'Newsreader', Georgia, serif",
          color: "#16233C",
          letterSpacing: "-.01em",
          lineHeight: 1.2,
        }}>
          {greeting}, {firstName}
        </h1>
      </div>

      {/* Right: subtitle status pill */}
      {subtitle && (
        <div style={{
          height: 44,
          background: "#fff",
          border: "1px solid #E1E6F0",
          borderRadius: 13,
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          fontSize: 13,
          fontWeight: 600,
          color: "#16233C",
        }}>
          {subtitle}
        </div>
      )}
    </header>
  );
}
