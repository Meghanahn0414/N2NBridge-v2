import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Sidebar from "../../Sidebar";
import Header from "../../Header";
import MobileLayout from "../layouts/MobileLayout";
import OtpVerify from "../../features/auth/OtpVerify";
import AdminSignup from "../../features/auth/AdminSignup";
import AdminLogin from "../../features/auth/AdminLogin";
import CitizenSplash from "../../features/auth/CitizenSplash";
import CitizenLogin from "../../features/auth/CitizenLogin";
import ProfileCreation from "../../pages/citizen/ProfileCreation";
import CitizenDashboardNew from "../../pages/citizen/CitizenDashboardNew";
import CitizenDashboard from "../../features/dashboard/pages/CitizenDashboard";
import CreateComplaint from "../../pages/citizen/CreateComplaint";
import MyComplaints from "../../pages/citizen/MyComplaints";
import ComplaintDetail from "../../pages/citizen/ComplaintDetail";
import CitizenEmergency from "../../pages/citizen/CitizenEmergency";
import EmergencySOS from "../../pages/citizen/EmergencySOS";
import CitizenEvents from "../../pages/citizen/CitizenEvents";
import CitizenCampaigns from "../../pages/citizen/CitizenCampaigns";
import CitizenNotifications from "../../pages/citizen/CitizenNotifications";
import CitizenFeedback from "../../pages/citizen/CitizenFeedback";
import CitizenProfile from "../../pages/citizen/CitizenProfile";
import FieldDashboard from "../../features/dashboard/pages/FieldDashboard";
import ManagerDashboard from "../../features/dashboard/pages/ManagerDashboard";
import RepresentativeDashboard from "../../features/dashboard/pages/RepresentativeDashboard";
import AdminDashboard from "../../features/dashboard/pages/AdminDashboard";
import PublicRoute from "./PublicRoute";
import RoleRoute from "./RoleRoute";
import { ROUTES } from "./RouteConstants";
import LandingPage from "../../landing/LandingPage";
// Admin page imports
import CitizenListPage from "../../pages/admin/CitizenList";
import EventListPage from "../../features/events/pages/EventList";
import AlertsPage from "../../pages/admin/Alerts";
import RegistrationPage from "../../pages/admin/RegistrationPage";
import MLAListPage from "../../pages/admin/MLAList";
import ManagerListPage from "../../pages/admin/ManagerList";
import FieldOfficerListPage from "../../pages/admin/FieldOfficerList";
import AdminsListPage from "../../pages/admin/AdminsList";
// Module imports
import UserManagement from "../../pages/admin/modules/UserManagement";
import RolePermissions from "../../pages/admin/modules/RolePermissions";
import ConstituencyManagement from "../../pages/admin/modules/ConstituencyManagement";
import ComplaintManagement from "../../pages/admin/modules/ComplaintManagement";
import AlertManagement from "../../pages/admin/modules/AlertManagement";
import EventManagement from "../../pages/admin/modules/EventManagement";
import CommunicationHub from "../../pages/admin/modules/CommunicationHub";
import CampaignManagement from "../../pages/admin/modules/CampaignManagement";
import TeamManagement from "../../pages/admin/modules/TeamManagement";
import AnalyticsReports from "../../pages/admin/modules/AnalyticsReports";
import AIServices from "../../pages/admin/modules/AIServices";
import Integrations from "../../pages/admin/modules/Integrations";
import SystemConfiguration from "../../pages/admin/modules/SystemConfiguration";
import AuditLogs from "../../pages/admin/modules/AuditLogs";
import SecurityCenter from "../../pages/admin/modules/SecurityCenter";
import AdminSettings from "../../pages/admin/modules/AdminSettings";
// MLA/Representative Dashboard imports
import ExecutiveDashboard from "../../features/mla-dashboard/pages/ExecutiveDashboard";
import LiveConstituencyStatus from "../../features/mla-dashboard/pages/LiveConstituencyStatus";
import GeographicHeatMap from "../../features/mla-dashboard/pages/GeographicHeatMap";
import ComplaintsDashboard from "../../features/mla-dashboard/pages/ComplaintsDashboard";
import EmergencyCommandCenter from "../../features/mla-dashboard/pages/EmergencyCommandCenter";
import EventsPublicPrograms from "../../features/mla-dashboard/pages/EventsPublicPrograms";
import CommunicationCenter from "../../features/mla-dashboard/pages/CommunicationCenter";
import TeamPerformanceDashboard from "../../features/mla-dashboard/pages/TeamPerformanceDashboard";
import CitizenSentimentDashboard from "../../features/mla-dashboard/pages/CitizenSentimentDashboard";
import GovernmentSchemeDashboard from "../../features/mla-dashboard/pages/GovernmentSchemeDashboard";
import AIInsights from "../../features/mla-dashboard/pages/AIInsights";
import DailyBriefing from "../../features/mla-dashboard/pages/DailyBriefing";
import FieldOfficerGrievances from "../../features/field-officer/pages/FieldOfficerGrievances";
import FieldOfficerAlerts from "../../features/field-officer/pages/FieldOfficerAlerts";
import FieldOfficerProfile from "../../features/field-officer/pages/FieldOfficerProfile";
import FieldOfficerEvents from "../../features/field-officer/pages/FieldOfficerEvents";

