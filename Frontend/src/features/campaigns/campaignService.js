import api from "../../shared/services/api";

const CAMPAIGN_ENDPOINT = "/api/campaigns";

export async function fetchCampaigns(page = 1, perPage = 100, filters = {}) {
  try {
    const params = { page, per_page: perPage };
    if (filters.status && filters.status !== "ALL") {
      params.status = filters.status;
    }
    const response = await api.get(`${CAMPAIGN_ENDPOINT}/`, { params });
    // list_campaigns returns {success, data: {items, total, page, per_page}}.
    // This used to unwrap to the paginated object itself (truthy, so the
    // `|| []` fallback never kicked in) instead of its .items array, which
    // meant campaigns.length / campaigns.filter(...) in the callers silently
    // got undefined/threw. Handle both the paginated envelope and a bare array.
    const payload = response.data?.data;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.items)) return payload.items;
    return Array.isArray(response.data) ? response.data : [];
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
    const response = await api.post(`${CAMPAIGN_ENDPOINT}/`, campaignData);
    return response.data;
  } catch (error) {
    console.error("Error creating campaign:", error);
    throw error;
  }
}

export async function uploadCampaignImage(file) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(`${CAMPAIGN_ENDPOINT}/upload-image`, formData);
    return response.data;
  } catch (error) {
    console.error("Error uploading campaign image:", error);
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

export async function cancelCampaign(campaignId) {
  try {
    const response = await api.post(`${CAMPAIGN_ENDPOINT}/${campaignId}/cancel`);
    return response.data;
  } catch (error) {
    console.error("Error cancelling campaign:", error);
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
