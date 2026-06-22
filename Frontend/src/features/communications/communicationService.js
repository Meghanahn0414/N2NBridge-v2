import api from "../../shared/services/api";

const NOTIFICATION_ENDPOINT = "/api/notifications";

export async function fetchNotifications(page = 1, perPage = 100, filters = {}) {
  try {
    const params = { page, per_page: perPage };
    const response = await api.get(NOTIFICATION_ENDPOINT, { params });
    return Array.isArray(response.data) ? response.data : response.data?.data || [];
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
}

export async function fetchNotificationById(notificationId) {
  try {
    const response = await api.get(`${NOTIFICATION_ENDPOINT}/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching notification:", error);
    throw error;
  }
}

export async function markNotificationAsRead(notificationId) {
  try {
    const response = await api.put(`${NOTIFICATION_ENDPOINT}/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
}

export async function deleteNotification(notificationId) {
  try {
    const response = await api.delete(`${NOTIFICATION_ENDPOINT}/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting notification:", error);
    throw error;
  }
}

export async function sendNotification(notificationData) {
  try {
    const response = await api.post(NOTIFICATION_ENDPOINT, notificationData);
    return response.data;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
}

export async function broadcastNotification(notificationData) {
  try {
    const response = await api.post(`${NOTIFICATION_ENDPOINT}/broadcast`, notificationData);
    return response.data;
  } catch (error) {
    console.error("Error broadcasting notification:", error);
    throw error;
  }
}
