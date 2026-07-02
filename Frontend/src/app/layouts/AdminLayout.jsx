import { Outlet } from "react-router-dom";
import { getAuthUser } from "../../services/authStorage";
import SharedSidebar from "../../components/SharedSidebar";
import { ROUTES } from "../routes/RouteConstants";
import {
  RiDashboardLine,
  RiGroupLine,
  RiVipCrownLine,
  RiBriefcaseLine,
  RiUserLine,
  RiFileListLine,
  RiAlarmWarningLine,
  RiCalendarLine,
  RiMessage3Line,
  RiBroadcastLine,
  RiBarChartGroupedLine,
  RiTeamLine,
  RiRobot2Line,
  RiGlobalLine,
  RiLinksLine,
  RiCpuLine,
  RiFileSearchLine,
  RiShieldLine,
  RiUserSettingsLine,
  RiUserAddLine,
  RiKeyLine,
  RiSettings4Line,
  RiSurveyLine,
} from "react-icons/ri";
import "../../features/mla-dashboard/styles/mla-layout.css";

const SECTIONS = [
  {
    label: "OVERVIEW",
    items: [
      { label: "Dashboard", icon: <RiDashboardLine />, to: ROUTES.admin },
    ],
  },
  {
    label: "PEOPLE",
    items: [
      { label: "Citizens",        icon: <RiGroupLine />,      to: ROUTES.adminUsers },
      { label: "Managers",        icon: <RiBriefcaseLine />,  to: ROUTES.managerList },
      { label: "Field Officers",  icon: <RiUserLine />,       to: ROUTES.fieldOfficerList },
    ],
  },
  {
    label: "SERVICES",
    items: [
      { label: "Complaints",        icon: <RiFileListLine />,     to: ROUTES.complaintManagement },
      { label: "Alerts",            icon: <RiAlarmWarningLine />, to: ROUTES.alertManagement },
      { label: "Events",            icon: <RiCalendarLine />,     to: ROUTES.eventManagement },
      { label: "Communication Hub", icon: <RiMessage3Line />,     to: ROUTES.communicationHub },
      { label: "Campaigns",         icon: <RiBroadcastLine />,    to: ROUTES.campaignManagement },
      { label: "Surveys",           icon: <RiSurveyLine />,       to: ROUTES.surveyManagement },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { label: "Analytics",      icon: <RiBarChartGroupedLine />, to: ROUTES.analyticsReports },
      { label: "Team",           icon: <RiTeamLine />,            to: ROUTES.teamManagement },
      { label: "AI Services",    icon: <RiRobot2Line />,          to: ROUTES.aiServices },
      { label: "Constituencies", icon: <RiGlobalLine />,          to: ROUTES.constituencyManagement },
      { label: "Integrations",   icon: <RiLinksLine />,           to: ROUTES.integrations },
      { label: "System Config",  icon: <RiCpuLine />,             to: ROUTES.systemConfiguration },
      { label: "Audit Logs",     icon: <RiFileSearchLine />,      to: ROUTES.auditLogs },
      { label: "Security",       icon: <RiShieldLine />,          to: ROUTES.securityCenter },
    ],
  },
  {
    label: "ACCESS",
    items: [
      { label: "User Management",    icon: <RiUserSettingsLine />, to: ROUTES.userManagement },
      { label: "Registration",       icon: <RiUserAddLine />,      to: ROUTES.register },
      { label: "Role & Permissions", icon: <RiKeyLine />,          to: ROUTES.rolePermissions },
      { label: "Settings",           icon: <RiSettings4Line />,    to: ROUTES.adminSettings },
    ],
  },
];

export default function AdminLayout() {
  const user = getAuthUser();

  // A scoped admin's one-time representative registration happens through
  // the Role dropdown on the Registration page itself (the scope, e.g.
  // "MLA", is offered there as a selectable option until managedDbName is
  // set) — no separate sidebar entry/page needed for it.
  return (
    <div className="mla-shell">
      <SharedSidebar
        user={user}
        roleSub="Admin Portal"
        roleLabel="Admin"
        sections={SECTIONS}
      />
      <div className="mla-main">
        <Outlet />
      </div>
    </div>
  );
}
