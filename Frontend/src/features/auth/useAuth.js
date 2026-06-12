import { useEffect, useState } from "react";
import { clearAuth, getAuthRole, getAuthToken, setAuthRole, setAuthToken } from "../../services/authStorage";

export default function useAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = getAuthToken();
    const role = getAuthRole();
    if (token && role) {
      setUser({ token, role });
    }
  }, []);

  const login = (data) => {
    setAuthToken(data.token);
    setAuthRole(data.role);
    setUser(data);
  };

  const logout = () => {
    clearAuth();
    setUser(null);
    window.location.href = "/";
  };

  return { user, login, logout };
}
