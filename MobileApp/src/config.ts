// ─── Backend URL ────────────────────────────────────────────────────────────
// How API_BASE is resolved (priority order):
//
//  1. EXPO_PUBLIC_API_URL set in MobileApp/.env → use that value exactly
//     (use this for physical device or custom backend, e.g. http://192.168.x.x:8000)
//
//  2. Running in a browser on localhost (any port: 3000, 19006, 8081, etc.)
//     → http://localhost:8000  (local uvicorn backend directly — no Vite proxy needed)
//
//  3. Anything else (production build, Render hosting, etc.)
//     → Render cloud backend
//
export const API_BASE =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ||
  (() => {
    if (typeof window === "undefined")
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
