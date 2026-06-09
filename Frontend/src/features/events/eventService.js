import api from "../../shared/services/api";

const EVENT_ENDPOINT = "/api/events";

export async function fetchEvents(page = 1, perPage = 1000, filters = {}) {
  try {
    const params = { page, per_page: perPage };
    if (filters.status && filters.status !== "ALL") {
      params.status = filters.status;
    }
    const response = await api.get(EVENT_ENDPOINT, { params });
    return Array.isArray(response.data) ? response.data : response.data?.data || [];
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
}

export async function fetchEventById(eventId) {
  try {
    const response = await api.get(`${EVENT_ENDPOINT}/${eventId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching event:", error);
    throw error;
  }
}

export async function createEvent(eventData) {
  try {
    const response = await api.post(EVENT_ENDPOINT, eventData);
    return response.data;
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
}

export async function updateEvent(eventId, eventData) {
  try {
    const response = await api.put(`${EVENT_ENDPOINT}/${eventId}`, eventData);
    return response.data;
  } catch (error) {
    console.error("Error updating event:", error);
    throw error;
  }
}

export async function deleteEvent(eventId) {
  try {
    const response = await api.delete(`${EVENT_ENDPOINT}/${eventId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting event:", error);
    throw error;
  }
}
