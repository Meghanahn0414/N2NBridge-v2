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

  // Construct profile image URL
  const getProfileImageUrl = () => {
    if (!user?.profileImage) return null;
    const img = user.profileImage;
    // If it's already a full URL, use it as-is
    if (img.startsWith('http://') || img.startsWith('https://')) {
      return img;
    }
    // Otherwise, prepend the backend base URL
    const baseUrl = import.meta.env.VITE_API_BASE_URL || `${window.location.protocol}//${window.location.hostname}:8000`;
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

  const toggleSidebar = () => setSidebarOpen((open) => !open);

  useEffect(() => {
    document.body.classList.toggle('sidebar-collapsed', !sidebarOpen);
  }, [sidebarOpen]);

  useEffect(() => {
    setSidebarOpen(true);
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

              {/* Admin Modules Section */}
              <div className="sidebar-section-divider" style={{ margin: '15px 0', borderTop: '1px solid #ddd' }}></div>
              
              <button
                className="sidebar-item sidebar-collapse-btn"
                onClick={() => setAdminModulesOpen(!adminModulesOpen)}
              >
                <span style={{ marginRight: '10px' }}>⚙️</span> 
                <span>Admin Modules</span>
                <span style={{ marginLeft: 'auto', fontSize: '12px' }}>
                  {adminModulesOpen ? '▼' : '▶'}
                </span>
              </button>

              {adminModulesOpen && (
                <>
                  <button
                    className={`sidebar-item sidebar-sub-item ${isActive(ROUTES.userManagement) ? 'active' : ''}`}
                    onClick={() => navigate(ROUTES.userManagement)}
                  >
                    <span style={{ marginRight: '8px' }}>👥</span> User Management
                  </button>
                  <button
                    className={`sidebar-item sidebar-sub-item ${isActive(ROUTES.constituencyManagement) ? 'active' : ''}`}
                    onClick={() => navigate(ROUTES.constituencyManagement)}
                  >
                    <span style={{ marginRight: '8px' }}>🗳️</span> Constituency Mgmt
                  </button>

                  <button
                    className={`sidebar-item sidebar-sub-item ${isActive(ROUTES.complaintManagement) ? 'active' : ''}`}
                    onClick={() => navigate(ROUTES.complaintManagement)}
                  >
                    <span style={{ marginRight: '8px' }}>📋</span> Complaint Mgmt
                  </button>

                  <button
                    className={`sidebar-item sidebar-sub-item ${isActive(ROUTES.alertManagement) ? 'active' : ''}`}
                    onClick={() => navigate(ROUTES.alertManagement)}
                  >
                    <span style={{ marginRight: '8px' }}>🚨</span> Alert Mgmt
                  </button>

                  <button
                    className={`sidebar-item sidebar-sub-item ${isActive(ROUTES.eventManagement) ? 'active' : ''}`}
                    onClick={() => navigate(ROUTES.eventManagement)}
                  >
                    <span style={{ marginRight: '8px' }}>📅</span> Event Mgmt
                  </button>

                  <button
                    className={`sidebar-item sidebar-sub-item ${isActive(ROUTES.communicationHub) ? 'active' : ''}`}
                    onClick={() => navigate(ROUTES.communicationHub)}
                  >
                    <span style={{ marginRight: '8px' }}>💬</span> Communication Hub
                  </button>

                  <button
                    className={`sidebar-item sidebar-sub-item ${isActive(ROUTES.campaignManagement) ? 'active' : ''}`}
                    onClick={() => navigate(ROUTES.campaignManagement)}
                  >
                    <span style={{ marginRight: '8px' }}>📢</span> Campaign Mgmt
                  </button>

                  <button
                    className={`sidebar-item sidebar-sub-item ${isActive(ROUTES.teamManagement) ? 'active' : ''}`}
                    onClick={() => navigate(ROUTES.teamManagement)}
                  >
                    <span style={{ marginRight: '8px' }}>👨‍💼</span> Team Mgmt
                  </button>

                  <button
                    className={`sidebar-item sidebar-sub-item ${isActive(ROUTES.analyticsReports) ? 'active' : ''}`}
                    onClick={() => navigate(ROUTES.analyticsReports)}
                  >
                    <span style={{ marginRight: '8px' }}>📊</span> Analytics & Reports
                  </button>

                  <button
                    className={`sidebar-item sidebar-sub-item ${isActive(ROUTES.aiServices) ? 'active' : ''}`}
                    onClick={() => navigate(ROUTES.aiServices)}
                  >
                    <span style={{ marginRight: '8px' }}>🤖</span> AI Services
                  </button>

                  <button
                    className={`sidebar-item sidebar-sub-item ${isActive(ROUTES.integrations) ? 'active' : ''}`}
                    onClick={() => navigate(ROUTES.integrations)}
                  >
                    <span style={{ marginRight: '8px' }}>🔗</span> Integrations
                  </button>

                  <button
                    className={`sidebar-item sidebar-sub-item ${isActive(ROUTES.systemConfiguration) ? 'active' : ''}`}
                    onClick={() => navigate(ROUTES.systemConfiguration)}
                  >
                    <span style={{ marginRight: '8px' }}>⚙️</span> System Config
                  </button>

                  <button
                    className={`sidebar-item sidebar-sub-item ${isActive(ROUTES.auditLogs) ? 'active' : ''}`}
                    onClick={() => navigate(ROUTES.auditLogs)}
                  >
                    <span style={{ marginRight: '8px' }}>📝</span> Audit Logs
                  </button>

                  <button
                    className={`sidebar-item sidebar-sub-item ${isActive(ROUTES.securityCenter) ? 'active' : ''}`}
                    onClick={() => navigate(ROUTES.securityCenter)}
                  >
                    <span style={{ marginRight: '8px' }}>🛡️</span> Security Center
                  </button>

                  <button
                    className={`sidebar-item sidebar-sub-item ${isActive(ROUTES.adminSettings) ? 'active' : ''}`}
                    onClick={() => navigate(ROUTES.adminSettings)}
                  >
                    <span style={{ marginRight: '8px' }}>⚙️</span> Settings
                  </button>
                </>
              )}

              <div className="sidebar-section-divider" style={{ margin: '15px 0', borderTop: '1px solid #ddd' }}></div>

              <button
                className={`sidebar-item ${isActive(ROUTES.adminUsers) ? 'active' : ''}`}
                onClick={() => navigate(ROUTES.adminUsers)}
              >
                <span style={{ marginRight: '10px' }}>👥</span> Citizens
              </button>

              {/* <button
                className={`sidebar-item ${isActive(ROUTES.events) ? 'active' : ''}`}
                onClick={() => navigate(ROUTES.events)}
              >
                <span style={{ marginRight: '10px' }}>📅</span> Events
              </button> */}

              {/* <button
                className={`sidebar-item ${isActive(ROUTES.alerts) ? 'active' : ''}`}
                onClick={() => navigate(ROUTES.alerts)}
              >
                <span style={{ marginRight: '10px' }}>🚨</span> Alerts
              </button> */}

              <button
                className={`sidebar-item ${isActive(ROUTES.register) ? 'active' : ''}`}
                onClick={() => navigate(ROUTES.register)}
              >
                <span style={{ marginRight: '10px' }}>📝</span> Registration
              </button>
              <button
                    className={`sidebar-item sidebar-sub-item ${isActive(ROUTES.rolePermissions) ? 'active' : ''}`}
                    onClick={() => navigate(ROUTES.rolePermissions)}
                  >
                    <span style={{ marginRight: '8px' }}>🔐</span> Role & Permissions
                  </button>
              <button
                className={`sidebar-item ${isActive(ROUTES.mlaList) ? 'active' : ''}`}
                onClick={() => navigate(ROUTES.mlaList)}
              >
                <span style={{ marginRight: '10px' }}>👔</span> Representatives
              </button>

              <button
                className={`sidebar-item ${isActive(ROUTES.managerList) ? 'active' : ''}`}
                onClick={() => navigate(ROUTES.managerList)}
              >
                <span style={{ marginRight: '10px' }}>👨‍💼</span> Managers
              </button>

              <button
                className={`sidebar-item ${isActive(ROUTES.fieldOfficerList) ? 'active' : ''}`}
                onClick={() => navigate(ROUTES.fieldOfficerList)}
              >
                <span style={{ marginRight: '10px' }}>👷</span> Field Officers
              </button>
            </>
          )}

          {(role === 'REPRESENTATIVE' || role === 'representative') && (
            <>
              {/* MLA Executive Dashboard */}
              <button
                className={`sidebar-item ${isActive(ROUTES.mlaExecutiveDashboard) ? 'active' : ''}`}
                onClick={() => navigate(ROUTES.mlaExecutiveDashboard)}
              >
                <span style={{ marginRight: '10px' }}>🏛️</span> Executive Dashboard
              </button>

              <div className="sidebar-section-divider" style={{ margin: '15px 0', borderTop: '1px solid #ddd' }}></div>

              {/* Constituency Overview */}
              <button
                className="sidebar-item sidebar-collapse-btn"
                onClick={() => setAdminModulesOpen(!adminModulesOpen)}
              >
                <span style={{ marginRight: '10px' }}>🗺️</span>
                <span>Constituency Overview</span>
                <span style={{ marginLeft: 'auto', fontSize: '12px' }}>
                  {adminModulesOpen ? '▼' : '▶'}
                </span>
              </button>

              {adminModulesOpen && (
                <>
                  <button
                    className={`sidebar-item sidebar-sub-item ${isActive(ROUTES.mlaConstituencyStatus) ? 'active' : ''}`}
                    onClick={() => navigate(ROUTES.mlaConstituencyStatus)}
                  >
                    <span style={{ marginRight: '8px' }}>📊</span> Live Status
                  </button>

                  <button
                    className={`sidebar-item sidebar-sub-item ${isActive(ROUTES.mlaHeatMap) ? 'active' : ''}`}
                    onClick={() => navigate(ROUTES.mlaHeatMap)}
                  >
                    <span style={{ marginRight: '8px' }}>🗺️</span> Heat Map
                  </button>
                </>
              )}

              {/* Citizen Services */}
              <button
                className="sidebar-item sidebar-collapse-btn"
                onClick={() => setAdminModulesOpen(!adminModulesOpen)}
              >
                <span style={{ marginRight: '10px' }}>👥</span>
                <span>Citizen Services</span>
                <span style={{ marginLeft: 'auto', fontSize: '12px' }}>
                  {adminModulesOpen ? '▼' : '▶'}
                </span>
              </button>

              {adminModulesOpen && (
                <>
                  <button
                    className={`sidebar-item sidebar-sub-item ${isActive(ROUTES.mlaComplaintsDashboard) ? 'active' : ''}`}
                    onClick={() => navigate(ROUTES.mlaComplaintsDashboard)}
                  >
                    <span style={{ marginRight: '8px' }}>📋</span> Complaints
                  </button>

                  <button
                    className={`sidebar-item sidebar-sub-item ${isActive(ROUTES.mlaEmergencyCenter) ? 'active' : ''}`}
                    onClick={() => navigate(ROUTES.mlaEmergencyCenter)}
                  >
                    <span style={{ marginRight: '8px' }}>🚨</span> Emergency Alerts
                  </button>
                </>
              )}

              {/* Events & Outreach */}
              <button
                className={`sidebar-item ${isActive(ROUTES.mlaEvents) ? 'active' : ''}`}
                onClick={() => navigate(ROUTES.mlaEvents)}
              >
                <span style={{ marginRight: '10px' }}>📅</span> Events & Programs
              </button>

              {/* People Management */}
              <button
                className={`sidebar-item ${isActive(ROUTES.mlaTeamPerformance) ? 'active' : ''}`}
                onClick={() => navigate(ROUTES.mlaTeamPerformance)}
              >
                <span style={{ marginRight: '10px' }}>👨‍💼</span> Team Performance
              </button>

              {/* Communications */}
              <button
                className={`sidebar-item ${isActive(ROUTES.mlaCommunications) ? 'active' : ''}`}
                onClick={() => navigate(ROUTES.mlaCommunications)}
              >
                <span style={{ marginRight: '10px' }}>💬</span> Communications
              </button>

              {/* Analytics */}
              <button
                className={`sidebar-item ${isActive(ROUTES.mlaCitizenSentiment) ? 'active' : ''}`}
                onClick={() => navigate(ROUTES.mlaCitizenSentiment)}
              >
                <span style={{ marginRight: '10px' }}>📊</span> Citizen Sentiment
              </button>

              {/* Government Schemes */}
              <button
                className={`sidebar-item ${isActive(ROUTES.mlaGovernmentSchemes) ? 'active' : ''}`}
                onClick={() => navigate(ROUTES.mlaGovernmentSchemes)}
              >
                <span style={{ marginRight: '10px' }}>🏛️</span> Schemes
              </button>

              {/* AI Insights */}
              <button
                className={`sidebar-item ${isActive(ROUTES.mlaAIInsights) ? 'active' : ''}`}
                onClick={() => navigate(ROUTES.mlaAIInsights)}
              >
                <span style={{ marginRight: '10px' }}>🤖</span> AI Insights
              </button>

              {/* Daily Briefing */}
              <button
                className={`sidebar-item ${isActive(ROUTES.mlaDailyBriefing) ? 'active' : ''}`}
                onClick={() => navigate(ROUTES.mlaDailyBriefing)}
              >
                <span style={{ marginRight: '10px' }}>📋</span> Daily Briefing
              </button>
            </>
          )}

          {(role === 'CONSTITUENCY_MANAGER' || role === 'MANAGER' || role === 'manager') && (
            <>
              <button
                className={`sidebar-item ${isActive(ROUTES.manager) ? 'active' : ''}`}
                onClick={() => navigate(ROUTES.manager)}
              >
                <span style={{ marginRight: '10px' }}>📊</span> Dashboard
              </button>

              <button
                className={`sidebar-item ${isActive(ROUTES.fieldOfficerList) ? 'active' : ''}`}
                onClick={() => navigate(ROUTES.fieldOfficerList)}
              >
                <span style={{ marginRight: '10px' }}>👷</span> Field Officers
              </button>
            </>
          )}

          {(role === 'CITIZEN' || role === 'citizen') && (
            <>
              <button
                className={`sidebar-item ${isActive(ROUTES.citizen) ? 'active' : ''}`}
                onClick={() => navigate(ROUTES.citizen)}
              >
                <span style={{ marginRight: '10px' }}>🏠</span> Dashboard
              </button>

              <div className="sidebar-section-divider" style={{ margin: '15px 0', borderTop: '1px solid #ddd' }}></div>

              <button
                className={`sidebar-item ${isActive(ROUTES.citizenCreateComplaint) ? 'active' : ''}`}
                onClick={() => navigate(ROUTES.citizenCreateComplaint)}
              >
                <span style={{ marginRight: '10px' }}>📝</span> Create Complaint
              </button>

              <button
                className={`sidebar-item ${isActive(ROUTES.citizenComplaintList) ? 'active' : ''}`}
                onClick={() => navigate(ROUTES.citizenComplaintList)}
              >
                <span style={{ marginRight: '10px' }}>📋</span> My Complaints
              </button>

              <div className="sidebar-section-divider" style={{ margin: '10px 0', borderTop: '1px solid #ddd' }}></div>

              <button
                className="sidebar-item"
                onClick={() => navigate(ROUTES.citizenEmergency)}
              >
                <span style={{ marginRight: '10px' }}>🚨</span> Emergency Alert
              </button>

              <button
                className="sidebar-item"
                onClick={() => navigate(ROUTES.citizenEvents)}
              >
                <span style={{ marginRight: '10px' }}>📅</span> Events
              </button>

              <button
                className="sidebar-item"
                onClick={() => navigate(ROUTES.citizenNotifications)}
              >
                <span style={{ marginRight: '10px' }}>🔔</span> Notifications
              </button>

              <div className="sidebar-section-divider" style={{ margin: '10px 0', borderTop: '1px solid #ddd' }}></div>

              <button
                className="sidebar-item"
                onClick={() => navigate(ROUTES.citizenFeedback)}
              >
                <span style={{ marginRight: '10px' }}>⭐</span> Feedback
              </button>

              <button
                className="sidebar-item"
                onClick={() => navigate(ROUTES.citizenProfile)}
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