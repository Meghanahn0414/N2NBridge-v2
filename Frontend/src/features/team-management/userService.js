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
    return Array.isArray(response.data) ? response.data : response.data?.data || [];
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
