import api from "../../shared/services/api";

const TASK_ENDPOINT = "/api/tasks";

export async function fetchTasks(page = 1, perPage = 1000, filters = {}) {
  try {
    const params = { page, per_page: perPage };
    if (filters.status && filters.status !== "ALL") {
      params.status = filters.status;
    }
    if (filters.priority && filters.priority !== "ALL") {
      params.priority = filters.priority;
    }
    const response = await api.get(TASK_ENDPOINT, { params });
    return Array.isArray(response.data) ? response.data : response.data?.data || [];
  } catch (error) {
    console.error("Error fetching tasks:", error);
    throw error;
  }
}

export async function fetchTaskById(taskId) {
  try {
    const response = await api.get(`${TASK_ENDPOINT}/${taskId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching task:", error);
    throw error;
  }
}

export async function createTask(taskData) {
  try {
    const response = await api.post(TASK_ENDPOINT, taskData);
    return response.data;
  } catch (error) {
    console.error("Error creating task:", error);
    throw error;
  }
}

export async function updateTask(taskId, taskData) {
  try {
    const response = await api.put(`${TASK_ENDPOINT}/${taskId}`, taskData);
    return response.data;
  } catch (error) {
    console.error("Error updating task:", error);
    throw error;
  }
}

export async function deleteTask(taskId) {
  try {
    const response = await api.delete(`${TASK_ENDPOINT}/${taskId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
}

export async function assignTask(taskId, userId) {
  try {
    const response = await api.put(`${TASK_ENDPOINT}/${taskId}/assign`, { userId });
    return response.data;
  } catch (error) {
    console.error("Error assigning task:", error);
    throw error;
  }
}
