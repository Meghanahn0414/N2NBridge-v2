// Production backend on Render — used for all environments including Expo Go dev
export const API_BASE = "https://testing-repository-grevienace-1.onrender.com";

// Frontend web app URL (used for WebView for admin/MLA/field/manager roles)
export const WEB_APP_URL = "https://testing-repository-grevienace-1.onrender.com";

// Maps each role to its web app route
export const ROLE_WEB_ROUTES: Record<string, string> = {
  ADMIN:                  "/admin",
  REPRESENTATIVE:         "/rep/dashboard",
  CONSTITUENCY_MANAGER:   "/manager",
  FIELD_OFFICER:          "/field",
};
