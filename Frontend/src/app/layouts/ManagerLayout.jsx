import { Outlet } from "react-router-dom";
import { getAuthUser } from "../../services/authStorage";
import SharedSidebar from "../../components/SharedSidebar";
import { ROUTES } from "../routes/RouteConstants";
import {
  RiDashboardLine,
  RiUserLine,
  RiTeamLine,
} from "react-icons/ri";
import "../../features/mla-dashboard/styles/mla-layout.css";

const SECTIONS = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", icon: <RiDashboardLine />, to: ROUTES.manager },
    ],
  },
  {
    label: "Team",
    items: [
      { label: "Field Officers",  icon: <RiUserLine />, to: ROUTES.fieldOfficerList },
      { label: "Team Management", icon: <RiTeamLine />, to: ROUTES.teamManagement },
    ],
  },
];

export default function ManagerLayout() {
  const user = getAuthUser();
  return (
    <div className="mla-shell">
      <SharedSidebar
        user={user}
        roleSub="MANAGER"
        roleLabel="Manager"
        sections={SECTIONS}
      />
      <div className="mla-main">
        <Outlet />
      </div>
    </div>
  );
}
