import api from "../../shared/services/api";

const ALERT_ENDPOINT = "/api/alerts";

export async function fetchAlerts(page = 1, perPage = 1000, filters = {}) {
  try {
    const params = { page, per_page: perPage };
    if (filters.priority && filters.priority !== "ALL") {
      params.priority = filters.priority;
    }
    if (filters.status && filters.status !== "ALL") {
      params.status = filters.status;
    }
    const response = await api.get(ALERT_ENDPOINT, { params });
    return Array.isArray(response.data) ? response.data : response.data?.data || [];
  } catch (error) {
    console.error("Error fetching alerts:", error);
    throw error;
  }
}

export async function fetchAlertById(alertId) {
  try {
    const response = await api.get(`${ALERT_ENDPOINT}/${alertId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching alert:", error);
    throw error;
  }
}

export async function createAlert(alertData) {
  try {
    const response = await api.post(ALERT_ENDPOINT, alertData);
    return response.data;
  } catch (error) {
    console.error("Error creating alert:", error);
    throw error;
  }
}

export async function updateAlert(alertId, alertData) {
  try {
    const response = await api.put(`${ALERT_ENDPOINT}/${alertId}`, alertData);
    return response.data;
  } catch (error) {
    console.error("Error updating alert:", error);
    throw error;
  }
}

export async function deleteAlert(alertId) {
  try {
    const response = await api.delete(`${ALERT_ENDPOINT}/${alertId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting alert:", error);
    throw error;
  }
}

export async function broadcastAlert(alertData) {
  try {
    const response = await api.post(`${ALERT_ENDPOINT}/broadcast`, alertData);
    return response.data;
  } catch (error) {
    console.error("Error broadcasting alert:", error);
    throw error;
  }
}
