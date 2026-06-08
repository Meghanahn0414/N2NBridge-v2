function parseJwt(token) {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(
      decoded
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    ));
  } catch (error) {
    console.error('Failed to parse JWT payload:', error);
    return null;
  }
}

export function getAuthRole() {
  return localStorage.getItem('role');
}

export function setAuthToken(token) {
  localStorage.setItem('token', token);
}

export function setAuthRole(role) {
  localStorage.setItem('role', role);
}

export function setAuthUser(user) {
  if (!user) return;
  localStorage.setItem('user', JSON.stringify(user));
}

export function updateAuthUser(changes) {
  const existingUser = getAuthUser() || {};
  const merged = { ...existingUser, ...changes };
  localStorage.setItem('user', JSON.stringify(merged));
  return merged;
}

export function getAuthUser() {
  // First try to get full user data from localStorage (includes profileImage)
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    try {
      return JSON.parse(storedUser);
    } catch (e) {
      console.error("Failed to parse stored user data:", e);
    }
  }

  // Fallback to JWT payload
  const token = localStorage.getItem('token');
  const payload = parseJwt(token);
  if (!payload) return null;
  return {
    name: payload.name || payload.fullName || payload.full_name || payload.first_name || payload.firstName || null,
    email: payload.email || payload.email_address || null,
    role: payload.role || payload.user_role || null,
    ...payload,
  };
}

export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('user');
}
