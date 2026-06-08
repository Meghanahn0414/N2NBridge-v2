import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Sidebar from "../../Sidebar";
import Header from "../../Header";
import LandingPage from "../../landing/LandingPage";
import AdminLogin from "../../features/auth/AdminLogin";
import CitizenLogin from "../../features/auth/CitizenLogin";
import OtpVerify from "../../features/auth/OtpVerify";
import AdminSignup from "../../features/auth/AdminSignup";
import CitizenDashboard from "../../features/dashboard/pages/CitizenDashboard";
import CreateComplaint from "../../pages/citizen/CreateComplaint";
import ComplaintList from "../../pages/citizen/ComplaintList";
import ComplaintDetails from "../../pages/citizen/ComplaintDetails";
import FieldDashboard from "../../features/dashboard/pages/FieldDashboard";
import ManagerDashboard from "../../features/dashboard/pages/ManagerDashboard";
import RepresentativeDashboard from "../../pages/rep/RepresentativeDashboard";
import AdminDashboard from "../../features/dashboard/pages/AdminDashboard";
import NewMLA from "../../pages/admin/NewMLA";
import NewManager from "../../pages/admin/NewManager";
import NewFieldOfficer from "../../pages/admin/NewFieldOfficer";
import RegistrationPage from "../../pages/admin/RegistrationPage";
import MLAList from "../../pages/admin/MLAList";
import CitizenList from "../../pages/admin/CitizenList";
import Reports from "../../pages/admin/Reports";
import Settings from "../../pages/admin/Settings";
import PublicRoute from "./PublicRoute";
import RoleRoute from "./RoleRoute";
import { ROUTES } from "./RouteConstants";

function AppRoutesContent() {
  const location = useLocation();
  const publicRoutes = ["/", "/login", "/citizen-login", "/signup", "/otp"];
  const showSidebar = !publicRoutes.includes(location.pathname);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  React.useEffect(() => {
    if (!showSidebar) {
      document.body.classList.remove('sidebar-collapsed');
      return;
    }
    document.body.classList.toggle('sidebar-collapsed', !sidebarOpen);
  }, [sidebarOpen, showSidebar]);

  return (
    <>
      {showSidebar && <Header />}
      {showSidebar && <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />}
      <div className="app-main">
        <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path={ROUTES.login} element={<PublicRoute><AdminLogin /></PublicRoute>} />
        <Route path={ROUTES.citizenLogin} element={<PublicRoute><CitizenLogin /></PublicRoute>} />
        <Route path={ROUTES.signup} element={<PublicRoute><AdminSignup /></PublicRoute>} />
        <Route path={ROUTES.otp} element={<PublicRoute><OtpVerify /></PublicRoute>} />
        <Route path={ROUTES.citizen} element={<RoleRoute allowedRoles={["CITIZEN"]}><CitizenDashboard /></RoleRoute>} />
        <Route path={ROUTES.citizenCreateComplaint} element={<RoleRoute allowedRoles={["CITIZEN"]}><CreateComplaint /></RoleRoute>} />
        <Route path={ROUTES.citizenComplaintList} element={<RoleRoute allowedRoles={["CITIZEN"]}><ComplaintList /></RoleRoute>} />
        <Route path={ROUTES.citizenComplaintDetails} element={<RoleRoute allowedRoles={["CITIZEN"]}><ComplaintDetails /></RoleRoute>} />
        <Route path={ROUTES.field} element={<RoleRoute allowedRoles={["FIELD_OFFICER"]}><FieldDashboard /></RoleRoute>} />
        <Route path={ROUTES.manager} element={<RoleRoute allowedRoles={["CONSTITUENCY_MANAGER"]}><ManagerDashboard /></RoleRoute>} />
        <Route path={ROUTES.rep} element={<RoleRoute allowedRoles={["REPRESENTATIVE"]}><RepresentativeDashboard /></RoleRoute>} />
        <Route path={ROUTES.admin} element={<RoleRoute allowedRoles={["ADMIN"]}><AdminDashboard /></RoleRoute>} />
        <Route path={ROUTES.mlaList} element={<RoleRoute allowedRoles={["ADMIN"]}><MLAList /></RoleRoute>} />
        <Route path={ROUTES.register} element={<RoleRoute allowedRoles={["ADMIN"]}><RegistrationPage /></RoleRoute>} />
        <Route path={ROUTES.registerMLA} element={<RoleRoute allowedRoles={["ADMIN"]}><NewMLA /></RoleRoute>} />
        <Route path={ROUTES.registerManager} element={<RoleRoute allowedRoles={["ADMIN"]}><NewManager /></RoleRoute>} />
        <Route path={ROUTES.registerFieldOfficer} element={<RoleRoute allowedRoles={["ADMIN"]}><NewFieldOfficer /></RoleRoute>} />
        <Route path={ROUTES.adminUsers} element={<RoleRoute allowedRoles={["ADMIN"]}><CitizenList /></RoleRoute>} />
        <Route path={ROUTES.reports} element={<RoleRoute allowedRoles={["ADMIN"]}><Reports /></RoleRoute>} />
        <Route path={ROUTES.settings} element={<RoleRoute allowedRoles={["ADMIN"]}><Settings /></RoleRoute>} />
        <Route path="*" element={<Navigate to={ROUTES.login} replace />} />
        </Routes>
      </div>
    </>
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <AppRoutesContent />
    </BrowserRouter>
  );
}
