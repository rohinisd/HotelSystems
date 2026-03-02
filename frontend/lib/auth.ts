const TOKEN_KEY = "sfms_token";
const ROLE_KEY = "sfms_role";
const FACILITY_KEY = "sfms_facility_id";

export function setAuth(token: string, role: string, facilityId: number | null) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, role);
  if (facilityId) {
    localStorage.setItem(FACILITY_KEY, String(facilityId));
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRole(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ROLE_KEY);
}

export function getFacilityId(): number | null {
  if (typeof window === "undefined") return null;
  const val = localStorage.getItem(FACILITY_KEY);
  return val ? parseInt(val) : null;
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(FACILITY_KEY);
}

export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}
