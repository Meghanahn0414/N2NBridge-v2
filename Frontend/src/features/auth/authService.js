const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim();
const BASE_URL = import.meta.env.DEV
  ? "/api/auth"
  : API_BASE_URL
    ? `${API_BASE_URL.replace(/\/$/, "")}/api/auth`
    : "/api/auth";

async function callApi(path, payload) {
  const url = `${BASE_URL}${path}`;
  let response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    throw new Error(`Network request failed for ${url}: ${error.message}`);
  }

  const data = await response.json();
  if (!response.ok) {
    // Backend may return error details in `detail` or `message`
    const errMsg = data?.detail || data?.message || "Authentication failed";
    throw new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
  }
  return data;
}

export function sendOtp(payload) {
  return callApi("/send-otp", payload);
}

export function verifyOtp(payload) {
  return callApi("/verify-otp", payload);
}

export function registerAdmin(payload) {
  return callApi("/register", payload);
}

export function loginAdmin(payload) {
  return callApi("/login-admin", payload);
}
