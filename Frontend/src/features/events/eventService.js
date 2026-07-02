import api from "../../shared/services/api";

const EVENT_ENDPOINT = "/api/events";

const extractError = (error) => {
  const detail = error?.response?.data?.detail || error?.response?.data?.message;
  return new Error(detail || error?.message || "Request failed");
};

export async function fetchEvents(page = 1, perPage = 100, filters = {}) {
  try {
    const params = { page, per_page: perPage };
    if (filters.status && filters.status !== "ALL") {
      params.status = filters.status;
    }
    const response = await api.get(`${EVENT_ENDPOINT}/`, { params });
    // list_events returns {success, data: {items, total, page, per_page}}.
    // Previously this unwrapped to `data` (the paginated object) instead of
    // `data.items` (the actual array), so callers doing eventsData.length /
    // [...eventsData] would get undefined/throw. Handle both the paginated
    // envelope and a bare array, for safety.
    const payload = response.data?.data;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.items)) return payload.items;
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    throw extractError(error);
  }
}

export async function fetchEventById(eventId) {
  try {
    const response = await api.get(`${EVENT_ENDPOINT}/${eventId}`);
    return response.data;
  } catch (error) {
    throw extractError(error);
  }
}

export async function createEvent(eventData) {
  try {
    const response = await api.post(`${EVENT_ENDPOINT}/`, eventData);
    return response.data;
  } catch (error) {
    throw extractError(error);
  }
}

export async function updateEvent(eventId, eventData) {
  try {
    const response = await api.put(`${EVENT_ENDPOINT}/${eventId}`, eventData);
    return response.data;
  } catch (error) {
    throw extractError(error);
  }
}

export async function deleteEvent(eventId) {
  try {
    const response = await api.delete(`${EVENT_ENDPOINT}/${eventId}`);
    return response.data;
  } catch (error) {
    throw extractError(error);
  }
}

export async function registerForEvent(eventId, citizenId) {
  try {
    const response = await api.post(`${EVENT_ENDPOINT}/${eventId}/register`, { eventId, citizenId });
    return response.data;
  } catch (error) {
    throw extractError(error);
  }
}

export async function publishEvent(eventId) {
  try {
    const response = await api.post(`${EVENT_ENDPOINT}/${eventId}/publish`);
    return response.data;
  } catch (error) {
    throw extractError(error);
  }
}

export async function cancelEvent(eventId) {
  try {
    const response = await api.post(`${EVENT_ENDPOINT}/${eventId}/cancel`);
    return response.data;
  } catch (error) {
    throw extractError(error);
  }
}
