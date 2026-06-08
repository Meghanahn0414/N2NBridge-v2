import api from "./api";

const ROLE_ENDPOINT = {
  CITIZEN: "/api/dashboard/citizen",
  FIELD_OFFICER: "/api/dashboard/officer",
  ADMIN: "/api/dashboard/admin",
  REPRESENTATIVE: "/api/dashboard/admin",
  CONSTITUENCY_MANAGER: "/api/dashboard/admin",
};

export async function getDashboardForRole(role = "ADMIN") {
  const endpoint = ROLE_ENDPOINT[role] || ROLE_ENDPOINT.ADMIN;
  const response = await api.get(endpoint);
  return response.data?.data ?? response.data;
}
