import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "../api/client";

const EmployeeAuthContext = createContext(null);

function getAccess() {
  return localStorage.getItem("employee_accessToken");
}

function getRefresh() {
  return localStorage.getItem("employee_refreshToken");
}

export function EmployeeAuthProvider({ children }) {
  const [employee, setEmployee] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const access = getAccess();
      if (!access) {
        if (!cancelled) setReady(true);
        return;
      }
      try {
        const { data } = await api.get("/employee-auth/me", {
          token: access,
        });
        if (!cancelled) {
          setEmployee(data.data);
        }
      } catch {
        localStorage.removeItem("employee_accessToken");
        localStorage.removeItem("employee_refreshToken");
        if (!cancelled) setEmployee(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback((payload) => {
    localStorage.setItem("employee_accessToken", payload.accessToken);
    localStorage.setItem("employee_refreshToken", payload.refreshToken);
    setEmployee(payload.user);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getRefresh();
    try {
      await api.post("/employee-auth/logout", { refreshToken: refreshToken || "" });
    } catch {
      /* ignore */
    }
    localStorage.removeItem("employee_accessToken");
    localStorage.removeItem("employee_refreshToken");
    setEmployee(null);
  }, []);

  const value = useMemo(
    () => ({
      employee,
      ready,
      login,
      logout,
      isEmployee: true,
    }),
    [employee, ready, login, logout],
  );

  return (
    <EmployeeAuthContext.Provider value={value}>
      {children}
    </EmployeeAuthContext.Provider>
  );
}

export function useEmployeeAuth() {
  const ctx = useContext(EmployeeAuthContext);
  if (!ctx) throw new Error("useEmployeeAuth must be used within EmployeeAuthProvider");
  return ctx;
}
