import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "./app/routes/RouteConstants";
import { getAuthRole, getAuthUser, clearAuth } from "./services/authStorage";
import api from "./shared/services/api";
import "./styles/Sidebar.css";

import {
  RiDashboardLine,
  RiGroupLine,
  RiFileListLine,
  RiAlarmWarningLine,
  RiCalendarLine,
  RiMessage3Line,
  RiBarChartGroupedLine,
  RiTeamLine,
  RiSettings4Line,
  RiLogoutBoxRLine,
  RiRobot2Line,
  RiShieldLine,
  RiFileSearchLine,
  RiMapPinLine,
  RiCpuLine,
  RiLinksLine,
  RiListSettingsLine,
  RiUserSettingsLine,
  RiKeyLine,
  RiUserLine,
  RiVipCrownLine,
  RiSurveyLine,
  RiGlobalLine,
  RiBroadcastLine,
  RiHeartPulseLine,
  RiEmotionHappyLine,
  RiBriefcaseLine,
  RiFlashlightLine,
  RiMenuLine,
  RiArrowLeftSLine,
  RiNotification3Line,
  RiUserAddLine,
  RiAdminLine,
  RiHospitalLine,
} from "react-icons/ri";

/** Popup rendered via portal so sidebar's overflow:hidden never clips it */
function LogoutConfirmPopup({ userName, collapsed, anchorRef, onCancel, onConfirm }) {
  const popupRef = useRef(null);
  const [style, setStyle] = useState({});

  useEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setStyle({
        position: "fixed",
        bottom: window.innerHeight - rect.top + 8,
        left: rect.left,
        width: rect.width,
        zIndex: 2000,
      });
    }
  }, [anchorRef]);

  useEffect(() => {
    const handleOutside = (e) => {
      if (
        popupRef.current && !popupRef.current.contains(e.target) &&
        anchorRef.current && !anchorRef.current.contains(e.target)
      ) {
        onCancel();
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [onCancel, anchorRef]);

  return (
    <div className="sidebar-logout-card" ref={popupRef} style={style}>
      <p className="sidebar-logout-prompt">Sign out?</p>
      {!collapsed && <p className="sidebar-logout-name notranslate">{userName}</p>}
      <div className="sidebar-logout-actions">
        <button
          className="sidebar-logout-no"
          onClick={(e) => { e.stopPropagation(); onCancel(); }}
        >
          Cancel
        </button>
        <button
          className="sidebar-logout-yes"
          onClick={(e) => { e.stopPropagation(); onConfirm(); }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

function NavItem({ icon: Icon, label, active, onClick, badge, collapsed }) {
  return (
    <button
      className={`sidebar-item${active ? " active" : ""}`}
      onClick={onClick}
      title={collapsed ? label : undefined}
    >
      <span className="sidebar-item-icon">
        <Icon size={18} />
      </span>
      {!collapsed && <span className="sidebar-item-label">{label}</span>}
      {!collapsed && badge > 0 && (
        <span className="sidebar-badge">{badge}</span>
      )}
      {collapsed && badge > 0 && (
        <span className="sidebar-badge sidebar-badge--dot" />
      )}
    </button>
  );
}

function SectionLabel({ children, collapsed }) {
  if (collapsed) return <div className="sidebar-section-dot" />;
  return <div className="sidebar-section-label">{children}</div>;
}

export default function Sidebar({ mobileOpen, onMobileClose, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path, exact = false) =>
    exact
      ? location.pathname === path
      : location.pathname === path || location.pathname.startsWith(path + "/");
  const [role, setRole] = useState(getAuthRole());
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [openComplaintCount, setOpenComplaintCount] = useState(0);
  const dropdownRef = useRef(null);
  const user = getAuthUser();
  const userName = user
    ? user.name || user.fullName || user.full_name || user.first_name || "User"
    : "User";
  const userRole = role ? role.replace(/_/g, " ") : "";

  useEffect(() => {
    function handleStorage(e) {
      if (e.key === "role") setRole(e.newValue);
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // click-outside for logout popup is handled inside LogoutConfirmPopup itself

  useEffect(() => {
    if (role === "REPRESENTATIVE" || role === "representative") {
      api
        .get("/api/grievances/", { params: { status: "OPEN", per_page: 1 } })
        .then((res) => {
          const total = res.data?.total ?? res.data?.data?.total ?? 0;
          setOpenComplaintCount(Number(total) || 0);
        })
        .catch(() => {});
    }
  }, [role]);

  const getProfileImageUrl = () => {
    if (!user?.profileImage) return null;
    const img = user.profileImage;
    if (img.startsWith("http://") || img.startsWith("https://")) return img;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://10.62.179.92:8000";
    return `${baseUrl}/${img.startsWith("/") ? img.slice(1) : img}`;
  };
  const profileImageUrl = getProfileImageUrl();

  const doLogout = () => {
    clearAuth();
    const loginPath = (role === "CITIZEN" || role === "citizen")
      ? "/citizen-login"
      : "/login";
    window.location.replace(loginPath);
  };

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      if (onToggle) onToggle(!next); // collapsed = sidebar narrower
      return next;
    });
  };

  useEffect(() => {
    document.body.classList.toggle("sidebar-collapsed", collapsed);
  }, [collapsed]);

  useEffect(() => {
    if (onToggle) onToggle(true);
  }, []);

  useEffect(() => {
    if (onMobileClose) onMobileClose();
  }, [location.pathname]);

  const go = (path) => {
    navigate(path);
    if (onMobileClose) onMobileClose();
  };

  const isAdmin = role === "ADMIN" || role === "admin";
  const isRep = role === "REPRESENTATIVE" || role === "representative";
  const isManager = role === "CONSTITUENCY_MANAGER" || role === "MANAGER" || role === "manager";
  const isField = role === "FIELD_OFFICER" || role === "field_officer";
  const isCitizen = role === "CITIZEN" || role === "citizen";

  return (
    <>
      {mobileOpen && (
        <div className="sidebar-mobile-overlay" onClick={onMobileClose} aria-hidden="true" />
      )}

      <aside className={`sidebar${collapsed ? " collapsed" : ""}${mobileOpen ? " mobile-open" : ""}`}>
        {/* ── TOP BRAND ── */}
        <div className="sidebar-brand">
          <button className="sidebar-collapse-toggle" onClick={toggleCollapse} title="Toggle sidebar">
            {collapsed ? <RiMenuLine size={18} /> : <RiArrowLeftSLine size={20} />}
          </button>
        </div>

        {/* ── NAV ── */}
        <nav className="sidebar-menu">

          {/* ────────────── ADMIN ────────────── */}
          {isAdmin && (
            <>
              <SectionLabel collapsed={collapsed}>Overview</SectionLabel>
              <NavItem icon={RiDashboardLine} label="Dashboard" active={isActive(ROUTES.admin, true)} onClick={() => go(ROUTES.admin)} collapsed={collapsed} />

              <div className="sidebar-section-hr" />
              <SectionLabel collapsed={collapsed}>People</SectionLabel>
              <NavItem icon={RiGroupLine} label="Citizens" active={isActive(ROUTES.adminUsers)} onClick={() => go(ROUTES.adminUsers)} collapsed={collapsed} />
              <NavItem icon={RiVipCrownLine} label="Representatives" active={isActive(ROUTES.mlaList)} onClick={() => go(ROUTES.mlaList)} collapsed={collapsed} />
              <NavItem icon={RiBriefcaseLine} label="Managers" active={isActive(ROUTES.managerList)} onClick={() => go(ROUTES.managerList)} collapsed={collapsed} />
              <NavItem icon={RiUserLine} label="Field Officers" active={isActive(ROUTES.fieldOfficerList)} onClick={() => go(ROUTES.fieldOfficerList)} collapsed={collapsed} />

              <div className="sidebar-section-hr" />
              <SectionLabel collapsed={collapsed}>Services</SectionLabel>
              <NavItem icon={RiFileListLine} label="Complaints" active={isActive(ROUTES.complaintManagement)} onClick={() => go(ROUTES.complaintManagement)} collapsed={collapsed} />
              <NavItem icon={RiAlarmWarningLine} label="Alerts" active={isActive(ROUTES.alertManagement)} onClick={() => go(ROUTES.alertManagement)} collapsed={collapsed} />
              <NavItem icon={RiCalendarLine} label="Events" active={isActive(ROUTES.eventManagement)} onClick={() => go(ROUTES.eventManagement)} collapsed={collapsed} />
              <NavItem icon={RiMessage3Line} label="Communication Hub" active={isActive(ROUTES.communicationHub)} onClick={() => go(ROUTES.communicationHub)} collapsed={collapsed} />
              <NavItem icon={RiBroadcastLine} label="Campaigns" active={isActive(ROUTES.campaignManagement)} onClick={() => go(ROUTES.campaignManagement)} collapsed={collapsed} />

              <div className="sidebar-section-hr" />
              <SectionLabel collapsed={collapsed}>System</SectionLabel>
              <NavItem icon={RiBarChartGroupedLine} label="Analytics & Reports" active={isActive(ROUTES.analyticsReports)} onClick={() => go(ROUTES.analyticsReports)} collapsed={collapsed} />
              <NavItem icon={RiTeamLine} label="Team Management" active={isActive(ROUTES.teamManagement)} onClick={() => go(ROUTES.teamManagement)} collapsed={collapsed} />
              <NavItem icon={RiRobot2Line} label="AI Services" active={isActive(ROUTES.aiServices)} onClick={() => go(ROUTES.aiServices)} collapsed={collapsed} />
              <NavItem icon={RiGlobalLine} label="Constituencies" active={isActive(ROUTES.constituencyManagement)} onClick={() => go(ROUTES.constituencyManagement)} collapsed={collapsed} />
              <NavItem icon={RiLinksLine} label="Integrations" active={isActive(ROUTES.integrations)} onClick={() => go(ROUTES.integrations)} collapsed={collapsed} />
              <NavItem icon={RiCpuLine} label="System Config" active={isActive(ROUTES.systemConfiguration)} onClick={() => go(ROUTES.systemConfiguration)} collapsed={collapsed} />
              <NavItem icon={RiFileSearchLine} label="Audit Logs" active={isActive(ROUTES.auditLogs)} onClick={() => go(ROUTES.auditLogs)} collapsed={collapsed} />
              <NavItem icon={RiShieldLine} label="Security Center" active={isActive(ROUTES.securityCenter)} onClick={() => go(ROUTES.securityCenter)} collapsed={collapsed} />

              <div className="sidebar-pinned-bottom">
                <div className="sidebar-section-hr" />
                <NavItem icon={RiUserSettingsLine} label="User Management" active={isActive(ROUTES.userManagement)} onClick={() => go(ROUTES.userManagement)} collapsed={collapsed} />
                <NavItem icon={RiUserAddLine} label="Registration" active={isActive(ROUTES.register)} onClick={() => go(ROUTES.register)} collapsed={collapsed} />
                <NavItem icon={RiKeyLine} label="Role & Permissions" active={isActive(ROUTES.rolePermissions)} onClick={() => go(ROUTES.rolePermissions)} collapsed={collapsed} />
                <NavItem icon={RiSettings4Line} label="Settings" active={isActive(ROUTES.adminSettings)} onClick={() => go(ROUTES.adminSettings)} collapsed={collapsed} />
              </div>
            </>
          )}

          {/* ────────────── REPRESENTATIVE ────────────── */}
          {isRep && (
            <>
              <SectionLabel collapsed={collapsed}>Overview</SectionLabel>
              <NavItem icon={RiVipCrownLine} label="Executive Dashboard" active={isActive(ROUTES.mlaExecutiveDashboard)} onClick={() => go(ROUTES.mlaExecutiveDashboard)} collapsed={collapsed} />
              <NavItem icon={RiSurveyLine} label="Daily Briefing" active={isActive(ROUTES.mlaDailyBriefing)} onClick={() => go(ROUTES.mlaDailyBriefing)} collapsed={collapsed} />

              <div className="sidebar-section-hr" />
              <SectionLabel collapsed={collapsed}>Monitoring</SectionLabel>
              <NavItem icon={RiHeartPulseLine} label="Live Status" active={isActive(ROUTES.mlaConstituencyStatus)} onClick={() => go(ROUTES.mlaConstituencyStatus)} collapsed={collapsed} />
              <NavItem icon={RiMapPinLine} label="Heat Map" active={isActive(ROUTES.mlaHeatMap)} onClick={() => go(ROUTES.mlaHeatMap)} collapsed={collapsed} />
              <NavItem icon={RiRobot2Line} label="AI Insights" active={isActive(ROUTES.mlaAIInsights)} onClick={() => go(ROUTES.mlaAIInsights)} collapsed={collapsed} />

              <div className="sidebar-section-hr" />
              <SectionLabel collapsed={collapsed}>Citizen Services</SectionLabel>
              <NavItem icon={RiFileListLine} label="Complaints" active={isActive(ROUTES.mlaComplaintsDashboard)} onClick={() => go(ROUTES.mlaComplaintsDashboard)} badge={openComplaintCount} collapsed={collapsed} />
              <NavItem icon={RiFlashlightLine} label="Emergency" active={isActive(ROUTES.mlaEmergencyCenter)} onClick={() => go(ROUTES.mlaEmergencyCenter)} collapsed={collapsed} />
              <NavItem icon={RiEmotionHappyLine} label="Citizen Sentiment" active={isActive(ROUTES.mlaCitizenSentiment)} onClick={() => go(ROUTES.mlaCitizenSentiment)} collapsed={collapsed} />

              <div className="sidebar-section-hr" />
              <SectionLabel collapsed={collapsed}>Programs</SectionLabel>
              <NavItem icon={RiCalendarLine} label="Events & Programs" active={isActive(ROUTES.mlaEvents)} onClick={() => go(ROUTES.mlaEvents)} collapsed={collapsed} />
              <NavItem icon={RiHospitalLine} label="Gov Schemes" active={isActive(ROUTES.mlaGovernmentSchemes)} onClick={() => go(ROUTES.mlaGovernmentSchemes)} collapsed={collapsed} />

              <div className="sidebar-section-hr" />
              <SectionLabel collapsed={collapsed}>Team</SectionLabel>
              <NavItem icon={RiTeamLine} label="Team Performance" active={isActive(ROUTES.mlaTeamPerformance)} onClick={() => go(ROUTES.mlaTeamPerformance)} collapsed={collapsed} />
              <NavItem icon={RiMessage3Line} label="Communications" active={isActive(ROUTES.mlaCommunications)} onClick={() => go(ROUTES.mlaCommunications)} collapsed={collapsed} />

              <div className="sidebar-pinned-bottom">
                <div className="sidebar-section-hr" />
                <NavItem icon={RiSettings4Line} label="Settings" active={isActive(ROUTES.adminSettings || "/settings")} onClick={() => go(ROUTES.adminSettings || "/settings")} collapsed={collapsed} />
              </div>
            </>
          )}

          {/* ────────────── MANAGER ────────────── */}
          {isManager && (
            <>
              <SectionLabel collapsed={collapsed}>Overview</SectionLabel>
              <NavItem icon={RiDashboardLine} label="Dashboard" active={isActive(ROUTES.manager, true)} onClick={() => go(ROUTES.manager)} collapsed={collapsed} />

              <div className="sidebar-section-hr" />
              <SectionLabel collapsed={collapsed}>Team</SectionLabel>
              <NavItem icon={RiUserLine} label="Field Officers" active={isActive(ROUTES.fieldOfficerList)} onClick={() => go(ROUTES.fieldOfficerList)} collapsed={collapsed} />
            </>
          )}

          {/* ────────────── FIELD OFFICER ────────────── */}
          {isField && (
            <>
              <SectionLabel collapsed={collapsed}>Overview</SectionLabel>
              <NavItem icon={RiDashboardLine} label="Dashboard" active={isActive(ROUTES.field, true)} onClick={() => go(ROUTES.field)} collapsed={collapsed} />

              <div className="sidebar-section-hr" />
              <SectionLabel collapsed={collapsed}>Work</SectionLabel>
              <NavItem icon={RiFileListLine} label="Assigned Grievances" active={isActive(ROUTES.fieldGrievances)} onClick={() => go(ROUTES.fieldGrievances)} collapsed={collapsed} />
              <NavItem icon={RiAlarmWarningLine} label="Alerts" active={isActive(ROUTES.fieldAlerts)} onClick={() => go(ROUTES.fieldAlerts)} collapsed={collapsed} />
              <NavItem icon={RiCalendarLine} label="Events" active={isActive(ROUTES.fieldEvents)} onClick={() => go(ROUTES.fieldEvents)} collapsed={collapsed} />

              <div className="sidebar-section-hr" />
              <SectionLabel collapsed={collapsed}>Account</SectionLabel>
              <NavItem icon={RiUserLine} label="My Profile" active={isActive(ROUTES.fieldProfile)} onClick={() => go(ROUTES.fieldProfile)} collapsed={collapsed} />
            </>
          )}

          {/* ────────────── CITIZEN ────────────── */}
          {isCitizen && (
            <>
              <SectionLabel collapsed={collapsed}>Home</SectionLabel>
              <NavItem icon={RiDashboardLine} label="Dashboard" active={isActive(ROUTES.citizen, true)} onClick={() => go(ROUTES.citizen)} collapsed={collapsed} />

              <div className="sidebar-section-hr" />
              <SectionLabel collapsed={collapsed}>Complaints</SectionLabel>
              <NavItem icon={RiFileListLine} label="My Complaints" active={isActive(ROUTES.citizenComplaintList)} onClick={() => go(ROUTES.citizenComplaintList)} collapsed={collapsed} />
              <NavItem icon={RiAdminLine} label="Submit Complaint" active={isActive(ROUTES.citizenCreateComplaint)} onClick={() => go(ROUTES.citizenCreateComplaint)} collapsed={collapsed} />

              <div className="sidebar-section-hr" />
              <SectionLabel collapsed={collapsed}>Community</SectionLabel>
              <NavItem icon={RiFlashlightLine} label="Emergency Alert" onClick={() => go(ROUTES.citizenEmergency)} collapsed={collapsed} />
              <NavItem icon={RiCalendarLine} label="Events" onClick={() => go(ROUTES.citizenEvents)} collapsed={collapsed} />
              <NavItem icon={RiBroadcastLine} label="Campaigns" onClick={() => go(ROUTES.citizenCampaigns)} collapsed={collapsed} />
              <NavItem icon={RiNotification3Line} label="Notifications" onClick={() => go(ROUTES.citizenNotifications)} collapsed={collapsed} />

              <div className="sidebar-section-hr" />
              <SectionLabel collapsed={collapsed}>Account</SectionLabel>
              <NavItem icon={RiSurveyLine} label="Surveys" onClick={() => go(ROUTES.citizenSurveys)} collapsed={collapsed} />
              <NavItem icon={RiSurveyLine} label="Feedback" onClick={() => go(ROUTES.citizenFeedback)} collapsed={collapsed} />
              <NavItem icon={RiUserLine} label="Profile" onClick={() => go(ROUTES.citizenProfile)} collapsed={collapsed} />
            </>
          )}
        </nav>

        {/* ── BOTTOM USER AREA ── */}
        {/* Portal: logout confirm rendered in <body> so sidebar overflow:hidden can't clip it */}
        {showLogoutConfirm && createPortal(
          <LogoutConfirmPopup
            userName={userName}
            collapsed={collapsed}
            anchorRef={dropdownRef}
            onCancel={() => setShowLogoutConfirm(false)}
            onConfirm={doLogout}
          />,
          document.body
        )}

        <div className="sidebar-footer" ref={dropdownRef}>
          <button
            className="sidebar-user-btn"
            onClick={() => setShowLogoutConfirm((s) => !s)}
            title={collapsed ? `${userName} — Sign out` : undefined}
          >
            <div className="sidebar-avatar">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt={userName} className="sidebar-avatar-img" />
              ) : (
                <span className="sidebar-avatar-initials notranslate">
                  {userName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {!collapsed && (
              <div className="sidebar-user-info notranslate">
                <strong>{userName}</strong>
                <small>{userRole}</small>
              </div>
            )}
            {!collapsed && (
              <RiLogoutBoxRLine size={16} className="sidebar-logout-icon" />
            )}
          </button>
        </div>
      </aside>

      {/* Reopen button when collapsed on desktop */}
      {collapsed && (
        <button className="sidebar-reopen-btn" onClick={toggleCollapse} title="Open sidebar">
          <RiMenuLine size={18} />
        </button>
      )}
    </>
  );
}
