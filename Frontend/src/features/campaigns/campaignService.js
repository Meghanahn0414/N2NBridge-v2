import api from "../../shared/services/api";

const CAMPAIGN_ENDPOINT = "/api/campaigns";

export async function fetchCampaigns(page = 1, perPage = 100, filters = {}) {
  try {
    const params = { page, per_page: perPage };
    if (filters.status && filters.status !== "ALL") {
      params.status = filters.status;
    }
    const response = await api.get(CAMPAIGN_ENDPOINT, { params });
    return Array.isArray(response.data) ? response.data : response.data?.data || [];
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    throw error;
  }
}

export async function fetchCampaignById(campaignId) {
  try {
    const response = await api.get(`${CAMPAIGN_ENDPOINT}/${campaignId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching campaign:", error);
    throw error;
  }
}

export async function createCampaign(campaignData) {
  try {
    const response = await api.post(CAMPAIGN_ENDPOINT, campaignData);
    return response.data;
  } catch (error) {
    console.error("Error creating campaign:", error);
    throw error;
  }
}

export async function updateCampaign(campaignId, campaignData) {
  try {
    const response = await api.put(`${CAMPAIGN_ENDPOINT}/${campaignId}`, campaignData);
    return response.data;
  } catch (error) {
    console.error("Error updating campaign:", error);
    throw error;
  }
}

export async function deleteCampaign(campaignId) {
  try {
    const response = await api.delete(`${CAMPAIGN_ENDPOINT}/${campaignId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting campaign:", error);
    throw error;
  }
}

export async function launchCampaign(campaignId) {
  try {
    const response = await api.post(`${CAMPAIGN_ENDPOINT}/${campaignId}/launch`);
    return response.data;
  } catch (error) {
    console.error("Error launching campaign:", error);
    throw error;
  }
}

export async function sendCampaignNotifications(campaignId) {
  try {
    const response = await api.post(`${CAMPAIGN_ENDPOINT}/${campaignId}/notify`);
    return response.data;
  } catch (error) {
    console.error("Error sending campaign notifications:", error);
    throw error;
  }
}
