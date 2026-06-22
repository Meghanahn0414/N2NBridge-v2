import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import MLASidebar from "../components/MLASidebar";
import { getMlaDashboard } from "../../../shared/services/dashboardService";
import { getAuthUser } from "../../../services/authStorage";
import "../styles/mla-layout.css";

export default function MLALayout() {
  const user = getAuthUser();
  const [openComplaints, setOpenComplaints] = useState(() => {
    // Seed from cache immediately so badge shows on first render
    try { return Number(sessionStorage.getItem("mla_open_complaints") || 0); } catch (_) { return 0; }
  });

  useEffect(() => {
    let mounted = true;

    getMlaDashboard()
      .then(data => {
        if (!mounted) return;
        // Handle all known API response shapes
        const summary    = data?.summary || {};
        const grievances = data?.metrics?.grievances || {};
        const byStatus   = grievances.byStatus || {};

        const open =
          Number(summary.openComplaints)   ||
          Number(byStatus.OPEN)            ||
          Number(byStatus.NEW)             ||
          Number(byStatus.ASSIGNED)        ||
          (Number(byStatus.NEW || 0) + Number(byStatus.ASSIGNED || 0)) ||
          0;

        setOpenComplaints(open);
        try { sessionStorage.setItem("mla_open_complaints", String(open)); } catch (_) {}
      })
      .catch(() => {
        // Keep whatever was already seeded from cache
      });

    return () => { mounted = false; };
  }, []);

  return (
    <div className="mla-shell">
      <MLASidebar user={user} openComplaints={openComplaints} />
      <div className="mla-main">
        <Outlet />
      </div>
    </div>
  );
}
