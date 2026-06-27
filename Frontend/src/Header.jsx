import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaBars, FaBell, FaUser, FaTimes, FaDownload, FaRedoAlt } from "react-icons/fa";
import "./styles/Header.css";
import api, { backendProbeHealthy } from "./shared/services/api";
import {
  getAuthUser,
  getAuthRole,
  clearAuth,
} from './services/authStorage';
import NotificationModal from "./common/NotificationModal";
import { getNotificationRoute } from './utils/notificationRoute';

export default function Header({ onMobileMenuClick }) {
  const [notificationCount, setNotificationCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [showNotificationsList, setShowNotificationsList] = useState(false);
  const [notificationsList, setNotificationsList] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [debugShowAdminNotifications, setDebugShowAdminNotifications] = useState(() => {
    try { return localStorage.getItem('debug_notifications') === '1'; } catch (e) { return false; }
  });
  const dropdownRef = useRef(null);
  const userProfileRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [authUser, setAuthUser] = useState(getAuthUser());
  const user = authUser;
  
  // Get specialization from user object
  const specialization = user && user.specialization ? user.specialization : localStorage.getItem('specialization') || '';

  // Construct profile image URL
  const getProfileImageUrl = () => {
    if (!user?.profileImage) return null;
    const img = user.profileImage;
    // Base64 data URL — use as-is
    if (img.startsWith('data:image/')) return img;
    // Already a full URL — use as-is
    if (img.startsWith('http://') || img.startsWith('https://')) return img;
    // Relative path like "uploads/filename.jpg" — prepend backend base if set, else use Vite proxy
    const base = import.meta.env.VITE_API_BASE_URL || '';
    const path = img.startsWith('/') ? img : `/${img}`;
    return base ? `${base}${path}` : path;
  };

  const profileImageUrl = getProfileImageUrl();

  useEffect(() => {
    const handleAuthUserUpdated = () => setAuthUser(getAuthUser());
    window.addEventListener('auth-user-updated', handleAuthUserUpdated);
    return () => window.removeEventListener('auth-user-updated', handleAuthUserUpdated);
  }, []);


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
      
      const res = await api.get('/api/notifications/unread');
      const unreadItems = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
      console.log('[HEADER] ✅ Notification count:', unreadItems.length);
      setNotificationCount(unreadItems.length);
      return;
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
      }      if (userProfileRef.current && !userProfileRef.current.contains(event.target)) {
        setShowUserProfile(false);
      }    }
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
    const role = getAuthRole();
    clearAuth();
    setOpen(false);
    setShowUserProfile(false);
    // Full page reload so Google Translate's DOM state is fully cleared on the login page.
    const loginPath = (role === 'CITIZEN' || role === 'citizen')
      ? '/citizen-login'
      : '/login';
    window.location.href = loginPath;
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

      const res = await api.get('/api/notifications', { params: { page: 1, per_page: 50 } });
      const items = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
      console.log('[HEADER] Setting', items.length, 'notifications in state');
      setNotificationsList(items);
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
      await api.patch(`/api/notifications/${id}/read`);
    } catch (e) {
      // ignore
    } finally {
      fetchNotificationCount();
      fetchNotificationsList();
      window.dispatchEvent(new Event('app-notification-updated'));
    }
  };

  const handleNotificationClick = async (n) => {
    const id = n._id || n.id;
    if (id) await markNotificationRead(id);
    setShowNotificationsList(false);
    const role = user?.role || getAuthRole();
    const route = getNotificationRoute(n, role);
    if (route) navigate(route);
  };

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="header-left">
          {/* Hamburger — visible only on mobile/tablet */}
          <button
            className="hamburger-btn header-hamburger"
            onClick={onMobileMenuClick}
            aria-label="Open navigation menu"
          >
            <FaBars />
          </button>
          {!hideHeaderBrand && routePageTitle && (
            <div className="header-page-title">{routePageTitle}</div>
          )}
          {hideHeaderBrand && (
            <div className="header-dashboard-info">
              <h1 className="dashboard-title">Dashboard</h1>
              <p className="dashboard-subtitle">Welcome back, Admin! Here's what's happening in your platform.</p>
            </div>
          )}
        </div>

        {/* Right: Icons */}
        <div className="header-right">
          {/* Date Filter */}
          <div className="header-date-filter">
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="date-filter-input"
            />
          </div>

          {/* Export and Refresh Buttons */}
          <button className="header-action-btn" title="Export Report">
            <FaDownload />
            <span>Export Report</span>
          </button>

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
                    notificationsList.map((n) => {
                      const id = n._id || n.id;
                      const isUnread = !n.isRead;
                      const role = user?.role || getAuthRole();
                      const hasRoute = !!getNotificationRoute(n, role);
                      const ts = n.created_at || n.createdAt || null;
                      const t = formatNotificationTime(ts);
                      return (
                        <div
                          key={id}
                          className="notification-item"
                          onClick={() => handleNotificationClick(n)}
                          style={{
                            cursor: hasRoute ? 'pointer' : 'default',
                            background: isUnread ? '#f0f7ff' : '#fff',
                            borderLeft: isUnread ? '3px solid #3b82f6' : '3px solid transparent',
                          }}
                        >
                          <div className="notification-content" style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            {isUnread && (
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', flexShrink: 0, marginTop: 4 }} />
                            )}
                            <div style={{ flex: 1 }}>
                              <div className="notification-title">{n.title}</div>
                              <div className="notification-message">{n.body || n.message}</div>
                              {hasRoute && (
                                <div style={{ fontSize: 11, color: '#3b82f6', fontWeight: 600, marginTop: 3 }}>
                                  Tap to open →
                                </div>
                              )}
                              <div title={t.full} style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                                {t.full}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* User Profile Section */}
          <div className="user-profile-section notranslate" ref={userProfileRef}>
            <button
              className="user-profile-btn"
              onClick={() => setShowUserProfile(!showUserProfile)}
              title="User Profile"
            >
              <div className="user-profile-avatar">
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt="Profile"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) e.target.nextSibling.style.display = 'inline-flex';
                    }}
                  />
                ) : null}
                <span className="profile-fallback notranslate" style={{ display: profileImageUrl ? 'none' : 'inline-flex' }}>
                  {(user?.fullName || user?.name || '?').charAt(0).toUpperCase()}
                </span>
              </div>
              <span
                className="user-profile-name-text"
                data-name={user?.fullName || user?.name || 'User'}
              />
            </button>

            {showUserProfile && (
              <div className="user-profile-dropdown">
                <div className="user-profile-header">
                  <div className="user-profile-avatar-large">
                    {profileImageUrl ? (
                      <img
                        src={profileImageUrl}
                        alt="Profile"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) e.target.nextSibling.style.display = 'inline-flex';
                        }}
                      />
                    ) : null}
                    <span className="profile-fallback-large notranslate" style={{ display: profileImageUrl ? 'none' : 'inline-flex' }}>
                      {(user?.fullName || user?.name || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="user-profile-info">
                    <div className="user-profile-name notranslate">{user?.fullName || user?.name || 'Admin User'}</div>
                    <div className="user-profile-email notranslate">{user?.email || ''}</div>
                    <div className="user-profile-role">{getAuthRole() || 'User'}</div>
                  </div>
                </div>
                <div className="user-profile-divider"></div>
                <button 
                  className="user-profile-logout-btn" 
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
