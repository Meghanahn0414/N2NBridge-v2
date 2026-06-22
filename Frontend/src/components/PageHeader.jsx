import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthUser, getAuthRole } from "../services/authStorage";
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

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const role = getAuthRole();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await notificationService.getUnread();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {}
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  useEffect(() => {
    const handler = () => fetchNotifications();
    window.addEventListener('app-notification-updated', handler);
    return () => window.removeEventListener('app-notification-updated', handler);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (e) => {
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
    if (id) { try { await notificationService.markRead(id); } catch {} }
    setNotifications(prev => prev.filter(x => (x._id || x.id) !== id));
    const route = getNotificationRoute(n, role);
    if (route) navigate(route);
    setShowNotifications(false);
    window.dispatchEvent(new Event('app-notification-updated'));
  };

  return (
    <header style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "22px 34px",
      background: "#F3F5FA",
      position: "sticky",
      top: 0,
      zIndex: 200,
      borderBottom: "1px solid #E5E9F1",
      fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
    }}>
      {/* Left: date + greeting + page title */}
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
          {title || `${greeting}, ${firstName}`}
        </h1>
        {subtitle && (
          <p style={{ margin: "3px 0 0", fontSize: 13, color: "#8590A6" }}>{subtitle}</p>
        )}
      </div>

      {/* Right: notifications bell */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ position: "relative" }} ref={notifRef}>
          <button
            onClick={() => setShowNotifications(s => !s)}
            style={{
              width: 44, height: 44, borderRadius: 13,
              background: "#fff",
              border: `1px solid ${showNotifications ? "#2B5BD7" : "#E1E6F0"}`,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 19, position: "relative", outline: "none",
              transition: "border-color 0.15s",
            }}
            title="Notifications"
          >
            🔔
            {unreadCount > 0 && (
              <span style={{
                position: "absolute", top: 6, right: 6,
                width: 16, height: 16, borderRadius: "50%",
                background: "#C8453A", color: "#fff",
                fontSize: 9, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "2px solid #F3F5FA",
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div style={{
              position: "absolute", top: "calc(100% + 10px)", right: 0,
              width: 320, background: "#fff", borderRadius: 16,
              boxShadow: "0 16px 48px rgba(20,35,60,0.14)",
              border: "1px solid #E1E6F0",
              overflow: "hidden", zIndex: 999,
            }}>
              <div style={{
                padding: "14px 18px", display: "flex", alignItems: "center",
                justifyContent: "space-between", borderBottom: "1px solid #E5E9F1",
              }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: "#16233C" }}>Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    style={{ background: "none", border: "none", color: "#2B5BD7", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: 300, overflowY: "auto" }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: "28px 18px", textAlign: "center", color: "#8590A6", fontSize: 13 }}>
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
                          borderBottom: i < notifications.length - 1 ? "1px solid #F3F5FA" : "none",
                          background: isUnread ? "#EEF2FF" : "#fff",
                          cursor: "pointer", transition: "background 0.1s",
                          borderLeft: isUnread ? "3px solid #2B5BD7" : "3px solid transparent",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "#F3F5FA"}
                        onMouseLeave={e => e.currentTarget.style.background = isUnread ? "#EEF2FF" : "#fff"}
                      >
                        <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 12, color: "#16233C", fontWeight: isUnread ? 600 : 400, lineHeight: 1.4 }}>
                            {n.title || n.body || 'Notification'}
                          </p>
                          {n.body && n.title && (
                            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#8590A6", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {n.body}
                            </p>
                          )}
                          <p style={{ margin: "3px 0 0", fontSize: 10, color: "#8590A6" }}>{timeAgo(n.createdAt)}</p>
                        </div>
                        {isUnread && (
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2B5BD7", flexShrink: 0, marginTop: 6 }} />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <div style={{ padding: "10px 18px", borderTop: "1px solid #E5E9F1", textAlign: "center" }}>
                <span style={{ fontSize: 12, color: "#8590A6" }}>
                  {unreadCount === 0 ? "You're all caught up!" : `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
