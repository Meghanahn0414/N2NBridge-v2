import api from './api';

const extractData = (response) => response.data?.data ?? response.data;

export async function getGrievanceCategories() {
  const response = await api.get('/api/grievances/categories');
  return extractData(response);
}

export async function getCountries() {
  const response = await api.get('/api/lookups/countries');
  return extractData(response);
}

export async function getUserRoles() {
  const response = await api.get('/api/lookups/user-roles');
  return extractData(response);
}

export async function getUserStatuses() {
  const response = await api.get('/api/lookups/user-statuses');
  return extractData(response);
}

export async function getAlertPriorities() {
  const response = await api.get('/api/lookups/alert-priorities');
  return extractData(response);
}

export async function getAlertStatuses() {
  const response = await api.get('/api/lookups/alert-statuses');
  return extractData(response);
}

export async function getAlertTypes() {
  const response = await api.get('/api/lookups/alert-types');
  return extractData(response);
}

export async function getGrievanceStatuses() {
  const response = await api.get('/api/lookups/grievance-statuses');
  return extractData(response);
}

export async function getGrievancePriorities() {
  const response = await api.get('/api/lookups/grievance-priorities');
  return extractData(response);
}

export async function getEventStatuses() {
  const response = await api.get('/api/lookups/event-statuses');
  return extractData(response);
}

export async function getEventTypes() {
  const response = await api.get('/api/lookups/event-types');
  return extractData(response);
}

export async function getCommunicationChannels() {
  const response = await api.get('/api/lookups/communication-channels');
  return extractData(response);
}

export async function getAudienceSegments() {
  const response = await api.get('/api/lookups/audience-segments');
  return extractData(response);
}
