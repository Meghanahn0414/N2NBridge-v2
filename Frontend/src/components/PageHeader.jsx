import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthUser, clearAuth, getAuthRole } from "../services/authStorage";
import { notificationService } from "../shared/services/notification";
import { getNotificationRoute } from "../utils/notificationRoute";

const TYPE_ICON = {
  GRIEVANCE: "📋", COMPLAINT: "📋",
  EVENT: "📅",
  CAMPAIGN: "📢",
  ALERT: "⚠️", EMERGENCY: "⚠️",
  TASK: "✅",
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export default function PageHeader({ title, subtitle }) {
  const user = getAuthUser();
  const name = user?.fullName || user?.name || "User";
  const firstName = name.split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const [showLogout, setShowLogout] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const role = getAuthRole();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await notificationService.getUnread();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const handler = () => fetchNotifications();
    window.addEventListener('app-notification-updated', handler);
    return () => window.removeEventListener('app-notification-updated', handler);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowLogout(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications([]);
      window.dispatchEvent(new Event('app-notification-updated'));
    } catch {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }
  };

  const handleNotificationClick = async (n) => {
    const id = n._id || n.id;
    if (id) {
      try { await notificationService.markRead(id); } catch {}
    }
    setNotifications(prev => prev.filter(x => (x._id || x.id) !== id));
    const route = getNotificationRoute(n, role);
    if (route) navigate(route);
    setShowNotifications(false);
    window.dispatchEvent(new Event('app-notification-updated'));
  };

  const handleLogout = () => {
    clearAuth();
    if (role === "CITIZEN" || role === "citizen") {
      navigate("/citizen-login");
    } else {
      navigate("/admin-login");
    }
  };

  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div style={{
      background: "#1a5290",
      padding: "14px 32px 18px",
      flexShrink: 0,
      position: "relative",
      overflow: "visible",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}>
      {/* Decorative circle */}
      <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />

      {/* Left: greeting */}
      <div>
        <p style={{ margin: 0, fontSize: "10px", fontWeight: 600, color: "#93c5fd", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {today}
        </p>
        <div style={{ marginTop: "4px" }}>
          <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
            {greeting}, {firstName} 👋
          </h1>
          {(title || subtitle) && (
            <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#93c5fd" }}>
              {title || subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right: notifications + avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative", zIndex: 10 }}>

      {/* Notification Bell */}
      <div style={{ position: "relative" }} ref={notifRef}>
        <button
          onClick={() => { setShowNotifications(s => !s); setShowLogout(false); }}
          style={{
            width: 40, height: 40, borderRadius: "50%",
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.2)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "18px", transition: "background 0.15s", position: "relative",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.22)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
          title="Notifications"
        >
          🔔
          {unreadCount > 0 && (
            <span style={{
              position: "absolute", top: 4, right: 4,
              width: 16, height: 16, borderRadius: "50%",
              background: "#ef4444", color: "#fff",
              fontSize: "9px", fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "2px solid #1a5290",
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {showNotifications && (
          <div style={{
            position: "absolute", top: "calc(100% + 12px)", right: 0,
            width: 320, background: "#fff", borderRadius: 16,
            boxShadow: "0 16px 48px rgba(15,23,42,0.18)", overflow: "hidden", zIndex: 999,
          }}>
            {/* Header */}
            <div style={{
              background: "linear-gradient(135deg, #2E63B6, #2FB1D4)",
              padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: "14px" }}>Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  style={{ background: "none", border: "none", color: "rgba(255,255,255,0.85)", fontSize: "11px", cursor: "pointer", fontWeight: 600 }}
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div style={{ maxHeight: 300, overflowY: "auto" }}>
              {notifications.length === 0 ? (
                <div style={{ padding: "24px 18px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                  No new notifications
                </div>
              ) : (
                notifications.map((n, i) => {
                  const icon = TYPE_ICON[(n.type || '').toUpperCase()] || "🔔";
                  const isUnread = !n.isRead;
                  return (
                    <div
                      key={n._id || n.id || i}
                      onClick={() => handleNotificationClick(n)}
                      style={{
                        display: "flex", gap: 12, padding: "12px 18px",
                        borderBottom: i < notifications.length - 1 ? "1px solid #f1f5f9" : "none",
                        background: isUnread ? "#eff6ff" : "#fff",
                        cursor: "pointer", transition: "background 0.1s",
                        borderLeft: isUnread ? "3px solid #3b82f6" : "3px solid transparent",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f0f9ff"}
                      onMouseLeave={e => e.currentTarget.style.background = isUnread ? "#eff6ff" : "#fff"}
                    >
                      <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: "12px", color: "#0f172a", fontWeight: isUnread ? 600 : 400, lineHeight: 1.4 }}>
                          {n.title || n.body || 'Notification'}
                        </p>
                        {n.body && n.title && (
                          <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#475569", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {n.body}
                          </p>
                        )}
                        <p style={{ margin: "3px 0 0", fontSize: "10px", color: "#94a3b8" }}>{timeAgo(n.createdAt)}</p>
                        {isUnread && <p style={{ margin: "3px 0 0", fontSize: "10px", color: "#3b82f6", fontWeight: 600 }}>Tap to open →</p>}
                      </div>
                      {isUnread && (
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6", flexShrink: 0, marginTop: 6 }} />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: "10px 18px", borderTop: "1px solid #f1f5f9", textAlign: "center" }}>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                {unreadCount === 0 ? "You're all caught up!" : `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Avatar + logout trigger */}
      <div style={{ position: "relative", zIndex: 10 }} ref={dropdownRef}>
        <button
          onClick={() => setShowLogout(s => !s)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "40px",
            padding: "6px 14px 6px 6px",
            cursor: "pointer",
            color: "#fff",
            fontSize: "13px",
            fontWeight: 600,
            transition: "background 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
        >
          <span style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: "13px", fontWeight: 700, color: "#fff", flexShrink: 0,
          }}>
            {initials}
          </span>
          {firstName}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.7, marginLeft: 2 }}>
            <path d="M2 4l4 4 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Dropdown */}
        {showLogout && (
          <div style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            width: 240,
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 16px 48px rgba(15,23,42,0.18)",
            overflow: "hidden",
            zIndex: 999,
          }}>
            {/* Header */}
            <div style={{
              background: "linear-gradient(135deg, #2E63B6, #2FB1D4)",
              padding: "14px 18px",
              textAlign: "center",
            }}>
              <p style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#fff" }}>Sign Out</p>
            </div>

            {/* User info */}
            <div style={{ padding: "14px 18px" }}>
              <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>{name}</div>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: 2 }}>{user?.email || ""}</div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, padding: "0 18px 16px" }}>
              <button
                onClick={() => setShowLogout(false)}
                style={{
                  flex: 1, padding: "10px", border: "2px solid #e2e8f0",
                  borderRadius: 10, background: "#f8fafc", color: "#475569",
                  fontWeight: 600, fontSize: "13px", cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                style={{
                  flex: 1, padding: "10px", border: "none",
                  borderRadius: 10, background: "linear-gradient(135deg, #2F5FB1, #32B6D6)",
                  color: "#fff", fontWeight: 600, fontSize: "13px", cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(47,95,177,0.3)",
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      </div>{/* end right flex wrapper */}
    </div>
  );
}
