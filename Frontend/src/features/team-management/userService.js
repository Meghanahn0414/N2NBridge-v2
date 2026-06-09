import api from "../../shared/services/api";

const USER_ENDPOINT = "/api/users";

export async function fetchUsers(page = 1, perPage = 1000, role = null) {
  try {
    const params = { page, per_page: perPage };
    if (role && role !== "ALL") {
      params.role = role;
    }
    const response = await api.get(USER_ENDPOINT, { params });
    return Array.isArray(response.data) ? response.data : response.data?.data || [];
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}

export async function createUser(userData) {
  try {
    const response = await api.post(USER_ENDPOINT, userData);
    return response.data;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

export async function updateUser(userId, userData) {
  try {
    const response = await api.put(`${USER_ENDPOINT}/${userId}`, userData);
    return response.data;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}

export async function deleteUser(userId) {
  try {
    const response = await api.delete(`${USER_ENDPOINT}/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}

export async function blockUser(userId) {
  try {
    const response = await api.patch(`${USER_ENDPOINT}/${userId}/block`, {});
    return response.data;
  } catch (error) {
    console.error("Error blocking user:", error);
    throw error;
  }
}

export async function resetUserPassword(userId) {
  try {
    const response = await api.post(`${USER_ENDPOINT}/${userId}/reset-password`, {});
    return response.data;
  } catch (error) {
    console.error("Error resetting password:", error);
    throw error;
  }
}
