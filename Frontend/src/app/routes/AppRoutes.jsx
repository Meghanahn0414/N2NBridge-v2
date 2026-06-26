import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import NotificationProvider from "../providers/NotificationProvider";
import Sidebar from "../../Sidebar";
import Header from "../../Header";
import OtpVerify from "../../features/auth/OtpVerify";
import AdminSignup from "../../features/auth/AdminSignup";
import CitizenLogin from "../../features/auth/Login";
import SurveyManagement from "../../pages/admin/modules/SurveyManagement";
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
import MLASettings from "../../features/mla-dashboard/pages/MLASettings";
import ConstituentsDashboard from "../../features/mla-dashboard/pages/ConstituentsDashboard";
import MLACitizenList from "../../features/mla-dashboard/pages/MLACitizenList";
import ReportsDashboard from "../../features/mla-dashboard/pages/ReportsDashboard";
import CareerOutlook from "../../features/mla-dashboard/pages/CareerOutlook";
import Messages from "../../features/mla-dashboard/pages/Messages";
import FieldOfficerGrievances from "../../features/field-officer/pages/FieldOfficerGrievances";
import FieldOfficerAlerts from "../../features/field-officer/pages/FieldOfficerAlerts";
import FieldOfficerProfile from "../../features/field-officer/pages/FieldOfficerProfile";
import FieldOfficerEvents from "../../features/field-officer/pages/FieldOfficerEvents";
import MLALayout from "../../features/mla-dashboard/layouts/MLALayout";
import AdminLayout from "../layouts/AdminLayout";
import FieldLayout from "../layouts/FieldLayout";
import ManagerLayout from "../layouts/ManagerLayout";

