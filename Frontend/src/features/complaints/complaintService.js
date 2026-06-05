const API_BASE = "http://127.0.0.1:8000/api";

function getAuthHeaders(contentType = "application/json") {
  const token = localStorage.getItem("token");
  const headers = {};

  if (contentType !== null) {
    headers["Content-Type"] = contentType;
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

function parseJwt(token) {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join("")
    );
    return JSON.parse(json);
  } catch (error) {
    return null;
  }
}

export function getCurrentUserId() {
  const token = localStorage.getItem("token");
  const payload = parseJwt(token);
  return payload?.user_id || null;
}

async function request(path, options) {
  const response = await fetch(`${API_BASE}${path}`, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.detail || data?.message || "Request failed");
  }

  return data;
}

export function fetchComplaintCategories() {
  return request(`/grievances/categories`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
}

export function createComplaint(payload) {
  return request(`/grievances/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
}

export function getCitizenComplaints() {
  const citizenId = getCurrentUserId();
  return request(`/grievances/citizen/${citizenId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
}

export function getComplaintById(id) {
  return request(`/grievances/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
}

export function uploadComplaintAttachment(grievanceId, file) {
  const formData = new FormData();
  formData.append("file", file);

  return request(`/grievances/${grievanceId}/upload`, {
    method: "POST",
    headers: getAuthHeaders(null),
    body: formData,
  });
}

export function mapCategoryName(categoryId, categories) {
  const category = categories.find((item) => item.id === categoryId || item._id === categoryId);
  return category?.categoryName || categoryId || "Unknown";
}
