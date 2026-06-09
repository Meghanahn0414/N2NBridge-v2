import api from "../../shared/services/api";

const CONSTITUENCIES_ENDPOINT = "/api/users/constituencies";

export async function fetchConstituencies(page = 1, perPage = 1000) {
  try {
    const response = await api.get(CONSTITUENCIES_ENDPOINT);
    // The endpoint returns a simple list, not paginated
    const allConstituencies = Array.isArray(response.data) ? response.data : response.data?.data || [];
    // Apply client-side pagination if needed
    const start = (page - 1) * perPage;
    const end = start + perPage;
    return allConstituencies.slice(start, end);
  } catch (error) {
    console.error("Error fetching constituencies:", error);
    throw error;
  }
}

export async function searchConstituencies(query) {
  try {
    const response = await api.get(`${CONSTITUENCIES_ENDPOINT}/search/${query}`);
    return response.data || [];
  } catch (error) {
    console.error("Error searching constituencies:", error);
    throw error;
  }
}

export async function createConstituency(constituencyData) {
  try {
    const response = await api.post(CONSTITUENCIES_ENDPOINT, constituencyData);
    return response.data;
  } catch (error) {
    console.error("Error creating constituency:", error);
    throw error;
  }
}

export async function getWards(constituencyId) {
  try {
    const response = await api.get(`${CONSTITUENCIES_ENDPOINT}/${constituencyId}/wards`);
    return Array.isArray(response.data) ? response.data : response.data?.data || [];
  } catch (error) {
    console.error("Error fetching wards:", error);
    throw error;
  }
}
