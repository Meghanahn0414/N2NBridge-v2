import api from "./api";

const ROLE_ENDPOINT = {
  CITIZEN: "/api/dashboard/citizen",
  FIELD_OFFICER: "/api/dashboard/officer",
  ADMIN: "/api/dashboard/admin",
  REPRESENTATIVE: "/api/dashboard/mla",
  CONSTITUENCY_MANAGER: "/api/dashboard/mla",
  MLA: "/api/dashboard/mla",
};

export async function getDashboardForRole(role = "ADMIN") {
  const endpoint = ROLE_ENDPOINT[role] || ROLE_ENDPOINT.ADMIN;
  const response = await api.get(endpoint);
  return response.data?.data ?? response.data;
}

export async function getMlaDashboard() {
  const response = await api.get(ROLE_ENDPOINT.MLA);
  return response.data?.data ?? response.data;
}
