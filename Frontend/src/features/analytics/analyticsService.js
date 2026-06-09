import api from "../../shared/services/api";

const ANALYTICS_ENDPOINT = "/api/analytics";

export async function getGrievanceStats() {
  try {
    const response = await api.get(`${ANALYTICS_ENDPOINT}/grievances`);
    return response.data || {};
  } catch (error) {
    console.error("Error fetching grievance stats:", error);
    throw error;
  }
}

export async function getAlertStats() {
  try {
    const response = await api.get(`${ANALYTICS_ENDPOINT}/alerts`);
    return response.data || {};
  } catch (error) {
    console.error("Error fetching alert stats:", error);
    throw error;
  }
}

export async function getUserStats() {
  try {
    const response = await api.get(`${ANALYTICS_ENDPOINT}/users`);
    return response.data || {};
  } catch (error) {
    console.error("Error fetching user stats:", error);
    throw error;
  }
}

export async function getEventStats() {
  try {
    const response = await api.get(`${ANALYTICS_ENDPOINT}/events`);
    return response.data || {};
  } catch (error) {
    console.error("Error fetching event stats:", error);
    throw error;
  }
}

export async function getResolutionTimeStats() {
  try {
    const response = await api.get(`${ANALYTICS_ENDPOINT}/resolution-time`);
    return response.data || {};
  } catch (error) {
    console.error("Error fetching resolution time stats:", error);
    throw error;
  }
}

export async function getDashboardMetrics() {
  try {
    const response = await api.get(`${ANALYTICS_ENDPOINT}/dashboard`);
    return response.data || {};
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    throw error;
  }
}
