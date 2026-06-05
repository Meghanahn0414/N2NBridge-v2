import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaBars, FaBell, FaUser, FaTimes } from "react-icons/fa";
import "./styles/Header.css";
import logoSrc from "./assets/images/Logo.png";
import api, { backendProbeHealthy } from "./shared/services/api";
import {
  getAuthUser,
  getAuthRole,
  clearAuth,
} from './services/authStorage';
import NotificationModal from "./common/NotificationModal";

export default function Header() {
  const [notificationCount, setNotificationCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [showNotificationsList, setShowNotificationsList] = useState(false);
  const [notificationsList, setNotificationsList] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [debugShowAdminNotifications, setDebugShowAdminNotifications] = useState(() => {
    try { return localStorage.getItem('debug_notifications') === '1'; } catch (e) { return false; }
  });
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const user = getAuthUser();
  
  // Get specialization from user object
  const specialization = user && user.specialization ? user.specialization : localStorage.getItem('specialization') || '';

  // helper to tightly normalize patient IDs that sometimes come prefixed with
  // ":patientId=" or "?patientId=" (an earlier bug in Header navigation)
 
  const fetchNotificationCount = async () => {
    if (!backendProbeHealthy) {
      // avoid initial spikes when backend probe is still in-flight or unavailable
      return;
    }

    try {
      // Extract role: prioritize user.role from sessionStorage-backed auth state
      let role = '';
      if (user && user.role) {
        role = user.role;
      } else {
        role = getAuthRole() || localStorage.getItem('userRole') || localStorage.getItem('role') || '';
      }
      
      if (!role) {
        console.log('[HEADER] No role found, skipping notification count fetch');
        return setNotificationCount(0);
      }
      // normalize to lower-case so casing mismatches (e.g. "Location_Admin")
      // won't cause backend queries to miss notifications.
      const normalizedRole = role.toString().toLowerCase();
      console.log('[HEADER] Fetching notification count for role:', normalizedRole);
      
      const params = { role: normalizedRole, unread_only: true };
      if (specialization !== undefined && specialization !== null && specialization !== '') {
        params.specialization = specialization;
      }
      if (user && user.email) {
        params.recipient_email = user.email;
      }
      // if we're a doctor/dentist include identifying info so backend can return
      const res = await api.get('/notifications/count', { params });
      if (res && res.data && typeof res.data.count === 'number') {
        console.log('[HEADER] ✅ Notification count:', res.data.count);
        setNotificationCount(res.data.count);
        return;
      }
    } catch (e) {
      console.error('[HEADER] Error fetching notification count:', e);
      // fallback to client-side stored notifications
      try {
        const raw = JSON.parse(localStorage.getItem('notifications') || '[]');
        setNotificationCount(Array.isArray(raw) ? raw.length : 0);
        return;
      } catch (er) {
        setNotificationCount(0);
      }
    }
  };

  useEffect(() => {
    // Listen for notification-sent events and always refresh the count
    const handleNotificationSent = async () => {
      console.log('[HEADER] 📬 notification-sent event received, refreshing count...');
      // Always refresh the count regardless of dropdown state
      await fetchNotificationCount();
      // If dropdown is open, also refresh the list
      if (showNotificationsList) {
        await fetchNotificationsList();
      }
    };
    const handleNotificationUpdated = async () => {
      console.log('[HEADER] 📬 app-notification-updated event received');
      await fetchNotificationCount();
    };
    window.addEventListener('notification-sent', handleNotificationSent);
    window.addEventListener('app-notification-updated', handleNotificationUpdated);
    return () => {
      window.removeEventListener('notification-sent', handleNotificationSent);
      window.removeEventListener('app-notification-updated', handleNotificationUpdated);
    };
  }, [showNotificationsList]);

  // Poll the backend count endpoint every 5s as a fallback for simple real-time updates
  useEffect(() => {
    fetchNotificationCount();
    let intervalId = null;
    try {
      intervalId = setInterval(() => {
        fetchNotificationCount();
      }, 5000);
    } catch (e) {
      // ignore
    }
    return () => { try { if (intervalId) clearInterval(intervalId); } catch (e) {} };
  }, []);

  
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const routePageTitle = (() => {
    const path = location.pathname;
    if (path === '/citizen') return 'Citizen Dashboard';
    if (path === '/citizen/create-complaint') return 'Create Complaint';
    if (path === '/citizen/complaints') return 'Complaint List';
    if (/^\/citizen\/complaints\/[^\/]+(\/|$)/.test(path)) return 'Complaint Details';
    if (path === '/field') return 'Field Officer Dashboard';
    if (path === '/manager') return 'Constituency Manager Dashboard';
    if (path === '/rep') return 'Representative Dashboard';
    if (path === '/admin') return 'Admin Dashboard';
    return '';
  })();
  const hideHeaderBrand = routePageTitle === 'Admin Dashboard';

  const handleLogout = () => {
    clearAuth();
    setOpen(false);
    navigate('/login');
  };

  const fetchNotificationsList = async () => {
    try {
      setLoadingNotifications(true);
      // Extract role: prioritize user.role from sessionStorage-backed auth state
      let role = '';
      if (user && user.role) {
        role = user.role;
      } else {
        role = getAuthRole() || localStorage.getItem('userRole') || localStorage.getItem('role') || '';
      }
      
      // normalize before sending to backend
      if (!role) {
        console.log('[HEADER] No role, returning empty list');
        return setNotificationsList([]);
      }
      const normalizedRole = role.toString().toLowerCase();
      console.log('[HEADER] 📬 Fetching notifications list for role:', normalizedRole);
      const params = { role: normalizedRole, specialization: specialization, unread_only: true, limit: 50 };
      if (user && user.email) {
        params.recipient_email = user.email;
      }
      console.log('[HEADER] API params:', params);
      const res = await api.get('/notifications', { params });
      if (res && res.data) {
        // ensure array
        console.log('[HEADER] Setting', items.length, 'notifications in state');
        setNotificationsList(items);

        if (items.length === 0 && notificationCount > 0) {
          try {
            const fallbackRes = await api.get('/notifications', { params: { unread_only: true, limit: 100 } });
            let fallbackItems = Array.isArray(fallbackRes.data) ? fallbackRes.data : (fallbackRes.data.data || []);
            if (Array.isArray(fallbackItems) && fallbackItems.length > 0) {
              console.log('[HEADER] Fallback: found', fallbackItems.length, 'notifications');
              setNotificationsList(fallbackItems);
            }
          } catch (fallbackErr) {
            console.warn('[HEADER] fallback notifications fetch failed', fallbackErr);
          }
        }
      }
    } catch (e) {
      console.error('[HEADER] Error fetching notifications list:', e);
      setNotificationsList([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Utility: parse various date formats (ISO string, ms timestamp, seconds timestamp)
  const parseNotificationDate = (input) => {
    if (!input) return new Date();
    // numeric?
    const asNum = Number(input);
    if (!Number.isNaN(asNum)) {
      // Seconds (10 digits) -> convert to ms
      if (String(input).length === 10) return new Date(asNum * 1000);
      return new Date(asNum);
    }
    try {
      const s = String(input).trim();
      // If the string contains 'Z' or ±HH:MM timezone (like +00:00 for UTC), treat as ISO string with timezone
      if (s.includes('Z') || /[+-]\d{2}:\d{2}$/.test(s) || /[+-]\d{4}$/.test(s)) {
        // This is a timezone-aware ISO string (e.g., from Python's datetime.now(timezone.utc))
        // JavaScript's Date constructor will correctly parse it and convert to local time
        return new Date(s);
      }
      // Prefer interpreting naive timestamps (no timezone) as local time to avoid unintended UTC shifts.
      // matches YYYY-MM-DD[ T]HH:MM:SS optionally with fractional seconds, but without a timezone offset or Z
      const naiveIso = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?$/;
      if (naiveIso.test(s)) {
        // Parse components and construct a local Date object (year, monthIndex, day, hour, minute, second, ms)
        const main = s.split('.')[0];
        const frac = s.includes('.') ? s.split('.')[1] : null;
        const parts = main.replace('T', ' ').split(/[- :]/).map((p) => parseInt(p, 10));
        const year = parts[0] || 1970;
        const month = (parts[1] ? parts[1] - 1 : 0);
        const day = parts[2] || 1;
        const hour = parts[3] || 0;
        const minute = parts[4] || 0;
        const second = parts[5] || 0;
        const ms = frac ? Math.round(Number('0.' + frac) * 1000) : 0;
        return new Date(year, month, day, hour, minute, second, ms);
      }
      // Otherwise let Date parse the string (respects timezone offsets if present)
      return new Date(s);
    } catch (e) {
      return new Date();
    }
  };

  const highlightTrackingId = (text) => {
    if (!text || typeof text !== 'string') return text;
    const pattern = /(Tracking ID:\s*[A-Za-z0-9-]+)/gi;
    const parts = [];
    let lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      parts.push(
        <span
          key={`tracking-${parts.length}`}
          style={{
            textDecoration: 'underline',
            fontWeight: 700,
            backgroundColor: 'rgba(255, 235, 59, 0.2)',
            color: '#0a3e83',
            padding: '2px 4px',
            borderRadius: 4,
          }}
        >
          {match[0]}
        </span>
      );
      lastIndex = match.index + match[0].length;
    }
    parts.push(text.slice(lastIndex));
    return parts;
  };

  const formatNotificationTime = (input) => {
    const d = parseNotificationDate(input);
    const now = Date.now();
    const diff = Math.max(0, Math.floor((now - d.getTime()) / 1000));
    let ago;
    if (diff < 60) ago = `${diff}s ago`;
    else if (diff < 3600) ago = `${Math.floor(diff / 60)}m ago`;
    else if (diff < 86400) ago = `${Math.floor(diff / 3600)}h ago`;
    else ago = d.toLocaleDateString();
    // Format as: MM/DD/YYYY Time: HH:MM AM/PM (no seconds)
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = String(d.getFullYear());
    let hours = d.getHours();
    const mins = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    const hh = String(hours).padStart(2, '0');
    const full = `${mm}/${dd}/${yyyy}\u00A0\u00A0${hh}:${mins} ${ampm}`;
    return { ago, full };
  };

  const markNotificationRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch (e) {
      // ignore
    } finally {
      // refresh count and list
      fetchNotificationCount();
      fetchNotificationsList();
      window.dispatchEvent(new Event('app-notification-updated'));
    }
  };

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="header-left">
          {!hideHeaderBrand && (
            <>
              <div className="header-logo">
                <img src={logoSrc} alt="VaarahiCRM" />
              </div>
              {routePageTitle && (
                <div className="header-page-title">{routePageTitle}</div>
              )}
            </>
          )}
        </div>

        {/* Right: Icons */}
        <div className="header-right">
          <div className="notification-icon">
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <FaBell
                style={{ cursor: 'pointer' }}
                onClick={async () => {
                  setShowNotificationsList((s) => !s);
                  if (!showNotificationsList) await fetchNotificationsList();
                }}
              />
              {notificationCount > 0 && (
                <span className="notification-badge">{notificationCount}</span>
              )}

              {showNotificationsList && (
                <div
                  className="notification-dropdown"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '36px',
                    width: 340,
                    maxHeight: 360,
                    overflowY: 'auto',
                    zIndex: 2000,
                  }}
                >
                  <div className="notification-header">
                    <h3>Notifications</h3>
                    <button
                      className="close-btn"
                      onClick={() => setShowNotificationsList(false)}
                      title="Close notifications"
                      aria-label="Close notifications"
                    >
                      <FaTimes />
                    </button>
                  </div>
                  <div style={{ borderTop: '1px solid #eee', marginTop: 6 }} />
                  {loadingNotifications ? (
                    <div style={{ padding: 12 }}>Loading…</div>
                  ) : notificationsList.length === 0 ? (
                    <div style={{ padding: 12, color: '#666' }}>No new notifications</div>
                  ) : (
                    notificationsList.map((n) => (
                      <div key={n._id} className="notification-item">
                        <div className="notification-content">
                          <div className="notification-title">{n.title}</div>
                          <div className="notification-message">{n.message}</div>
                        </div>
                        {(() => {
                          const ts = n.created_at || n.createdAt || null;
                          const t = formatNotificationTime(ts);
                          return (
                            <div
                              title={t.full}
                              style={{ fontSize: 11, color: '#999', marginTop: 6 }}
                            >
                              {t.full}
                            </div>
                          );
                        })()}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
