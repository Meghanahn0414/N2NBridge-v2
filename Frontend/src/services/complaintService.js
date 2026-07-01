/**
 * Complaint Service - API calls for complaint operations
 */

import { getCurrentUserId } from "../features/complaints/complaintService";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000"}/api`;

function getHeaders() {
  return {
    "Content-Type": "application/json",
  };
}

async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.message || `API Error: ${response.status}`);
  }
  return response.json();
}

const complaintService = {
  /**
   * Get complaints for the current citizen only
   */
  async getMyComplaints(page = 1, perPage = 10, status = null) {
    try {
      const citizenId = getCurrentUserId();
      if (!citizenId) throw new Error("Please login again.");

      let url = `${API_BASE}/grievances/citizen/${citizenId}?page=${page}&per_page=${perPage}`;
      if (status) url += `&status=${status}`;

      const response = await fetch(url, { method: "GET", headers: getHeaders() });
      const data = await handleResponse(response);
      const list = Array.isArray(data) ? data : (data.data || []);
      return { complaints: list };
    } catch (error) {
      console.error("Error fetching complaints:", error);
      throw error;
    }
  },

  /**
   * Get complaint details by ID
   */
  async getComplaintDetail(complaintId) {
    try {
      const response = await fetch(`${API_BASE}/grievances/${complaintId}`, {
        method: "GET",
        headers: getHeaders(),
      });
      const data = await handleResponse(response);
      return data.data || data;
    } catch (error) {
      console.error("Error fetching complaint details:", error);
      throw error;
    }
  },

  /**
   * Create a new complaint
   */
  async createComplaint(complaintData) {
    try {
      const response = await fetch(`${API_BASE}/grievances`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(complaintData),
      });
      const data = await handleResponse(response);
      return data.data || data;
    } catch (error) {
      console.error("Error creating complaint:", error);
      throw error;
    }
  },

  /**
   * Update complaint (for officers/admins)
   */
  async updateComplaint(complaintId, updateData) {
    try {
      const response = await fetch(`${API_BASE}/grievances/${complaintId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(updateData),
      });
      const data = await handleResponse(response);
      return data.data || data;
    } catch (error) {
      console.error("Error updating complaint:", error);
      throw error;
    }
  },

  /**
   * Get complaint statistics for the current citizen only
   */
  async getComplaintStats() {
    try {
      const citizenId = getCurrentUserId();
      if (!citizenId) throw new Error("Please login again.");

      const response = await fetch(`${API_BASE}/grievances/stats/citizen/${citizenId}`, {
        method: "GET",
        headers: getHeaders(),
      });
      const data = await handleResponse(response);
      return data.data || data;
    } catch (error) {
      console.error("Error fetching complaint stats:", error);
      throw error;
    }
  },

  /**
   * Get ward complaints (for officers/admins)
   */
  async getWardComplaints(ward, page = 1, perPage = 10) {
    try {
      const response = await fetch(`${API_BASE}/grievances/ward/${ward}?page=${page}&per_page=${perPage}`, {
        method: "GET",
        headers: getHeaders(),
      });
      const data = await handleResponse(response);
      return data.data || { complaints: [] };
    } catch (error) {
      console.error("Error fetching ward complaints:", error);
      throw error;
    }
  },
};

export default complaintService;
