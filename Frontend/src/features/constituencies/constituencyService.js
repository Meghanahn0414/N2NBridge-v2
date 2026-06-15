import api from "../../shared/services/api";

const BASE = "/api/users/constituencies";
const WARDS_BASE = "/api/users/wards";

const extractError = (error) => {
  const detail = error?.response?.data?.detail || error?.response?.data?.message;
  return new Error(detail || error?.message || "Request failed");
};

export async function fetchConstituencies() {
  try {
    const response = await api.get(BASE);
    return Array.isArray(response.data) ? response.data : response.data?.data || [];
  } catch (error) {
    throw extractError(error);
  }
}

export async function fetchAllWards() {
  try {
    const response = await api.get(WARDS_BASE);
    return Array.isArray(response.data) ? response.data : response.data?.data || [];
  } catch (error) {
    throw extractError(error);
  }
}

export async function createConstituency(data) {
  try {
    const response = await api.post(BASE, data);
    return response.data;
  } catch (error) {
    throw extractError(error);
  }
}

export async function updateConstituency(id, data) {
  try {
    const response = await api.put(`${BASE}/${id}`, data);
    return response.data;
  } catch (error) {
    throw extractError(error);
  }
}

export async function deleteConstituency(id) {
  try {
    const response = await api.delete(`${BASE}/${id}`);
    return response.data;
  } catch (error) {
    throw extractError(error);
  }
}

export async function getWards(constituencyId) {
  try {
    const response = await api.get(`${BASE}/${constituencyId}/wards`);
    return Array.isArray(response.data) ? response.data : response.data?.data || [];
  } catch (error) {
    throw extractError(error);
  }
}

export async function createWard(data) {
  try {
    const response = await api.post(WARDS_BASE, data);
    return response.data;
  } catch (error) {
    throw extractError(error);
  }
}

export async function deleteWard(wardId) {
  try {
    const response = await api.delete(`${WARDS_BASE}/${wardId}`);
    return response.data;
  } catch (error) {
    throw extractError(error);
  }
}
