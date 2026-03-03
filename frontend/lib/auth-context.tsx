"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  clearAuth,
  getToken,
  getRole,
  getFacilityId,
  isAuthenticated as checkAuth,
  setAuth,
} from "./auth";

interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  role: string | null;
  facilityId: number | null;
  user: AuthUser | null;
  initialized: boolean;
  login: (token: string, role?: string, facilityId?: number | null) => void;
  logout: () => void;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function decodePayload(token: string): { sub?: string; email?: string; role?: string; facility_id?: number } | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [authState, setAuthState] = useState<{
    isAuthenticated: boolean;
    role: string | null;
    facilityId: number | null;
    user: AuthUser | null;
    initialized: boolean;
  }>({
    isAuthenticated: false,
    role: null,
    facilityId: null,
    user: null,
    initialized: false,
  });

  const refreshAuth = useCallback(() => {
    if (typeof window === "undefined") return;
    const token = getToken();
    if (!token) {
      setAuthState({
        isAuthenticated: false,
        role: null,
        facilityId: null,
        user: null,
        initialized: true,
      });
      return;
    }
    const payload = decodePayload(token);
    const valid = checkAuth();
    const role = getRole();
    const facilityId = getFacilityId();
    setAuthState({
      isAuthenticated: valid,
      role: role || (payload?.role ?? null),
      facilityId: facilityId ?? payload?.facility_id ?? null,
      user: payload?.sub
        ? { id: payload.sub, email: payload.email ?? "" }
        : null,
      initialized: true,
    });
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const login = useCallback(
    (token: string, role?: string, facilityId?: number | null) => {
      const payload = decodePayload(token);
      const r = role ?? payload?.role ?? "player";
      const fid = facilityId ?? payload?.facility_id ?? null;
      setAuth(token, r, fid);
      setAuthState({
        isAuthenticated: true,
        role: r,
        facilityId: fid,
        user: payload?.sub
          ? { id: payload.sub, email: payload.email ?? "" }
          : null,
        initialized: true,
      });
    },
    []
  );

  const logout = useCallback(() => {
    clearAuth();
    setAuthState({
      isAuthenticated: false,
      role: null,
      facilityId: null,
      user: null,
      initialized: true,
    });
    router.replace("/login");
  }, [router]);

  const value: AuthContextValue = {
    ...authState,
    login,
    logout,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
