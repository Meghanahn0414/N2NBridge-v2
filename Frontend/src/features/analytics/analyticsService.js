import api from "../../shared/services/api";

export async function getGrievanceStats() {
  const res = await api.get("/api/analytics/grievances");
  return res.data?.data ?? res.data ?? {};
}

export async function getAlertStats() {
  const res = await api.get("/api/analytics/alerts");
  return res.data?.data ?? res.data ?? {};
}

export async function getEventStats() {
  const res = await api.get("/api/analytics/events");
  return res.data?.data ?? res.data ?? {};
}

export async function getDashboardMetrics(days = 365) {
  const res = await api.get("/api/analytics/dashboard", { params: { days } });
  return res.data?.data ?? res.data ?? {};
}
