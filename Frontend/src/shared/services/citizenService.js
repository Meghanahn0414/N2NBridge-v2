import api from "./api";
import { getCurrentUserId } from "../../features/complaints/complaintService";

function requireCitizenId() {
  const citizenId = getCurrentUserId();
  if (!citizenId) {
    throw new Error("Citizen ID not found. Please login again.");
  }
  return citizenId;
}

export function getCitizenProfile() {
  const citizenId = requireCitizenId();
  return api.get(`/api/users/${citizenId}`).then((res) => res.data);
}

export function updateCitizenProfile(profileData) {
  return api.put(`/api/citizen/profile`, profileData).then((res) => res.data);
}

export function uploadCitizenProfilePhoto(file) {
  const citizenId = requireCitizenId();
  const formData = new FormData();
  formData.append("file", file);
  return api.post(`/api/users/${citizenId}/upload-profile-photo`, formData).then((res) => res.data);
}

export function getCitizenNotifications(page = 1, perPage = 10) {
  return api
    .get(`/api/notifications`, {
      params: { page, per_page: perPage },
    })
    .then((res) => res.data);
}

export function markAllNotificationsRead() {
  return api.post(`/api/notifications/mark-all-read`).then((res) => res.data);
}

export function getCitizenDashboard() {
  return api.get(`/api/dashboard/citizen`).then((res) => res.data);
}

export function getCitizenComplaints() {
  const citizenId = requireCitizenId();
  return api
    .get(`/api/grievances/citizen/${citizenId}`)
    .then((res) => res.data);
}

export function submitComplaintFeedback(grievanceId, feedback) {
  return api
    .post(`/api/grievances/${grievanceId}/feedback`, feedback)
    .then((res) => res.data);
}

export function getEvents(page = 1, perPage = 10) {
  return api
    .get(`/api/events`, {
      params: { page, per_page: perPage },
    })
    .then((res) => res.data);
}

export function registerForEvent(eventId) {
  return api
    .post(`/api/events/${eventId}/register`, {
      citizenId: requireCitizenId(),
    })
    .then((res) => res.data);
}
