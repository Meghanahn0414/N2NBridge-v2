import React from "react";
import { getAuthUser } from "../../../services/authStorage";

export default function FieldPageHeader({ subtitle }) {
  const user = getAuthUser();
  const officerName = user?.fullName || user?.name || "Officer";
  const firstName = officerName.split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div style={{
      background: "#1a5290",
      padding: "14px 32px 16px",
      flexShrink: 0,
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />

      <p style={{ margin: 0, fontSize: "10px", fontWeight: 600, color: "#93c5fd", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {today}
      </p>

      <div style={{ marginTop: "4px" }}>
        <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
          {greeting}, {firstName} 👋
        </h1>
        {subtitle && (
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#93c5fd" }}>{subtitle}</p>
        )}
      </div>
    </div>
  );
}
