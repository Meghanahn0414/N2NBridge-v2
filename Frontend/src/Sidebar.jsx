import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "./Logo";
import { ROUTES } from "./app/routes/RouteConstants";
import {
  getAuthRole,
  getAuthUser,
  clearAuth,
} from './services/authStorage';
import "./styles/sidebar.css";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname.startsWith(path);
  const [role, setRole] = useState(getAuthRole());
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Session storage is tab-isolated, so no cross-tab sync is expected.
    // Keep this listener for fallback if some shared storage is used elsewhere.
    function handleStorage(e) {
      if (e.key === 'role') setRole(e.newValue);
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowLogoutConfirm(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const user = getAuthUser();
  const userName = user ? (user.name || user.fullName || user.first_name || 'User') : null;

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const toggleSidebar = () => setSidebarOpen((open) => !open);

  useEffect(() => {
    document.body.classList.toggle('sidebar-collapsed', !sidebarOpen);
  }, [sidebarOpen]);

  useEffect(() => {
    setSidebarOpen(true);
  }, [location.pathname]);

  const handleLogoutClick = () => {
    setShowLogoutConfirm((s) => !s);
  };

  return (
    <>
      <aside className={`sidebar ${sidebarOpen ? '' : 'closed'}`}>
        <div className="sidebar-top">
          {/* Logo Section */}
          <Logo />

          {/* Sidebar Hamburger */}
          {/* <button className="hamburger-btn sidebar-hamburger" onClick={toggleSidebar}>
            <FaBars />
          </button> */}
       

        <button className="hamburger-btn sidebar-hamburger" onClick={toggleSidebar}>
          <span aria-hidden="true">☰</span>
        </button>
         </div>

        <nav className="sidebar-menu">
          {(role === 'ADMIN' || role === 'admin') && (
            <>
              <button
                className={`sidebar-item ${isActive(ROUTES.admin) ? 'active' : ''}`}
                onClick={() => navigate(ROUTES.admin)}
              >
                <span style={{ marginRight: '10px' }}>📊</span> Dashboard
              </button>

              <button
                className={`sidebar-item ${isActive(ROUTES.adminUsers) ? 'active' : ''}`}
                onClick={() => navigate(ROUTES.adminUsers)}
              >
                <span style={{ marginRight: '10px' }}>👥</span> Users
              </button>

              <button
                className={`sidebar-item ${isActive(ROUTES.register) ? 'active' : ''}`}
                onClick={() => navigate(ROUTES.register)}
              >
                <span style={{ marginRight: '10px' }}>📝</span> Registration
              </button>

              <button
                className={`sidebar-item ${isActive(ROUTES.reports) ? 'active' : ''}`}
                onClick={() => navigate(ROUTES.reports)}
              >
                <span style={{ marginRight: '10px' }}>📁</span> Reports
              </button>

              <button
                className={`sidebar-item ${isActive(ROUTES.settings) ? 'active' : ''}`}
                onClick={() => navigate(ROUTES.settings)}
              >
                <span style={{ marginRight: '10px' }}>⚙️</span> Settings
              </button>
            </>
          )}
        </nav>

      {/* Bottom user area */}
      <div className="sidebar-footer" ref={dropdownRef}>
        {userName ? (
          <>
            <div className="sidebar-user" onClick={handleLogoutClick} role="button" tabIndex={0}>
              <span className="sidebar-user-icon">👤</span>
              <span className="sidebar-user-name">{userName}</span>
            </div>
            {showLogoutConfirm && (
              <div className="sidebar-logout-dropdown" onClick={(e) => e.stopPropagation()}>
                <div className="sidebar-logout-header">
                  <div className="sidebar-logout-title">Confirm Logout</div>
                </div>
                <div className="sidebar-logout-info">
                  <div className="sidebar-logout-name">{userName}</div>
                  <div className="sidebar-logout-email">{user?.email}</div>
                </div>
                <div className="sidebar-logout-actions">
                  <button className="sidebar-logout-no" onClick={() => setShowLogoutConfirm(false)}>
                    No
                  </button>
                  <button className="sidebar-logout-yes" onClick={handleLogout}>
                    Yes
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <button className="sidebar-item" onClick={() => navigate('/login')}>
            🔑 Login
          </button>
        )}
      </div>
    </aside>

    {!sidebarOpen && (
      <button className="sidebar-reopen-btn" onClick={toggleSidebar}>
        <span aria-hidden="true">☰</span>
      </button>
    )}
  </>
);
}