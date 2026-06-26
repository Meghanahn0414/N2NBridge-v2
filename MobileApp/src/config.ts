import { Platform } from "react-native";

// ─── Backend URL ────────────────────────────────────────────────────────────
// How API_BASE is resolved (priority order):
//
//  1. EXPO_PUBLIC_API_URL set in MobileApp/.env → use that value exactly
//     (use this for physical device or custom backend, e.g. http://192.168.x.x:8000)
//
//  2. Running as web (via Vite proxy on port 3000 or Expo web on 8081):
//     - localhost → http://localhost:8000 (local uvicorn backend)
//     - any other host → Render cloud backend
//
//  3. Running as native Android/iOS APK → Render cloud backend
//     (window.location doesn't exist on native — must not touch it)
//
export const API_BASE =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ||
  (() => {
    // Native Android/iOS: window.location is undefined → skip straight to Render
    if (Platform.OS !== "web")
      return "https://testing-repository-grevienace-1.onrender.com";
    const { hostname } = window.location;
    // Any localhost/loopback access → local backend directly (port-agnostic)
    if (hostname === "localhost" || hostname === "127.0.0.1")
      return "http://localhost:8000";
    // LAN IP, Render, or any other host → Render cloud
    return "https://testing-repository-grevienace-1.onrender.com";
  })();

// Frontend web app URL (used for WebView for admin/MLA/field/manager roles)
export const WEB_APP_URL =
  process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, "") ||
  "https://testing-repository-grevienace-1.onrender.com";

// Maps each role to its web app route
export const ROLE_WEB_ROUTES: Record<string, string> = {
  ADMIN:                  "/admin",
  REPRESENTATIVE:         "/rep/dashboard",
  CONSTITUENCY_MANAGER:   "/manager",
  FIELD_OFFICER:          "/field",
};
