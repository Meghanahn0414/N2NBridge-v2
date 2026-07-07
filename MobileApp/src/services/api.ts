import axios from "axios";
import { API_BASE } from "../config";
import { useAuthStore } from "../store/authStore";

const api = axios.create({ baseURL: API_BASE, timeout: 15000 });

api.interceptors.request.use((config) => {
  const { token, serverUrl } = useAuthStore.getState();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // A citizen who logged in via the Lookup Service flow (own representative
  // server, not the shared API_BASE) — override per-request so every screen
  // in the app (profile, complaints, dashboard, ...) transparently keeps
  // talking to the right server without needing its own change.
  if (serverUrl) config.baseURL = serverUrl;
  return config;
});

export default api;
