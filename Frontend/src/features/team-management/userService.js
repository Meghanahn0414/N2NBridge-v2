import api from "../../shared/services/api";

const USER_ENDPOINT = "/api/users";

const extractError = (error) => {
  const detail = error?.response?.data?.detail || error?.response?.data?.message;
  return new Error(detail || error?.message || "Request failed");
};

export async function fetchUsers(page = 1, perPage = 100, role = null) {
  try {
    const params = { page, per_page: perPage };
    if (role && role !== "ALL") {
      params.role = role;
    }
    const response = await api.get(USER_ENDPOINT, { params });
    // GET /api/users/ wraps its payload in the standard envelope. For an
    // ADMIN caller the backend now returns a paginated shape
    // { items, total, page, per_page } inside data (cross-tenant view over
    // citizens/representatives/master users) instead of a flat list — for
    // REPRESENTATIVE/STAFF callers it's the same paginated shape too. Unwrap
    // .items first; only fall back to treating .data itself as the array
    // for any older/flat response shape.
    const payload = response.data?.data;
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.items)) return payload.items;
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    throw extractError(error);
  }
}

export async function createUser(userData) {
  try {
    const response = await api.post(USER_ENDPOINT, userData);
    return response.data;
  } catch (error) {
    throw extractError(error);
  }
}

export async function updateUser(userId, userData) {
  try {
    const response = await api.put(`${USER_ENDPOINT}/${userId}`, userData);
    return response.data;
  } catch (error) {
    throw extractError(error);
  }
}

export async function deleteUser(userId) {
  try {
    const response = await api.delete(`${USER_ENDPOINT}/${userId}`);
    return response.data;
  } catch (error) {
    throw extractError(error);
  }
}

export async function blockUser(userId) {
  try {
    const response = await api.patch(`${USER_ENDPOINT}/${userId}/block`, {});
    return response.data;
  } catch (error) {
    throw extractError(error);
  }
}

export async function resetUserPassword(userId) {
  try {
    const response = await api.post(`${USER_ENDPOINT}/${userId}/reset-password`, {});
    return response.data;
  } catch (error) {
    throw extractError(error);
  }
}
