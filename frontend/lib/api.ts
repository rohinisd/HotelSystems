const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("sfms_token") : null;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(res.status, text);
  }

  return res.json();
}

// --- Types ---

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  role: string;
  facility_id: number | null;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  role: string;
  facility_id: number | null;
  is_active: boolean;
}

export interface Facility {
  id: number;
  name: string;
  slug: string;
  owner_name: string | null;
  subscription_plan: string;
  is_active: boolean;
}

export interface Branch {
  id: number;
  facility_id: number;
  name: string;
  address: string | null;
  city: string | null;
  opening_time: string;
  closing_time: string;
  is_active: boolean;
}

export interface Court {
  id: number;
  branch_id: number;
  facility_id: number;
  name: string;
  sport: string;
  surface_type: string | null;
  hourly_rate: number;
  peak_hour_rate: number | null;
  slot_duration_minutes: number;
  is_indoor: boolean;
  is_active: boolean;
}

export interface DashboardKPI {
  label: string;
  value: string;
  change_pct: number;
  period: string;
}

// --- API Client ---

export const api = {
  // Health
  health: () => request<{ status: string }>("/api/v1/health"),

  // Auth
  login: (email: string, password: string) =>
    request<TokenResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (data: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
  }) =>
    request<TokenResponse>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMe: () => request<User>("/api/v1/auth/me"),

  // Facilities
  getFacilities: () => request<Facility[]>("/api/v1/facilities"),
  getBranches: (facilityId: number) =>
    request<Branch[]>(`/api/v1/facilities/${facilityId}/branches`),

  // Courts
  getCourts: (branchId?: number) =>
    request<Court[]>(
      `/api/v1/courts${branchId ? `?branch_id=${branchId}` : ""}`,
    ),

  // Dashboard (Phase 4)
  getDashboardKPIs: () => request<DashboardKPI[]>("/api/v1/dashboard/kpis"),
};
