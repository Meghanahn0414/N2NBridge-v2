import api from "../../shared/services/api";

const GRIEVANCE_ENDPOINT = "/api/grievances";

export async function fetchGrievances(page = 1, perPage = 1000, filters = {}) {
  try {
    const params = { page, per_page: perPage };
    if (filters.status && filters.status !== "ALL") {
      params.status = filters.status;
    }
    if (filters.priority && filters.priority !== "ALL") {
      params.priority = filters.priority;
    }
    if (filters.assignedOfficerId) {
      params.assigned_officer_id = filters.assignedOfficerId;
    }
    const response = await api.get(`${GRIEVANCE_ENDPOINT}/`, { params });
    return Array.isArray(response.data) ? response.data : response.data?.data || [];
  } catch (error) {
    console.error("Error fetching grievances:", error);
    throw error;
  }
}

export async function fetchGrievanceById(grievanceId) {
  try {
    const response = await api.get(`${GRIEVANCE_ENDPOINT}/${grievanceId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching grievance:", error);
    throw error;
  }
}

export async function createGrievance(grievanceData) {
  try {
    const response = await api.post(GRIEVANCE_ENDPOINT, grievanceData);
    return response.data;
  } catch (error) {
    console.error("Error creating grievance:", error);
    throw error;
  }
}

export async function updateGrievance(grievanceId, updateData) {
  try {
    const response = await api.put(`${GRIEVANCE_ENDPOINT}/${grievanceId}`, updateData);
    return response.data;
  } catch (error) {
    console.error("Error updating grievance:", error);
    throw error;
  }
}

export async function assignGrievance(grievanceId, officerId) {
  try {
    const response = await api.post(
      `${GRIEVANCE_ENDPOINT}/${grievanceId}/assign/${officerId}`,
      {}
    );
    return response.data;
  } catch (error) {
    console.error("Error assigning grievance:", error);
    throw error;
  }
}

export async function addGrievanceFeedback(grievanceId, feedback) {
  try {
    const response = await api.post(
      `${GRIEVANCE_ENDPOINT}/${grievanceId}/feedback`,
      feedback
    );
    return response.data;
  } catch (error) {
    console.error("Error adding feedback:", error);
    throw error;
  }
}

export async function fetchGrievanceCategories() {
  try {
    const response = await api.get(`${GRIEVANCE_ENDPOINT}/categories`);
    return Array.isArray(response.data) ? response.data : response.data?.data || [];
  } catch (error) {
    console.error("Error fetching grievance categories:", error);
    throw error;
  }
}
