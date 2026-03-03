const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

let isRefreshing = false;

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

  if (res.status === 401 && token && !isRefreshing && path !== "/api/v1/auth/refresh") {
    isRefreshing = true;
    try {
      const refreshRes = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        localStorage.setItem("sfms_token", data.access_token);
        isRefreshing = false;
        return request<T>(path, options);
      }
    } catch {}
    isRefreshing = false;
    if (typeof window !== "undefined") {
      localStorage.removeItem("sfms_token");
      localStorage.removeItem("sfms_role");
      localStorage.removeItem("sfms_facility_id");
      window.location.href = "/login";
    }
  }

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

export interface Slot {
  start_time: string;
  end_time: string;
  is_available: boolean;
  court_id: number;
  price: number;
}

export interface BookingItem {
  id: number;
  facility_id: number;
  court_id: number;
  court_name: string;
  branch_name: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  booking_type: string;
  player_name: string | null;
  player_phone: string | null;
  amount: number;
  notes: string | null;
  created_at: string;
  payment_id: number | null;
  payment_status: string | null;
  payment_method: string | null;
}

export interface ScheduleItem extends BookingItem {
  sport: string;
  player_full_name: string | null;
}

export interface DashboardKPI {
  label: string;
  value: string;
  change_pct: number;
  period: string;
}

export interface RevenueTrend {
  date: string;
  revenue: number;
  bookings: number;
}

export interface PaymentOrder {
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  booking_id: number;
}

export interface UtilizationData {
  court_name: string;
  sport: string;
  total_bookings: number;
  total_revenue: number;
}

export interface HourlyUtilization {
  court_name: string;
  day_of_week: number;
  hour: number;
  booking_count: number;
}

export interface PricingRule {
  id: number;
  court_id: number;
  day_of_week: number | null;
  start_time: string;
  end_time: string;
  rate: number;
  label: string | null;
  is_active: boolean;
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

  updateMe: (data: { full_name?: string; phone?: string }) =>
    request<User>("/api/v1/auth/me", { method: "PATCH", body: JSON.stringify(data) }),

  // Facilities
  getFacilities: () => request<Facility[]>("/api/v1/facilities"),
  getBranches: (facilityId: number) =>
    request<Branch[]>(`/api/v1/facilities/${facilityId}/branches`),

  // Courts
  getCourts: (branchId?: number) =>
    request<{ items: Court[]; total: number }>(
      `/api/v1/courts${branchId ? `?branch_id=${branchId}` : ""}`,
    ).then((r) => r.items),

  getCourtsPaginated: (params?: { branch_id?: number; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.branch_id) qs.set("branch_id", String(params.branch_id));
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.offset) qs.set("offset", String(params.offset));
    const q = qs.toString();
    return request<{ items: Court[]; total: number }>(`/api/v1/courts${q ? `?${q}` : ""}`);
  },

  // Bookings
  getSlots: (courtId: number, date: string) =>
    request<Slot[]>(`/api/v1/bookings/slots?court_id=${courtId}&date=${date}`),

  createBooking: (data: {
    court_id: number;
    date: string;
    start_time: string;
    end_time: string;
    booking_type: string;
    player_name?: string;
    player_phone?: string;
    notes?: string;
  }) =>
    request<{ id: number; status: string; amount: number }>(
      "/api/v1/bookings",
      { method: "POST", body: JSON.stringify(data) },
    ),

  getBookings: (params?: { date?: string; court_id?: number; status?: string; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.date) qs.set("date", params.date);
    if (params?.court_id) qs.set("court_id", String(params.court_id));
    if (params?.status) qs.set("status", params.status);
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.offset) qs.set("offset", String(params.offset));
    const q = qs.toString();
    return request<{ items: BookingItem[]; total: number }>(`/api/v1/bookings${q ? `?${q}` : ""}`);
  },

  cancelBooking: (id: number) =>
    request<{ id: number; status: string }>(`/api/v1/bookings/${id}/cancel`, {
      method: "PATCH",
    }),

  getSchedule: (date?: string) =>
    request<ScheduleItem[]>(
      `/api/v1/bookings/schedule${date ? `?date=${date}` : ""}`,
    ),

  // Payments
  createPaymentOrder: (bookingId: number) =>
    request<PaymentOrder>(`/api/v1/payments/order/${bookingId}`, { method: "POST" }),

  verifyPayment: (data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
    request<{ status: string }>("/api/v1/payments/verify", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  recordCashPayment: (bookingId: number) =>
    request<{ status: string }>(`/api/v1/payments/cash/${bookingId}`, { method: "POST" }),

  recordUpiPayment: (bookingId: number) =>
    request<{ status: string }>(`/api/v1/payments/upi/${bookingId}`, { method: "POST" }),

  refundPayment: (paymentId: number) =>
    request<{ refund_id: string; status: string }>(`/api/v1/payments/refund/${paymentId}`, { method: "POST" }),

  // Courts CRUD
  createCourt: (data: {
    branch_id: number;
    name: string;
    sport: string;
    surface_type?: string;
    hourly_rate: number;
    peak_hour_rate?: number;
    slot_duration_minutes?: number;
    is_indoor?: boolean;
  }) =>
    request<Court>("/api/v1/courts", { method: "POST", body: JSON.stringify(data) }),

  updateCourt: (id: number, data: Partial<{
    name: string;
    sport: string;
    surface_type: string;
    hourly_rate: number;
    peak_hour_rate: number;
    slot_duration_minutes: number;
    is_indoor: boolean;
    is_active: boolean;
  }>) =>
    request<Court>(`/api/v1/courts/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  getCourtPricing: (courtId: number) =>
    request<PricingRule[]>(`/api/v1/courts/${courtId}/pricing`),

  createPricingRule: (courtId: number, data: {
    day_of_week?: number;
    start_time: string;
    end_time: string;
    rate: number;
    label?: string;
  }) =>
    request<PricingRule>(`/api/v1/courts/${courtId}/pricing`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deletePricingRule: (courtId: number, ruleId: number) =>
    request<void>(`/api/v1/courts/${courtId}/pricing/${ruleId}`, { method: "DELETE" }),

  // Branches
  createBranch: (facilityId: number, data: {
    name: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
    opening_time?: string;
    closing_time?: string;
  }) =>
    request<Branch>(`/api/v1/facilities/${facilityId}/branches`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Team / Users
  getTeam: () => request<User[]>("/api/v1/users"),

  inviteUser: (data: {
    email: string;
    full_name: string;
    phone?: string;
    role: string;
    password: string;
  }) =>
    request<User>("/api/v1/users", { method: "POST", body: JSON.stringify(data) }),

  updateUser: (id: number, data: { role?: string; is_active?: boolean }) =>
    request<User>(`/api/v1/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  // Dashboard
  getDashboardKPIs: () => request<DashboardKPI[]>("/api/v1/dashboard/kpis"),

  getRevenueTrend: (days?: number) =>
    request<RevenueTrend[]>(
      `/api/v1/dashboard/revenue-trend${days ? `?days=${days}` : ""}`,
    ),

  getUtilization: () =>
    request<UtilizationData[]>("/api/v1/dashboard/utilization"),

  getHourlyUtilization: (days?: number) =>
    request<HourlyUtilization[]>(
      `/api/v1/dashboard/utilization/hourly${days ? `?days=${days}` : ""}`,
    ),
};
