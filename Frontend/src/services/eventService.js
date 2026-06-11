/**
 * Events Service
 * Handles all event-related API calls
 */

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000"}/api`;

class EventService {
  /**
   * Get authorization header with Bearer token
   */
  static getAuthToken() {
    return (typeof sessionStorage !== "undefined" && sessionStorage.getItem("token")) || localStorage.getItem("token");
  }

  static getHeaders() {
    const token = this.getAuthToken();
    return {
      "Content-Type": "application/json",
      ...(token && { "Authorization": `Bearer ${token}` }),
    };
  }

  /**
   * Get all events for the citizen
   */
  static async getCitizenEvents(page = 1, perPage = 10) {
    try {
      const token = this.getAuthToken();
      if (!token) {
        console.warn("No token found, events will not be fetched");
        return { registered: [], upcoming: [] };
      }

      const response = await fetch(
        `${API_BASE_URL}/events?page=${page}&perPage=${perPage}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        if (response.status === 401) {
          console.warn("Invalid or expired token");
          return { registered: [], upcoming: [] };
        }
        throw new Error(`Failed to fetch events: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        registered: data.data?.registered || [],
        upcoming: data.data?.upcoming || [],
        total: data.data?.total || 0,
      };
    } catch (error) {
      console.error("Error fetching citizen events:", error);
      throw error;
    }
  }

  /**
   * Get events by ward
   */
  static async getWardEvents(ward, page = 1, perPage = 10) {
    try {
      const token = this.getAuthToken();
      if (!token) {
        return { events: [] };
      }

      const response = await fetch(
        `${API_BASE_URL}/events/ward/${ward}?page=${page}&perPage=${perPage}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch ward events: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        events: data.data?.events || [],
        total: data.data?.total || 0,
      };
    } catch (error) {
      console.error("Error fetching ward events:", error);
      throw error;
    }
  }

  /**
   * Register for an event
   */
  static async registerForEvent(eventId) {
    try {
      const token = this.getAuthToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/events/${eventId}/register`,
        {
          method: "POST",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to register for event");
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error("Error registering for event:", error);
      throw error;
    }
  }

  /**
   * Unregister from an event
   */
  static async unregisterFromEvent(eventId) {
    try {
      const token = this.getAuthToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/events/${eventId}/unregister`,
        {
          method: "POST",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to unregister from event");
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error("Error unregistering from event:", error);
      throw error;
    }
  }

  /**
   * Get event statistics for dashboard
   */
  static async getEventStats() {
    try {
      const token = this.getAuthToken();
      if (!token) {
        return { registered: 0, upcoming: 0, attended: 0 };
      }

      const response = await fetch(
        `${API_BASE_URL}/events/stats/summary`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        console.warn("Failed to fetch event stats");
        return { registered: 0, upcoming: 0, attended: 0 };
      }

      const data = await response.json();
      return data.data || { registered: 0, upcoming: 0, attended: 0 };
    } catch (error) {
      console.error("Error fetching event stats:", error);
      return { registered: 0, upcoming: 0, attended: 0 };
    }
  }

  /**
   * Get complaints statistics for dashboard
   */
  static async getComplaintStats() {
    try {
      const token = this.getAuthToken();
      if (!token) {
        return { open: 0, assigned: 0, resolved: 0, total: 0 };
      }

      const response = await fetch(
        `${API_BASE_URL}/grievances/stats/summary`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        console.warn("Failed to fetch complaint stats");
        return { open: 0, assigned: 0, resolved: 0, total: 0 };
      }

      const data = await response.json();
      return data.data || { open: 0, assigned: 0, resolved: 0, total: 0 };
    } catch (error) {
      console.error("Error fetching complaint stats:", error);
      return { open: 0, assigned: 0, resolved: 0, total: 0 };
    }
  }

  /**
   * Get alerts/notifications statistics
   */
  static async getAlertStats() {
    try {
      const token = this.getAuthToken();
      if (!token) {
        return { unread: 0, total: 0 };
      }

      const response = await fetch(
        `${API_BASE_URL}/notifications/stats/stats`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        console.warn("Failed to fetch alert stats");
        return { unread: 0, total: 0 };
      }

      const data = await response.json();
      return data.data || { unread: 0, total: 0 };
    } catch (error) {
      console.error("Error fetching alert stats:", error);
      return { unread: 0, total: 0 };
    }
  }
}

export default EventService;
