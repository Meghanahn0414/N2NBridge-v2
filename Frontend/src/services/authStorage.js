function readStorage(key) {
  return sessionStorage.getItem(key) ?? localStorage.getItem(key);
}

function writeStorage(key, value) {
  sessionStorage.setItem(key, value);
  localStorage.removeItem(key);
}

function removeStorage(key) {
  sessionStorage.removeItem(key);
  localStorage.removeItem(key);
}

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
  return readStorage('role');
}

export function getAuthToken() {
  return readStorage('token');
}

export function setAuthToken(token) {
  if (!token) return;
  writeStorage('token', token);
}

export function setAuthRole(role) {
  if (!role) return;
  writeStorage('role', role);
}

export function setAuthUser(user) {
  if (!user) return;
  writeStorage('user', JSON.stringify(user));
}

export function updateAuthUser(changes) {
  const existingUser = getAuthUser() || {};
  const merged = { ...existingUser, ...changes };
  writeStorage('user', JSON.stringify(merged));
  return merged;
}

export function getAuthUser() {
  const storedUser = readStorage("user");
  if (storedUser) {
    try {
      return JSON.parse(storedUser);
    } catch (e) {
      console.error("Failed to parse stored user data:", e);
    }
  }

  // Fallback to JWT payload
  const token = getAuthToken();
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
  removeStorage('token');
  removeStorage('role');
  removeStorage('user');
}
