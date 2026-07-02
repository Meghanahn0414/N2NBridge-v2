import api from "../../shared/services/api";

const GRIEVANCE_ENDPOINT = "/api/grievances";

export async function fetchGrievances(page = 1, perPage = 100, filters = {}) {
  try {
    const params = { page, per_page: perPage };
    if (filters.status && filters.status !== "ALL") {
      params.status = filters.status;
    }
    if (filters.priority && filters.priority !== "ALL") {
      params.priority = filters.priority;
    }
    if (filters.assignedOfficerId) {
      params.assigned_to = filters.assignedOfficerId;
    }
    // GET /api/grievances/ is the CITIZEN-facing "my own grievances"
    // endpoint — it filters by citizen_id = caller's own user_id, which for
    // a Representative/Staff/Admin caller matches nothing (they aren't a
    // citizen), so it always silently returned an empty list. The rep-side
    // full queue lives at /api/rep/grievances/ instead. This service is
    // only ever used from staff-facing pages (ComplaintManagement,
    // FieldOfficerGrievances, TeamManagement), never from a citizen screen.
    const response = await api.get(`/api/rep/grievances/`, { params });
    // Paginated envelope: { success, message, data: { items, total, page, per_page } }.
    // Unwrap .items first; only fall back to treating .data itself as the
    // array for any older/flat response shape.
    const payload = response.data?.data;
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.items)) return payload.items;
    return Array.isArray(response.data) ? response.data : [];
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

// There's no generic PUT /{id} for status changes on either router — status
// moves through specific PATCH sub-endpoints instead, each of which forces
// exactly one resulting status (see grievances/routes.py's acknowledge/
// progress/resolve/close). Map the target status to the right one here so
// callers can keep just passing { status: "..." } like a generic update.
const STATUS_TO_ENDPOINT = {
  "Assigned":    "acknowledge",
  "In Progress": "progress",
  "Resolved":    "resolve",
  "Closed":      "close",
};

export async function updateGrievance(grievanceId, updateData) {
  try {
    const targetStatus = updateData?.status;
    const action = targetStatus && STATUS_TO_ENDPOINT[targetStatus];
    if (!action) {
      throw new Error(
        targetStatus
          ? `"${targetStatus}" isn't a supported status transition (use Assigned, In Progress, Resolved, or Closed).`
          : "A target status is required."
      );
    }
    const response = await api.patch(`/api/rep/grievances/${grievanceId}/${action}`, {
      remarks: updateData.remarks || undefined,
    });
    return response.data;
  } catch (error) {
    console.error("Error updating grievance:", error);
    throw error;
  }
}

export async function assignGrievance(grievanceId, officerId) {
  try {
    // The rep-facing assign action lives under /api/rep/grievances/, takes
    // the staff id in the request body (not the URL), and expects a
    // `staff_id` key — /api/grievances/{id}/assign/{officerId} with an
    // empty body doesn't match any route on either router.
    const response = await api.post(
      `/api/rep/grievances/${grievanceId}/assign`,
      { staff_id: officerId }
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
