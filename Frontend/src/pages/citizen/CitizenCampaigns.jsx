import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCampaigns } from "../../features/campaigns/campaignService";

const TYPE_COLORS = {
  Health:         { bg: "#dcfce7", color: "#15803d", icon: "🏥" },
  Awareness:      { bg: "#eff6ff", color: "#1d4ed8", icon: "📢" },
  Infrastructure: { bg: "#fef9c3", color: "#a16207", icon: "🏗️" },
  Education:      { bg: "#f3e8ff", color: "#7c3aed", icon: "📚" },
  Welfare:        { bg: "#fff7ed", color: "#c2410c", icon: "🤝" },
  Other:          { bg: "#f1f5f9", color: "#475569", icon: "📌" },
};

export default function CitizenCampaigns() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns(1, 100, { status: "ACTIVE" })
      .then(data => setCampaigns(Array.isArray(data) ? data : []))
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <header style={{ background: "#1a5290", padding: "16px 20px 20px", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => navigate("/citizen/dashboard")}
            style={{ background: "none", border: "none", color: "#93c5fd", fontSize: 20, cursor: "pointer", padding: 0 }}
          >
            ←
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Programs & Campaigns</h1>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#93c5fd" }}>Active government initiatives in your area</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main style={{ flex: 1, padding: "16px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8", fontSize: 14 }}>
            Loading campaigns...
          </div>
        ) : campaigns.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#64748b" }}>No active campaigns</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Check back soon for upcoming programs.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {campaigns.map(c => {
              const tc = TYPE_COLORS[c.type] || TYPE_COLORS.Other;
              return (
                <div key={c._id || c.id} style={{
                  background: "#fff", borderRadius: 16,
                  boxShadow: "0 2px 8px rgba(15,23,42,0.07)",
                  overflow: "hidden",
                }}>
                  {/* Color band */}
                  <div style={{ background: tc.bg, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 24 }}>{tc.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: tc.color }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: tc.color, opacity: 0.8, marginTop: 2 }}>{c.type}</div>
                    </div>
                    <span style={{
                      background: "#dcfce7", color: "#15803d",
                      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                    }}>ACTIVE</span>
                  </div>

                  {/* Body */}
                  <div style={{ padding: "12px 16px" }}>
                    {c.message && (
                      <p style={{ margin: "0 0 10px", fontSize: 13, color: "#334155", lineHeight: 1.6 }}>
                        {c.message}
                      </p>
                    )}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {(c.channels || []).map(ch => (
                        <span key={ch} style={{
                          fontSize: 11, fontWeight: 600, padding: "3px 8px",
                          background: "#f1f5f9", color: "#475569", borderRadius: 8,
                        }}>
                          {ch}
                        </span>
                      ))}
                      {c.startDate && (
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: "3px 8px",
                          background: "#eff6ff", color: "#3b82f6", borderRadius: 8,
                        }}>
                          📅 {new Date(c.startDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav style={{
        position: "sticky", bottom: 0, background: "#1e293b",
        display: "flex", justifyContent: "space-around", padding: "10px 0 14px",
      }}>
        {[
          { icon: "🏠", label: "Home",       path: "/citizen/dashboard" },
          { icon: "📋", label: "Complaints", path: "/citizen/complaints" },
          { icon: "📅", label: "Events",     path: "/citizen/events" },
          { icon: "📢", label: "Campaigns",  path: "/citizen/campaigns" },
        ].map(({ icon, label, path }) => {
          const active = window.location.pathname === path;
          return (
            <button
              key={label}
              onClick={() => navigate(path)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                color: active ? "#60a5fa" : "#94a3b8", fontSize: 10, fontWeight: active ? 700 : 400,
              }}
            >
              <span style={{ fontSize: 20 }}>{icon}</span>
              {label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
