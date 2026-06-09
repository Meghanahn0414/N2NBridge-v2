import api from "./api";

/**
 * Fetch events with pagination and filtering
 * @param {number} page - Page number (default: 1)
 * @param {number} perPage - Items per page (default: 1000)
 * @param {object} filters - Filter parameters
 * @returns {Promise<Array>} Array of events
 */
export async function fetchEvents(page = 1, perPage = 1000, filters = {}) {
  try {
    const response = await api.get("/api/events/", {
      params: {
        page,
        per_page: perPage,
        ...filters,
      },
    });

    // Handle various response formats
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (Array.isArray(response.data?.data)) {
      return response.data.data;
    }
    if (Array.isArray(response.data?.events)) {
      return response.data.events;
    }
    return response.data?.items || [];
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
}

/**
 * Create a new event
 * @param {object} eventData - Event data
 * @returns {Promise<object>} Created event
 */
export async function createEvent(eventData) {
  try {
    const response = await api.post("/api/events/", eventData);
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
}

/**
 * Update an event
 * @param {string} eventId - Event ID
 * @param {object} eventData - Updated event data
 * @returns {Promise<object>} Updated event
 */
export async function updateEvent(eventId, eventData) {
  try {
    const response = await api.put(`/api/events/${eventId}`, eventData);
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Error updating event:", error);
    throw error;
  }
}

/**
 * Get event by ID
 * @param {string} eventId - Event ID
 * @returns {Promise<object>} Event details
 */
export async function getEventById(eventId) {
  try {
    const response = await api.get(`/api/events/${eventId}`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Error fetching event:", error);
    throw error;
  }
}

/**
 * Delete an event
 * @param {string} eventId - Event ID
 * @returns {Promise<object>} Response
 */
export async function deleteEvent(eventId) {
  try {
    const response = await api.delete(`/api/events/${eventId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting event:", error);
    throw error;
  }
}

/**
 * Register for an event
 * @param {string} eventId - Event ID
 * @param {string} citizenId - Citizen ID
 * @returns {Promise<object>} Registration response
 */
export async function registerForEvent(eventId, citizenId) {
  try {
    const response = await api.post(`/api/events/${eventId}/register`, { citizenId });
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Error registering for event:", error);
    throw error;
  }
}

/**
 * Unregister from an event
 * @param {string} eventId - Event ID
 * @param {string} citizenId - Citizen ID
 * @returns {Promise<object>} Unregistration response
 */
export async function unregisterFromEvent(eventId, citizenId) {
  try {
    const response = await api.post(`/api/events/${eventId}/unregister`, { citizenId });
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Error unregistering from event:", error);
    throw error;
  }
}

export default {
  fetchEvents,
  createEvent,
  updateEvent,
  getEventById,
  deleteEvent,
  registerForEvent,
  unregisterFromEvent,
};
