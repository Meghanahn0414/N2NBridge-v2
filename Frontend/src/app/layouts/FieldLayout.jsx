import { Outlet } from "react-router-dom";
import { getAuthUser } from "../../services/authStorage";
import SharedSidebar from "../../components/SharedSidebar";
import { ROUTES } from "../routes/RouteConstants";
import {
  RiDashboardLine,
  RiFileListLine,
  RiAlarmWarningLine,
  RiCalendarLine,
  RiUserLine,
} from "react-icons/ri";
import "../../features/mla-dashboard/styles/mla-layout.css";

const SECTIONS = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", icon: <RiDashboardLine />, to: ROUTES.field },
    ],
  },
  {
    label: "Work",
    items: [
      { label: "Assigned Grievances", icon: <RiFileListLine />,      to: ROUTES.fieldGrievances },
      { label: "Alerts",              icon: <RiAlarmWarningLine />,  to: ROUTES.fieldAlerts },
      { label: "Events",              icon: <RiCalendarLine />,      to: ROUTES.fieldEvents },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "My Profile", icon: <RiUserLine />, to: ROUTES.fieldProfile },
    ],
  },
];

export default function FieldLayout() {
  const user = getAuthUser();
  return (
    <div className="mla-shell">
      <SharedSidebar
        user={user}
        roleSub="FIELD OFFICER"
        roleLabel="Field Officer"
        sections={SECTIONS}
      />
      <div className="mla-main">
        <Outlet />
      </div>
    </div>
  );
}
