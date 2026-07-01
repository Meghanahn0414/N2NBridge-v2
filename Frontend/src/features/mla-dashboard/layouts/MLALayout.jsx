import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import MLASidebar from "../components/MLASidebar";
import { getMlaDashboard } from "../../../shared/services/dashboardService";
import { getAuthUser } from "../../../services/authStorage";
import "../styles/mla-layout.css";

// How long a cached sidebar badge count is considered "fresh enough" to skip
// re-fetching. This endpoint (/api/dashboard/mla) is the same expensive,
// Redis-backed analytics call the main dashboard page already fires on mount —
// firing it a second time here (just for one badge number) competes with the
// page's own critical-path requests for connections/backend capacity and was
// making first load noticeably slower. A 2-minute cache removes that
// duplicate call on most loads while still keeping the badge reasonably fresh.
const BADGE_CACHE_TTL_MS = 2 * 60 * 1000;

export default function MLALayout() {
  const user = getAuthUser();
  const [openComplaints, setOpenComplaints] = useState(() => {
    // Seed from cache immediately so badge shows on first render
    try { return Number(sessionStorage.getItem("mla_open_complaints") || 0); } catch (_) { return 0; }
  });

  useEffect(() => {
    let mounted = true;

    const applyResult = (data) => {
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
      try {
        sessionStorage.setItem("mla_open_complaints", String(open));
        sessionStorage.setItem("mla_open_complaints_ts", String(Date.now()));
      } catch (_) {}
    };

    let cachedAt = 0;
    try { cachedAt = Number(sessionStorage.getItem("mla_open_complaints_ts") || 0); } catch (_) {}
    const cacheIsFresh = cachedAt && (Date.now() - cachedAt) < BADGE_CACHE_TTL_MS;

    if (cacheIsFresh) {
      // Skip the duplicate network call entirely — the seeded state above
      // already reflects this cached value.
      return () => { mounted = false; };
    }

    getMlaDashboard()
      .then(applyResult)
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
