import axios, { AxiosInstance } from "axios";
import { useRepresentativesStore } from "../store/representativesStore";
import type { RepType } from "./lookupApi";

/**
 * Unlike services/api.ts (one fixed API_BASE + one global token), each
 * linked representative here lives on its own server with its own token.
 * Use this whenever a screen needs to talk to a SPECIFIC linked
 * representative (my-representatives, a rep's profile, filing a grievance
 * against them, ...).
 */
export function repApi(repType: RepType): AxiosInstance {
  const link = useRepresentativesStore.getState().getLink(repType);
  if (!link) {
    throw new Error(`No representative linked for ${repType} — link one first.`);
  }
  const client = axios.create({ baseURL: link.serverUrl, timeout: 15000 });
  client.interceptors.request.use((config) => {
    config.headers.Authorization = `Bearer ${link.token}`;
    return config;
  });
  return client;
}

/**
 * A plain (unauthenticated) client aimed at a specific server_url —
 * used during the link flow itself, before a token exists yet
 * (send-otp / verify-otp / register-details against that representative's
 * own server).
 */
export function serverApi(serverUrl: string, token?: string): AxiosInstance {
  const client = axios.create({ baseURL: serverUrl, timeout: 15000 });
  if (token) {
    client.interceptors.request.use((config) => {
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }
  return client;
}
