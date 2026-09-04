import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [forcePasswordChange, setForcePasswordChange] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const access = localStorage.getItem("accessToken");
      if (!access) {
        if (!cancelled) setReady(true);
        return;
      }
      try {
        const { data } = await api.get("/auth/me");
        if (!cancelled) {
          setUser(data.data);
          // Check if user still has tempPassword (from backend)
          // Actually, me route doesn't return tempPassword, but the login route does.
          // If the user refreshes during force change, they should still be redirected.
        }
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback((payload) => {
    localStorage.setItem("accessToken", payload.accessToken);
    localStorage.setItem("refreshToken", payload.refreshToken);
    setUser(payload.user);
    if (payload.forcePasswordChange) {
      setForcePasswordChange(true);
    }
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    try {
      await api.post("/auth/logout", { refreshToken: refreshToken || "" });
    } catch {
      /* ignore */
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
    setForcePasswordChange(false);
  }, []);

  const value = useMemo(
    () => {
      const can = (moduleName, action) => {
        const role = user?.role;
        if (!role) return false;
        if (role?.title === "admin" || role === "admin") return true;
        const permissions = role?.permissions || {};
        const modulePerms = permissions?.[moduleName];
        if (!modulePerms) return false;
        return Boolean(modulePerms.manage || modulePerms[action]);
      };

      return {
      user,
      ready,
      login,
      logout,
      isAdmin: user?.role?.title === "admin" || user?.role === "admin",
      forcePasswordChange,
      setForcePasswordChange,
      can,
    };
    },
    [user, ready, login, logout, forcePasswordChange],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
