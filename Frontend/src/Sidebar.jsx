import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "./Logo";
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
        <div className="sidebar-brand">
          <Logo />
          <div className="sidebar-brand-text">
            <h1>VaarahiCRM</h1>
            <p>Citizen Relation Management</p>
          </div>
        </div>

        <button className="hamburger-btn sidebar-hamburger" onClick={toggleSidebar}>
          <span aria-hidden="true">☰</span>
        </button>

        <nav className="sidebar-menu">
        {/* Show doctor list only for Location Administrator */}
        {role === 'location_admin' && (
          <>
            <button
              className={`sidebar-item ${isActive('/location-doctors') ? 'active' : ''}`}
              onClick={() => navigate("/location-doctors")}
            >
              <span style={{ marginRight: '10px', verticalAlign: 'middle' }}>👨‍⚕️</span> Doctors
            </button>
            <button
              className={`sidebar-item ${isActive('/location-analysts') ? 'active' : ''}`}
              onClick={() => navigate("/location-analysts")}
            >
              <span style={{ marginRight: '10px', verticalAlign: 'middle' }}>👤</span> Analysts
            </button>
          </>
        )}

        {/* Show doctor details only when not analyst and not location administrator */}
        {role && role !== 'analyst' && role !== 'location_admin' && (
          <button
            className={`sidebar-item ${isActive('/doctor/details') ? 'active' : ''}`}
            onClick={() => navigate("/doctor/details")}
          >
            <span style={{ marginRight: '10px', verticalAlign: 'middle' }}>🩺</span> Appointments
          </button>
        )}

        {role == 'location_admin' && (
          <button
            className={`sidebar-item ${isActive('/patients') ? 'active' : ''}`}
            onClick={() => navigate("/patients")}
          >
            <span style={{ marginRight: '10px', verticalAlign: 'middle' }}>👥</span> Patients
          </button>
        )}

        {role == 'analyst' && (
           <button
          className={`sidebar-item ${isActive('/analyst/details') ? 'active' : ''}`}
          onClick={() => navigate("/analyst/details")}
        >
           <span style={{ marginRight: '10px', verticalAlign: 'middle' }}>👤</span> Analyst
        </button>
        )}
        {role == 'analyst' && (
        <>
         <button
            className={`sidebar-item ${isActive('/patients') ? 'active' : ''}`}
            onClick={() => navigate("/patients")}
          >
            <span style={{ marginRight: '10px', verticalAlign: 'middle' }}>👥</span> Patients
          </button>
        </>  
        )}
         {role == 'doctor' && (
          <>
            <button
              className={`sidebar-item ${isActive('/patients') ? 'active' : ''}`}
              onClick={() => navigate("/patients")}
            >
              <span style={{ marginRight: '10px', verticalAlign: 'middle' }}>👥</span> Patients
            </button>
          </>
        )}

        {/* Payment Links */}
        {/* <hr style={{ margin: '15px 0', border: 'none', borderTop: '1px solid rgba(0,0,0,0.1)' }} /> */}

        {/* Payment for all authenticated users */}
        {/* {role && role !== 'analyst' && (
          <button
            className={`sidebar-item ${isActive('/payment') ? 'active' : ''}`}
            onClick={() => navigate("/payment")}
          >
            <span style={{ marginRight: '10px', verticalAlign: 'middle' }}>💳</span> Patient Payment
          </button>
        )} */}

        {/* Admin Payment Management - only for location_admin */}
        {/* {role === 'location_admin' && (
          <button
            className={`sidebar-item ${isActive('/admin/payments') ? 'active' : ''}`}
            onClick={() => navigate("/admin/payments")}
          >
            <span style={{ marginRight: '10px', verticalAlign: 'middle' }}>📊</span> Payment Methods
          </button>
        )} */}
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