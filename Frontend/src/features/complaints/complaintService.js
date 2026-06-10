const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim();
const API_BASE = API_BASE_URL ? `${API_BASE_URL.replace(/\/$/, "")}/api` : "/api";

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

function getStoredUserId() {
  try {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return null;
    const user = JSON.parse(storedUser);
    return user?.user_id || user?.id || user?._id || null;
  } catch (error) {
    return null;
  }
}

export function getCurrentUserId() {
  const token = localStorage.getItem("token");
  const payload = parseJwt(token);
  const userId = payload?.user_id || payload?.id || payload?._id;
  return userId || getStoredUserId() || null;
}

async function request(path, options) {
  const url = `${API_BASE}${path}`;
  let response;

  try {
    response = await fetch(url, options);
  } catch (error) {
    throw new Error(`Network request failed for ${url}: ${error.message}`);
  }

  let data;
  try {
    data = await response.json();
  } catch (error) {
    throw new Error(`Invalid JSON response from ${url}: ${error.message}`);
  }

  if (!response.ok) {
    throw new Error(data?.detail || data?.message || `Request failed (${response.status})`);
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
  return request(`/grievances`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
}

export function getCitizenComplaints() {
  const citizenId = getCurrentUserId();
  if (!citizenId) {
    throw new Error("Unable to identify current citizen. Please login again.");
  }

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
