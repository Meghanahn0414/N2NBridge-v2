import { useEffect, useState } from "react";
import { getMlaDashboard } from "../services/dashboardService";

export default function useMlaDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        const result = await getMlaDashboard();
        if (!mounted) return;
        setDashboard(result);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.message || err?.message || "Failed to load MLA dashboard data.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  return { dashboard, loading, error };
}
