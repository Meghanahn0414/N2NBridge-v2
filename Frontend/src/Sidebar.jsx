import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "./Logo";
import { ROUTES } from "./app/routes/RouteConstants";
import {
  getAuthRole,
  getAuthUser,
  clearAuth,
} from './services/authStorage';
import api from "./shared/services/api";
import "./styles/sidebar.css";

export default function Sidebar({ mobileOpen, onMobileClose, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname.startsWith(path);
  const [role, setRole] = useState(getAuthRole());
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [adminModulesOpen, setAdminModulesOpen] = useState(true);
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
  const userName = user ? (user.name || user.fullName || user.full_name || user.first_name || 'User') : null;
  const [openComplaintCount, setOpenComplaintCount] = useState(0);

  useEffect(() => {
    if (role === 'REPRESENTATIVE' || role === 'representative') {
      api.get('/api/grievances/', { params: { status: 'OPEN', per_page: 1 } })
        .then(res => {
          const total = res.data?.total ?? res.data?.data?.total ?? 0;
          setOpenComplaintCount(Number(total) || 0);
        })
        .catch(() => {});
    }
  }, [role]);

  // Construct profile image URL
  const getProfileImageUrl = () => {
    if (!user?.profileImage) return null;
    const img = user.profileImage;
    // If it's already a full URL, use it as-is
    if (img.startsWith('http://') || img.startsWith('https://')) {
      return img;
    }
    // Otherwise, prepend the backend base URL
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://10.62.179.92:8000';
    return `${baseUrl}/${img.startsWith('/') ? img.slice(1) : img}`;
  };

  const profileImageUrl = getProfileImageUrl();

  const handleLogout = () => {
    clearAuth();
    // Navigate to appropriate login page based on role
    if (role === 'CITIZEN' || role === 'citizen') {
      navigate('/citizen-login');
    } else {
      // Admin, Manager, Field Officer, Representative all use admin-login
      navigate('/admin-login');
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      if (onToggle) onToggle(next);
      return next;
    });
  };

  useEffect(() => {
    document.body.classList.toggle('sidebar-collapsed', !sidebarOpen);
  }, [sidebarOpen]);

  // Report initial open state on mount
  useEffect(() => {
    if (onToggle) onToggle(true);
  }, []);

  useEffect(() => {
    setSidebarOpen(true);
    if (onToggle) onToggle(true);
    if (onMobileClose) onMobileClose();
  }, [location.pathname]);

  // Debug: log user data for debugging profile image issues
  useEffect(() => {
    if (user) {
      console.log('[Sidebar] User data:', {
        name: userName,
        profileImage: user.profileImage,
        fullUrl: profileImageUrl,
      });
    }
  }, [user, userName, profileImageUrl]);

  const handleLogoutClick = () => {
    setShowLogoutConfirm((s) => !s);
  };

  const handleMobileNav = (path) => {
    navigate(path);
    if (onMobileClose) onMobileClose();
  };

  return (
    <>
      {/* Mobile overlay — dims the page behind the open drawer */}
      {mobileOpen && (
        <div
          className="sidebar-mobile-overlay"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}
      <aside className={`sidebar ${sidebarOpen ? '' : 'closed'}${mobileOpen ? ' mobile-open' : ''}`}>
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
              {/* ── OVERVIEW ── */}
              <div className="sidebar-section-label">Overview</div>
              <button className={`sidebar-item ${isActive(ROUTES.admin) ? 'active' : ''}`} onClick={() => handleMobileNav(ROUTES.admin)}>
                <span className="sidebar-icon">📊</span> Dashboard
              </button>

              <hr className="sidebar-section-hr" />

              {/* ── PEOPLE ── */}
              <div className="sidebar-section-label">People</div>
              <button className={`sidebar-item ${isActive(ROUTES.adminUsers) ? 'active' : ''}`} onClick={() => handleMobileNav(ROUTES.adminUsers)}>
                <span className="sidebar-icon">👥</span> Citizens
              </button>
              <button className={`sidebar-item ${isActive(ROUTES.mlaList) ? 'active' : ''}`} onClick={() => handleMobileNav(ROUTES.mlaList)}>
                <span className="sidebar-icon">👔</span> Representatives
              </button>
              <button className={`sidebar-item ${isActive(ROUTES.managerList) ? 'active' : ''}`} onClick={() => handleMobileNav(ROUTES.managerList)}>
                <span className="sidebar-icon">👨‍💼</span> Managers
              </button>
              <button className={`sidebar-item ${isActive(ROUTES.fieldOfficerList) ? 'active' : ''}`} onClick={() => handleMobileNav(ROUTES.fieldOfficerList)}>
                <span className="sidebar-icon">👷</span> Field Officers
              </button>

              <hr className="sidebar-section-hr" />

              {/* ── SERVICES ── */}
              <div className="sidebar-section-label">Services</div>
              <button className={`sidebar-item ${isActive(ROUTES.complaintManagement) ? 'active' : ''}`} onClick={() => handleMobileNav(ROUTES.complaintManagement)}>
                <span className="sidebar-icon">📋</span> Complaints
              </button>
              <button className={`sidebar-item ${isActive(ROUTES.alertManagement) ? 'active' : ''}`} onClick={() => handleMobileNav(ROUTES.alertManagement)}>
                <span className="sidebar-icon">🚨</span> Alerts
              </button>
              <button className={`sidebar-item ${isActive(ROUTES.eventManagement) ? 'active' : ''}`} onClick={() => handleMobileNav(ROUTES.eventManagement)}>
                <span className="sidebar-icon">📅</span> Events
              </button>
              <button className={`sidebar-item ${isActive(ROUTES.communicationHub) ? 'active' : ''}`} onClick={() => handleMobileNav(ROUTES.communicationHub)}>
                <span className="sidebar-icon">💬</span> Communication Hub
              </button>
              <button className={`sidebar-item ${isActive(ROUTES.campaignManagement) ? 'active' : ''}`} onClick={() => handleMobileNav(ROUTES.campaignManagement)}>
                <span className="sidebar-icon">📢</span> Campaigns
              </button>

              <hr className="sidebar-section-hr" />

              {/* ── SYSTEM ── */}
              <div className="sidebar-section-label">System</div>
              <button className={`sidebar-item ${isActive(ROUTES.analyticsReports) ? 'active' : ''}`} onClick={() => handleMobileNav(ROUTES.analyticsReports)}>
                <span className="sidebar-icon">📈</span> Analytics & Reports
              </button>
              <button className={`sidebar-item ${isActive(ROUTES.teamManagement) ? 'active' : ''}`} onClick={() => handleMobileNav(ROUTES.teamManagement)}>
                <span className="sidebar-icon">🤝</span> Team Management
              </button>
              <button className={`sidebar-item ${isActive(ROUTES.aiServices) ? 'active' : ''}`} onClick={() => handleMobileNav(ROUTES.aiServices)}>
                <span className="sidebar-icon">🤖</span> AI Services
              </button>
              <button className={`sidebar-item ${isActive(ROUTES.constituencyManagement) ? 'active' : ''}`} onClick={() => handleMobileNav(ROUTES.constituencyManagement)}>
                <span className="sidebar-icon">🗳️</span> Constituencies
              </button>
              <button className={`sidebar-item ${isActive(ROUTES.integrations) ? 'active' : ''}`} onClick={() => handleMobileNav(ROUTES.integrations)}>
                <span className="sidebar-icon">🔗</span> Integrations
              </button>
              <button className={`sidebar-item ${isActive(ROUTES.systemConfiguration) ? 'active' : ''}`} onClick={() => handleMobileNav(ROUTES.systemConfiguration)}>
                <span className="sidebar-icon">🖥️</span> System Config
              </button>
              <button className={`sidebar-item ${isActive(ROUTES.auditLogs) ? 'active' : ''}`} onClick={() => handleMobileNav(ROUTES.auditLogs)}>
                <span className="sidebar-icon">📝</span> Audit Logs
              </button>
              <button className={`sidebar-item ${isActive(ROUTES.securityCenter) ? 'active' : ''}`} onClick={() => handleMobileNav(ROUTES.securityCenter)}>
                <span className="sidebar-icon">🛡️</span> Security Center
              </button>

              {/* ── PINNED BOTTOM ── */}
              <div className="sidebar-pinned-bottom">
                <button className={`sidebar-item ${isActive(ROUTES.userManagement) ? 'active' : ''}`} onClick={() => handleMobileNav(ROUTES.userManagement)}>
                  <span className="sidebar-icon">⚙️</span> User Management
                </button>
                <button className={`sidebar-item ${isActive(ROUTES.register) ? 'active' : ''}`} onClick={() => handleMobileNav(ROUTES.register)}>
                  <span className="sidebar-icon">📝</span> Registration
                </button>
                <button className={`sidebar-item ${isActive(ROUTES.rolePermissions) ? 'active' : ''}`} onClick={() => handleMobileNav(ROUTES.rolePermissions)}>
                  <span className="sidebar-icon">🔐</span> Role & Permissions
                </button>
                <button className={`sidebar-item sidebar-item--settings ${isActive(ROUTES.adminSettings) ? 'active' : ''}`} onClick={() => handleMobileNav(ROUTES.adminSettings)}>
                  <span className="sidebar-icon">⚙️</span> Settings
                </button>
              </div>
            </>
          )}

          {(role === 'REPRESENTATIVE' || role === 'representative') && (
            <>
              {/* ── OVERVIEW ── */}
              <div className="sidebar-section-label">Overview</div>
              <button className={`sidebar-item ${isActive(ROUTES.mlaExecutiveDashboard) ? 'active' : ''}`} onClick={() => handleMobileNav(ROUTES.mlaExecutiveDashboard)}>
                <span className="sidebar-icon">🏛️</span> Executive Dashboard
              </button>
              <button className={`sidebar-item ${isActive(ROUTES.mlaDailyBriefing) ? 'active' : ''}`} onClick={() => handleMobileNav(ROUTES.mlaDailyBriefing)}>
                <span className="sidebar-icon">📋</span> Daily Briefing
              </button>

              <hr className="sidebar-section-hr" />

              {/* ── MONITORING ── */}
              <div className="sidebar-section-label">Monitoring</div>
              <button className={`sidebar-item ${isActive(ROUTES.mlaConstituencyStatus) ? 'active' : ''}`} onClick={() => handleMobileNav(ROUTES.mlaConstituencyStatus)}>
                <span className="sidebar-icon">📊</span> Live Status
              </button>
              <button className={`sidebar-item ${isActive(ROUTES.mlaHeatMap) ? 'active' : ''}`} onClick={() => handleMobileNav(ROUTES.mlaHeatMap)}>
                <span className="sidebar-icon">🗺️</span> Heat Map
              </button>
              <button className={`sidebar-item ${isActive(ROUTES.mlaAIInsights) ? 'active' : ''}`} onClick={() => handleMobileNav(ROUTES.mlaAIInsights)}>
                <span className="sidebar-icon">🤖</span> AI Insights
              </button>

              <hr className="sidebar-section-hr" />

              {/* ── CITIZEN SERVICES ── */}
              <div className="sidebar-section-label">Citizen Services</div>
              <button className={`sidebar-item ${isActive(ROUTES.mlaComplaintsDashboard) ? 'active' : ''}`} onClick={() => handleMobileNav(ROUTES.mlaComplaintsDashboard)}>
                <span className="sidebar-icon">📋</span> Complaints
                {openComplaintCount > 0 && <span className="sidebar-badge">{openComplaintCount}</span>}
              </button>
              <button className={`sidebar-item ${isActive(ROUTES.mlaEmergencyCenter) ? 'active' : ''}`} onClick={() => handleMobileNav(ROUTES.mlaEmergencyCenter)}>
                <span className="sidebar-icon">🚨</span> Emergency
              </button>
              <button className={`sidebar-item ${isActive(ROUTES.mlaCitizenSentiment) ? 'active' : ''}`} onClick={() => handleMobileNav(ROUTES.mlaCitizenSentiment)}>
                <span className="sidebar-icon">😊</span> Citizen Sentiment
              </button>

              <hr className="sidebar-section-hr" />

              {/* ── PROGRAMS ── */}
              <div className="sidebar-section-label">Programs</div>
              <button className={`sidebar-item ${isActive(ROUTES.mlaEvents) ? 'active' : ''}`} onClick={() => handleMobileNav(ROUTES.mlaEvents)}>
                <span className="sidebar-icon">📅</span> Events & Programs
              </button>
              <button className={`sidebar-item ${isActive(ROUTES.mlaGovernmentSchemes) ? 'active' : ''}`} onClick={() => handleMobileNav(ROUTES.mlaGovernmentSchemes)}>
                <span className="sidebar-icon">🏛️</span> Gov Schemes
              </button>

              <hr className="sidebar-section-hr" />

              {/* ── TEAM ── */}
              <div className="sidebar-section-label">Team</div>
              <button className={`sidebar-item ${isActive(ROUTES.mlaTeamPerformance) ? 'active' : ''}`} onClick={() => handleMobileNav(ROUTES.mlaTeamPerformance)}>
                <span className="sidebar-icon">👨‍💼</span> Team Performance
              </button>
              <button className={`sidebar-item ${isActive(ROUTES.mlaCommunications) ? 'active' : ''}`} onClick={() => handleMobileNav(ROUTES.mlaCommunications)}>
                <span className="sidebar-icon">💬</span> Communications
              </button>

              {/* ── PINNED BOTTOM: Settings ── */}
              <div className="sidebar-pinned-bottom">
                <button className="sidebar-item sidebar-item--settings" onClick={() => handleMobileNav(ROUTES.adminSettings || '/settings')}>
                  <span className="sidebar-icon">⚙️</span> Settings
                </button>
              </div>
            </>
          )}

          {(role === 'CONSTITUENCY_MANAGER' || role === 'MANAGER' || role === 'manager') && (
            <>
              <button
                className={`sidebar-item ${isActive(ROUTES.manager) ? 'active' : ''}`}
                onClick={() => handleMobileNav(ROUTES.manager)}
              >
                <span style={{ marginRight: '10px' }}>📊</span> Dashboard
              </button>

              <button
                className={`sidebar-item ${isActive(ROUTES.fieldOfficerList) ? 'active' : ''}`}
                onClick={() => handleMobileNav(ROUTES.fieldOfficerList)}
              >
                <span style={{ marginRight: '10px' }}>👷</span> Field Officers
              </button>
            </>
          )}

          {(role === 'FIELD_OFFICER' || role === 'field_officer') && (
            <>
              {/* ── OVERVIEW ── */}
              <div className="sidebar-section-label">Overview</div>
              <button
                className={`sidebar-item ${isActive(ROUTES.field) ? 'active' : ''}`}
                onClick={() => handleMobileNav(ROUTES.field)}
              >
                <span className="sidebar-icon">📊</span> Dashboard
              </button>

              <hr className="sidebar-section-hr" />

              {/* ── WORK ── */}
              <div className="sidebar-section-label">Work</div>
              <button
                className={`sidebar-item ${isActive(ROUTES.fieldGrievances) ? 'active' : ''}`}
                onClick={() => handleMobileNav(ROUTES.fieldGrievances)}
              >
                <span className="sidebar-icon">📋</span> Assigned Grievances
              </button>
              <button
                className={`sidebar-item ${isActive(ROUTES.fieldAlerts) ? 'active' : ''}`}
                onClick={() => handleMobileNav(ROUTES.fieldAlerts)}
              >
                <span className="sidebar-icon">🚨</span> Alerts
              </button>
              <button
                className={`sidebar-item ${isActive(ROUTES.fieldEvents) ? 'active' : ''}`}
                onClick={() => handleMobileNav(ROUTES.fieldEvents)}
              >
                <span className="sidebar-icon">📅</span> Events
              </button>

              <hr className="sidebar-section-hr" />

              {/* ── ACCOUNT ── */}
              <div className="sidebar-section-label">Account</div>
              <button
                className={`sidebar-item ${isActive(ROUTES.fieldProfile) ? 'active' : ''}`}
                onClick={() => handleMobileNav(ROUTES.fieldProfile)}
              >
                <span className="sidebar-icon">👤</span> My Profile
              </button>
            </>
          )}

          {(role === 'CITIZEN' || role === 'citizen') && (
            <>
              <button
                className={`sidebar-item ${isActive(ROUTES.citizen) ? 'active' : ''}`}
                onClick={() => handleMobileNav(ROUTES.citizen)}
              >
                <span style={{ marginRight: '10px' }}>🏠</span> Dashboard
              </button>

              <div className="sidebar-section-divider" style={{ margin: '15px 0', borderTop: '1px solid #ddd' }}></div>

              <button
                className={`sidebar-item ${isActive(ROUTES.citizenCreateComplaint) ? 'active' : ''}`}
                onClick={() => handleMobileNav(ROUTES.citizenCreateComplaint)}
              >
                <span style={{ marginRight: '10px' }}>📝</span> Create Complaint
              </button>

              <button
                className={`sidebar-item ${isActive(ROUTES.citizenComplaintList) ? 'active' : ''}`}
                onClick={() => handleMobileNav(ROUTES.citizenComplaintList)}
              >
                <span style={{ marginRight: '10px' }}>📋</span> My Complaints
              </button>

              <div className="sidebar-section-divider" style={{ margin: '10px 0', borderTop: '1px solid #ddd' }}></div>

              <button
                className="sidebar-item"
                onClick={() => handleMobileNav(ROUTES.citizenEmergency)}
              >
                <span style={{ marginRight: '10px' }}>🚨</span> Emergency Alert
              </button>

              <button
                className="sidebar-item"
                onClick={() => handleMobileNav(ROUTES.citizenEvents)}
              >
                <span style={{ marginRight: '10px' }}>📅</span> Events
              </button>

              <button
                className="sidebar-item"
                onClick={() => handleMobileNav(ROUTES.citizenNotifications)}
              >
                <span style={{ marginRight: '10px' }}>🔔</span> Notifications
              </button>

              <div className="sidebar-section-divider" style={{ margin: '10px 0', borderTop: '1px solid #ddd' }}></div>

              <button
                className="sidebar-item"
                onClick={() => handleMobileNav(ROUTES.citizenFeedback)}
              >
                <span style={{ marginRight: '10px' }}>⭐</span> Feedback
              </button>

              <button
                className="sidebar-item"
                onClick={() => handleMobileNav(ROUTES.citizenProfile)}
              >
                <span style={{ marginRight: '10px' }}>👤</span> Profile
              </button>
            </>
          )}
        </nav>

      {/* Bottom user area - Removed */}
    </aside>

    {!sidebarOpen && (
      <button className="sidebar-reopen-btn" onClick={toggleSidebar}>
        <span aria-hidden="true">☰</span>
      </button>
    )}
  </>
);
}