function AppRoutesContent() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isLanding = ["/", ROUTES.login, ROUTES.adminSignup, ROUTES.otp, "/citizen-splash", "/citizen-login", "/admin-login", "/otp", "/profile-creation"].includes(location.pathname);
  const isCitizenRoute = location.pathname.startsWith("/citizen");
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isRepDashboard = location.pathname === ROUTES.rep || location.pathname === ROUTES.mlaExecutiveDashboard;
  const isRepSubRoute = location.pathname.startsWith("/rep/");
  const isFieldRoute = location.pathname.startsWith("/field");
  const isManagerRoute = location.pathname === ROUTES.manager;
  const hideHeader = true;
  const hideSidebar = isLanding || isCitizenRoute || isRepDashboard;

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  // Track mobile viewport
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Listen for hamburger clicks from admin mobile dashboard
  useEffect(() => {
    const handler = () => setMobileMenuOpen(o => !o);
    window.addEventListener('admin-mobile-menu-click', handler);
    return () => window.removeEventListener('admin-mobile-menu-click', handler);
  }, []);

  return (
    <div className="App">
      {/* Header - hide on landing, login, citizen, admin, rep, field, manager routes */}
      {!hideHeader && <Header onMobileMenuClick={() => setMobileMenuOpen(o => !o)} />}

      {/* Sidebar - hide on landing, login, citizen, rep, field, manager routes */}
      {!hideSidebar && (
        <Sidebar
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
          onToggle={(isOpen) => setSidebarOpen(isOpen)}
        />
      )}

      <main
        className={`${isLanding ? 'app-main--landing' : isFieldRoute || isManagerRoute || isRepSubRoute || isAdminRoute ? 'app-main--no-header' : (isCitizenRoute || isRepDashboard) ? 'app-main--citizen' : 'app-main'}`}
        style={
          (isFieldRoute || isManagerRoute || isRepSubRoute || isAdminRoute) && !hideSidebar
            ? { marginLeft: sidebarOpen ? '220px' : '60px', transition: 'margin-left 0.25s ease', width: 'auto', minHeight: '100vh' }
            : undefined
        }
      >
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path={ROUTES.login} element={<PublicRoute><Navigate to="/citizen-splash" replace /></PublicRoute>} />
          <Route path="/citizen-splash" element={<PublicRoute><MobileLayout><CitizenSplash /></MobileLayout></PublicRoute>} />
          <Route path="/citizen-login" element={<PublicRoute><MobileLayout><CitizenLogin /></MobileLayout></PublicRoute>} />
          <Route path="/admin-login" element={<PublicRoute><AdminLogin /></PublicRoute>} />
          <Route path={ROUTES.otp} element={<PublicRoute><OtpVerify /></PublicRoute>} />
          <Route path={ROUTES.adminSignup} element={<PublicRoute><AdminSignup /></PublicRoute>} />
          <Route path="/profile-creation" element={<RoleRoute allowedRoles={["CITIZEN"]}><ProfileCreation /></RoleRoute>} />
          
          {/* Citizen Routes */}
          <Route path={ROUTES.citizen} element={<RoleRoute allowedRoles={["CITIZEN"]}><MobileLayout><CitizenDashboardNew /></MobileLayout></RoleRoute>} />
          <Route path={ROUTES.citizenCreateComplaint} element={<RoleRoute allowedRoles={["CITIZEN"]}><MobileLayout><CreateComplaint /></MobileLayout></RoleRoute>} />
          <Route path={ROUTES.citizenComplaintList} element={<RoleRoute allowedRoles={["CITIZEN"]}><MobileLayout><MyComplaints /></MobileLayout></RoleRoute>} />
          <Route path={ROUTES.citizenComplaintDetails} element={<RoleRoute allowedRoles={["CITIZEN"]}><MobileLayout><ComplaintDetail /></MobileLayout></RoleRoute>} />
          <Route path={ROUTES.citizenEmergency} element={<RoleRoute allowedRoles={["CITIZEN"]}><MobileLayout><CitizenEmergency /></MobileLayout></RoleRoute>} />
          <Route path={ROUTES.citizenSOS} element={<RoleRoute allowedRoles={["CITIZEN"]}><MobileLayout><EmergencySOS /></MobileLayout></RoleRoute>} />
          <Route path={ROUTES.citizenEvents} element={<RoleRoute allowedRoles={["CITIZEN"]}><MobileLayout><CitizenEvents /></MobileLayout></RoleRoute>} />
          <Route path={ROUTES.citizenCampaigns} element={<RoleRoute allowedRoles={["CITIZEN"]}><MobileLayout><CitizenCampaigns /></MobileLayout></RoleRoute>} />
          <Route path={ROUTES.citizenNotifications} element={<RoleRoute allowedRoles={["CITIZEN"]}><MobileLayout><CitizenNotifications /></MobileLayout></RoleRoute>} />
          <Route path={ROUTES.citizenFeedback} element={<RoleRoute allowedRoles={["CITIZEN"]}><MobileLayout><CitizenFeedback /></MobileLayout></RoleRoute>} />
          <Route path={ROUTES.citizenProfile} element={<RoleRoute allowedRoles={["CITIZEN"]}><MobileLayout><CitizenProfile /></MobileLayout></RoleRoute>} />
          
          {/* Dashboard Routes */}
          <Route path={ROUTES.field} element={<RoleRoute allowedRoles={["FIELD_OFFICER"]}><FieldDashboard /></RoleRoute>} />
          <Route path={ROUTES.fieldGrievances} element={<RoleRoute allowedRoles={["FIELD_OFFICER"]}><FieldOfficerGrievances /></RoleRoute>} />
          <Route path={ROUTES.fieldAlerts} element={<RoleRoute allowedRoles={["FIELD_OFFICER"]}><FieldOfficerAlerts /></RoleRoute>} />
          <Route path={ROUTES.fieldProfile} element={<RoleRoute allowedRoles={["FIELD_OFFICER"]}><FieldOfficerProfile /></RoleRoute>} />
          <Route path={ROUTES.fieldEvents} element={<RoleRoute allowedRoles={["FIELD_OFFICER"]}><FieldOfficerEvents /></RoleRoute>} />
          <Route path={ROUTES.manager} element={<RoleRoute allowedRoles={["CONSTITUENCY_MANAGER", "MANAGER"]}><ManagerDashboard /></RoleRoute>} />
          <Route path={ROUTES.rep} element={<RoleRoute allowedRoles={["REPRESENTATIVE"]}><ExecutiveDashboard /></RoleRoute>} />
          <Route path={ROUTES.admin} element={<RoleRoute allowedRoles={["ADMIN"]}><AdminDashboard /></RoleRoute>} />
          
          {/* Admin Pages Routes */}
          <Route path={ROUTES.adminUsers} element={<RoleRoute allowedRoles={["ADMIN", "REPRESENTATIVE"]}><CitizenListPage /></RoleRoute>} />
          <Route path={ROUTES.events} element={<RoleRoute allowedRoles={["ADMIN", "REPRESENTATIVE"]}><EventListPage /></RoleRoute>} />
          <Route path={ROUTES.alerts} element={<RoleRoute allowedRoles={["ADMIN", "REPRESENTATIVE"]}><AlertsPage /></RoleRoute>} />
          <Route path={ROUTES.register} element={<RoleRoute allowedRoles={["ADMIN"]}><RegistrationPage /></RoleRoute>} />
          <Route path={ROUTES.mlaList} element={<RoleRoute allowedRoles={["ADMIN"]}><MLAListPage /></RoleRoute>} />
          <Route path={ROUTES.managerList} element={<RoleRoute allowedRoles={["ADMIN", "REPRESENTATIVE"]}><ManagerListPage /></RoleRoute>} />
          <Route path={ROUTES.fieldOfficerList} element={<RoleRoute allowedRoles={["ADMIN", "REPRESENTATIVE", "CONSTITUENCY_MANAGER"]}><FieldOfficerListPage /></RoleRoute>} />
          <Route path={ROUTES.adminsList} element={<RoleRoute allowedRoles={["REPRESENTATIVE"]}><AdminsListPage /></RoleRoute>} />
          
          {/* Admin Module Routes (SRS Implementation) */}
          <Route path={ROUTES.userManagement} element={<RoleRoute allowedRoles={["ADMIN"]}><UserManagement /></RoleRoute>} />
          <Route path={ROUTES.rolePermissions} element={<RoleRoute allowedRoles={["ADMIN"]}><RolePermissions /></RoleRoute>} />
          <Route path={ROUTES.constituencyManagement} element={<RoleRoute allowedRoles={["ADMIN"]}><ConstituencyManagement /></RoleRoute>} />
          <Route path={ROUTES.complaintManagement} element={<RoleRoute allowedRoles={["ADMIN", "REPRESENTATIVE"]}><ComplaintManagement /></RoleRoute>} />
          <Route path={ROUTES.alertManagement} element={<RoleRoute allowedRoles={["ADMIN", "REPRESENTATIVE"]}><AlertManagement /></RoleRoute>} />
          <Route path={ROUTES.eventManagement} element={<RoleRoute allowedRoles={["ADMIN", "REPRESENTATIVE"]}><EventManagement /></RoleRoute>} />
          <Route path={ROUTES.communicationHub} element={<RoleRoute allowedRoles={["ADMIN", "REPRESENTATIVE"]}><CommunicationHub /></RoleRoute>} />
          <Route path={ROUTES.campaignManagement} element={<RoleRoute allowedRoles={["ADMIN", "REPRESENTATIVE"]}><CampaignManagement /></RoleRoute>} />
          <Route path={ROUTES.teamManagement} element={<RoleRoute allowedRoles={["ADMIN", "CONSTITUENCY_MANAGER", "MANAGER"]}><TeamManagement /></RoleRoute>} />
          <Route path={ROUTES.analyticsReports} element={<RoleRoute allowedRoles={["ADMIN", "REPRESENTATIVE"]}><AnalyticsReports /></RoleRoute>} />
          <Route path={ROUTES.aiServices} element={<RoleRoute allowedRoles={["ADMIN"]}><AIServices /></RoleRoute>} />
          <Route path={ROUTES.integrations} element={<RoleRoute allowedRoles={["ADMIN"]}><Integrations /></RoleRoute>} />
          <Route path={ROUTES.systemConfiguration} element={<RoleRoute allowedRoles={["ADMIN"]}><SystemConfiguration /></RoleRoute>} />
          <Route path={ROUTES.auditLogs} element={<RoleRoute allowedRoles={["ADMIN"]}><AuditLogs /></RoleRoute>} />
          <Route path={ROUTES.securityCenter} element={<RoleRoute allowedRoles={["ADMIN"]}><SecurityCenter /></RoleRoute>} />
          <Route path={ROUTES.adminSettings} element={<RoleRoute allowedRoles={["ADMIN"]}><AdminSettings /></RoleRoute>} />
          
          {/* MLA/Representative Dashboard Routes */}
          <Route path={ROUTES.mlaExecutiveDashboard} element={<RoleRoute allowedRoles={["REPRESENTATIVE"]}><ExecutiveDashboard /></RoleRoute>} />
          <Route path={ROUTES.mlaConstituencyStatus} element={<RoleRoute allowedRoles={["REPRESENTATIVE"]}><LiveConstituencyStatus /></RoleRoute>} />
          <Route path={ROUTES.mlaHeatMap} element={<RoleRoute allowedRoles={["REPRESENTATIVE"]}><GeographicHeatMap /></RoleRoute>} />
          <Route path={ROUTES.mlaComplaintsDashboard} element={<RoleRoute allowedRoles={["REPRESENTATIVE"]}><ComplaintsDashboard /></RoleRoute>} />
          <Route path={ROUTES.mlaEmergencyCenter} element={<RoleRoute allowedRoles={["REPRESENTATIVE"]}><EmergencyCommandCenter /></RoleRoute>} />
          <Route path={ROUTES.mlaEvents} element={<RoleRoute allowedRoles={["REPRESENTATIVE"]}><EventsPublicPrograms /></RoleRoute>} />
          <Route path={ROUTES.mlaCommunications} element={<RoleRoute allowedRoles={["REPRESENTATIVE"]}><CommunicationCenter /></RoleRoute>} />
          <Route path={ROUTES.mlaTeamPerformance} element={<RoleRoute allowedRoles={["REPRESENTATIVE"]}><TeamPerformanceDashboard /></RoleRoute>} />
          <Route path={ROUTES.mlaCitizenSentiment} element={<RoleRoute allowedRoles={["REPRESENTATIVE"]}><CitizenSentimentDashboard /></RoleRoute>} />
          <Route path={ROUTES.mlaGovernmentSchemes} element={<RoleRoute allowedRoles={["REPRESENTATIVE"]}><GovernmentSchemeDashboard /></RoleRoute>} />
          <Route path={ROUTES.mlaAIInsights} element={<RoleRoute allowedRoles={["REPRESENTATIVE"]}><AIInsights /></RoleRoute>} />
          <Route path={ROUTES.mlaDailyBriefing} element={<RoleRoute allowedRoles={["REPRESENTATIVE"]}><DailyBriefing /></RoleRoute>} />
          
          <Route path="*" element={<Navigate to={ROUTES.login} replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppRoutesContent />
    </BrowserRouter>
  );
}