function AppRoutesContent() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const loginPaths = ["/", ROUTES.login, ROUTES.adminSignup, ROUTES.otp, "/otp", "/admin-login", "/rep-login", "/manager-login", "/field-login", "/citizen-login"];
  const isLanding = loginPaths.includes(location.pathname);
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isRepDashboard = location.pathname === ROUTES.rep || location.pathname === ROUTES.mlaExecutiveDashboard;
  const isRepSubRoute = location.pathname.startsWith("/rep/");
  const isRepRoute = isRepDashboard || isRepSubRoute;
  const isFieldRoute = location.pathname.startsWith("/field");
  const isManagerRoute = location.pathname === ROUTES.manager;
  const hideHeader = true;
  const hideSidebar = isLanding || isRepRoute || isAdminRoute || isFieldRoute || isManagerRoute;

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
        className={`${isLanding ? 'app-main--landing' : isRepRoute || isFieldRoute || isManagerRoute || isAdminRoute ? 'app-main--rep' : 'app-main'}`}
      >
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path={ROUTES.login} element={<PublicRoute><CitizenLogin /></PublicRoute>} />
          <Route path="/admin-login" element={<PublicRoute><CitizenLogin /></PublicRoute>} />
          <Route path="/rep-login" element={<PublicRoute><CitizenLogin /></PublicRoute>} />
          <Route path="/manager-login" element={<PublicRoute><CitizenLogin /></PublicRoute>} />
          <Route path="/field-login" element={<PublicRoute><CitizenLogin /></PublicRoute>} />
          <Route path="/citizen-login" element={<PublicRoute><CitizenLogin /></PublicRoute>} />
          <Route path={ROUTES.citizenLogin} element={<PublicRoute><CitizenLogin /></PublicRoute>} />
          <Route path={ROUTES.otp} element={<PublicRoute><OtpVerify /></PublicRoute>} />
          <Route path={ROUTES.adminSignup} element={<PublicRoute><AdminSignup /></PublicRoute>} />

          {/* Field Officer Routes — new unified layout */}
          <Route element={<RoleRoute allowedRoles={["FIELD_OFFICER"]}><FieldLayout /></RoleRoute>}>
            <Route path={ROUTES.field}           element={<FieldDashboard />} />
            <Route path={ROUTES.fieldGrievances} element={<FieldOfficerGrievances />} />
            <Route path={ROUTES.fieldAlerts}     element={<FieldOfficerAlerts />} />
            <Route path={ROUTES.fieldProfile}    element={<FieldOfficerProfile />} />
            <Route path={ROUTES.fieldEvents}     element={<FieldOfficerEvents />} />
          </Route>

          {/* Manager Routes — new unified layout */}
          <Route element={<RoleRoute allowedRoles={["CONSTITUENCY_MANAGER", "MANAGER"]}><ManagerLayout /></RoleRoute>}>
            <Route path={ROUTES.manager} element={<ManagerDashboard />} />
          </Route>

          <Route path={ROUTES.rep} element={<RoleRoute allowedRoles={["REPRESENTATIVE"]}><Navigate to={ROUTES.mlaExecutiveDashboard} replace /></RoleRoute>} />

          {/* Admin Routes — new unified layout */}
          <Route element={<RoleRoute allowedRoles={["ADMIN", "REPRESENTATIVE", "CONSTITUENCY_MANAGER", "MANAGER"]}><AdminLayout /></RoleRoute>}>
            <Route path={ROUTES.admin}                  element={<AdminDashboard />} />
            <Route path={ROUTES.adminUsers}             element={<CitizenListPage />} />
            <Route path={ROUTES.events}                 element={<EventListPage />} />
            <Route path={ROUTES.alerts}                 element={<AlertsPage />} />
            <Route path={ROUTES.register}               element={<RegistrationPage />} />
            <Route path={ROUTES.mlaList}                element={<MLAListPage />} />
            <Route path={ROUTES.managerList}            element={<ManagerListPage />} />
            <Route path={ROUTES.fieldOfficerList}       element={<FieldOfficerListPage />} />
            <Route path={ROUTES.adminsList}             element={<AdminsListPage />} />
            <Route path={ROUTES.userManagement}         element={<UserManagement />} />
            <Route path={ROUTES.rolePermissions}        element={<RolePermissions />} />
            <Route path={ROUTES.constituencyManagement} element={<ConstituencyManagement />} />
            <Route path={ROUTES.complaintManagement}    element={<ComplaintManagement />} />
            <Route path={ROUTES.alertManagement}        element={<AlertManagement />} />
            <Route path={ROUTES.eventManagement}        element={<EventManagement />} />
            <Route path={ROUTES.communicationHub}       element={<CommunicationHub />} />
            <Route path={ROUTES.campaignManagement}     element={<CampaignManagement />} />
            <Route path={ROUTES.teamManagement}         element={<TeamManagement />} />
            <Route path={ROUTES.analyticsReports}       element={<AnalyticsReports />} />
            <Route path={ROUTES.surveyManagement}       element={<SurveyManagement />} />
            <Route path={ROUTES.aiServices}             element={<AIServices />} />
            <Route path={ROUTES.integrations}           element={<Integrations />} />
            <Route path={ROUTES.systemConfiguration}    element={<SystemConfiguration />} />
            <Route path={ROUTES.auditLogs}              element={<AuditLogs />} />
            <Route path={ROUTES.securityCenter}         element={<SecurityCenter />} />
            <Route path={ROUTES.adminSettings}          element={<AdminSettings />} />
          </Route>
          
          {/* MLA/Representative Dashboard Routes — all kept, sidebar only shows Civica 4 */}
          <Route element={<RoleRoute allowedRoles={["REPRESENTATIVE"]}><MLALayout /></RoleRoute>}>
            <Route path={ROUTES.mlaExecutiveDashboard}  element={<ExecutiveDashboard />} />
            <Route path={ROUTES.mlaCitizenSentiment}    element={<CitizenSentimentDashboard />} />
            <Route path={ROUTES.mlaCommunications}      element={<CommunicationCenter />} />
            <Route path={ROUTES.mlaSettings}            element={<MLASettings />} />
            <Route path={ROUTES.mlaConstituencyStatus}  element={<LiveConstituencyStatus />} />
            <Route path={ROUTES.mlaHeatMap}             element={<GeographicHeatMap />} />
            <Route path={ROUTES.mlaComplaintsDashboard} element={<ComplaintsDashboard />} />
            <Route path={ROUTES.mlaEmergencyCenter}     element={<EmergencyCommandCenter />} />
            <Route path={ROUTES.mlaEvents}              element={<EventsPublicPrograms />} />
            <Route path={ROUTES.mlaTeamPerformance}     element={<TeamPerformanceDashboard />} />
            <Route path={ROUTES.mlaGovernmentSchemes}   element={<GovernmentSchemeDashboard />} />
            <Route path={ROUTES.mlaAIInsights}          element={<AIInsights />} />
            <Route path={ROUTES.mlaDailyBriefing}       element={<DailyBriefing />} />
            <Route path={ROUTES.mlaConstituents}        element={<ConstituentsDashboard />} />
            <Route path={ROUTES.mlaCitizenList}         element={<MLACitizenList />} />
            <Route path={ROUTES.mlaReports}            element={<ReportsDashboard />} />
            <Route path={ROUTES.mlaCareerOutlook}      element={<CareerOutlook />} />
            <Route path={ROUTES.mlaMessages}           element={<Messages />} />
          </Route>
          
          <Route path="*" element={<Navigate to={ROUTES.login} replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <NotificationProvider>
        <AppRoutesContent />
      </NotificationProvider>
    </BrowserRouter>
  );
}
