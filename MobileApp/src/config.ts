// Backend API URL
export const API_BASE = "https://testing-repository-grevienace-1.onrender.com";

// Frontend web app URL (used for WebView for admin/MLA/field/manager roles)
// For local testing use your PC's WiFi IP, e.g. "http://192.168.1.35:3000"
// For production replace with your deployed frontend URL
export const WEB_APP_URL = "https://testing-repository-grevienace-1.onrender.com";

// Maps each role to its web app route
export const ROLE_WEB_ROUTES: Record<string, string> = {
  ADMIN:                  "/admin",
  REPRESENTATIVE:         "/rep/dashboard",
  CONSTITUENCY_MANAGER:   "/manager",
  FIELD_OFFICER:          "/field",
};
