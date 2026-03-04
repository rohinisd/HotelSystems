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
    let message = text;
    try {
      const json = JSON.parse(text);
      if (json.detail) message = typeof json.detail === "string" ? json.detail : JSON.stringify(json.detail);
    } catch {}
    throw new ApiError(res.status, message);
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
  is_peak?: boolean;
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
  booking_source?: string;
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

export interface DueItem {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  amount: number;
  player_name: string | null;
  player_phone: string | null;
  booking_type: string;
  court_name: string;
  sport: string;
  payment_status: string | null;
  payment_method: string | null;
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

export interface Equipment {
  id: number;
  facility_id: number;
  branch_id: number | null;
  name: string;
  category: string;
  brand: string | null;
  total_quantity: number;
  available_quantity: number;
  condition: string;
  rental_rate: number | null;
  is_rentable: boolean;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  branch_name: string | null;
}

export interface Tournament {
  id: number;
  facility_id: number;
  name: string;
  sport: string;
  format: string;
  status: string;
  start_date: string;
  end_date: string | null;
  registration_deadline: string | null;
  max_teams: number | null;
  entry_fee: number;
  prize_pool: string | null;
  rules: string | null;
  description: string | null;
  contact_phone: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  team_count: number;
}

export interface TournamentTeam {
  id: number;
  tournament_id: number;
  team_name: string;
  player1_name: string;
  player1_phone: string | null;
  player1_email: string | null;
  player2_name: string | null;
  player2_phone: string | null;
  seed: number | null;
  group_name: string | null;
  status: string;
  registered_at: string;
}

export interface TournamentMatch {
  id: number;
  tournament_id: number;
  round: number;
  match_number: number;
  group_name: string | null;
  court_id: number | null;
  scheduled_time: string | null;
  team1_id: number | null;
  team2_id: number | null;
  team1_name: string | null;
  team2_name: string | null;
  score_team1: string | null;
  score_team2: string | null;
  winner_id: number | null;
  winner_name: string | null;
  status: string;
  notes: string | null;
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
    booking_source?: string;
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

  blockSlot: (data: {
    court_id: number;
    date: string;
    start_time: string;
    end_time: string;
    notes?: string;
  }) =>
    request<{ id: number; status: string; amount: number }>("/api/v1/bookings/block", {
      method: "POST",
      body: JSON.stringify({ ...data, booking_type: "blocked" }),
    }),

  unblockSlot: (bookingId: number) =>
    request<{ id: number; status: string }>(`/api/v1/bookings/block/${bookingId}`, {
      method: "DELETE",
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

  getDues: () =>
    request<{ items: DueItem[]; total_due: number; count: number }>("/api/v1/dashboard/dues"),

  getCollections: (days?: number) =>
    request<{ items: { method: string; count: number; total: number }[]; grand_total: number; days: number }>(
      `/api/v1/dashboard/collections${days ? `?days=${days}` : ""}`,
    ),

  getHourlyUtilization: (days?: number) =>
    request<HourlyUtilization[]>(
      `/api/v1/dashboard/utilization/hourly${days ? `?days=${days}` : ""}`,
    ),

  // Equipment
  getEquipment: (params?: { branch_id?: number; category?: string; is_rentable?: boolean; condition?: string; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.branch_id) qs.set("branch_id", String(params.branch_id));
    if (params?.category) qs.set("category", params.category);
    if (params?.is_rentable !== undefined) qs.set("is_rentable", String(params.is_rentable));
    if (params?.condition) qs.set("condition", params.condition);
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.offset) qs.set("offset", String(params.offset));
    const q = qs.toString();
    return request<{ items: Equipment[]; total: number }>(`/api/v1/equipment${q ? `?${q}` : ""}`);
  },

  getEquipmentCategories: () =>
    request<string[]>("/api/v1/equipment/categories"),

  createEquipment: (data: {
    branch_id?: number;
    name: string;
    category: string;
    brand?: string;
    total_quantity: number;
    available_quantity?: number;
    condition?: string;
    rental_rate?: number;
    is_rentable?: boolean;
    notes?: string;
  }) =>
    request<Equipment>("/api/v1/equipment", { method: "POST", body: JSON.stringify(data) }),

  updateEquipment: (id: number, data: Partial<{
    branch_id: number;
    name: string;
    category: string;
    brand: string;
    total_quantity: number;
    available_quantity: number;
    condition: string;
    rental_rate: number;
    is_rentable: boolean;
    notes: string;
    is_active: boolean;
  }>) =>
    request<Equipment>(`/api/v1/equipment/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  deleteEquipment: (id: number) =>
    request<void>(`/api/v1/equipment/${id}`, { method: "DELETE" }),

  // Tournaments
  getTournaments: () =>
    request<Tournament[]>("/api/v1/tournaments"),

  createTournament: (data: {
    name: string;
    sport: string;
    format?: string;
    start_date: string;
    end_date?: string;
    registration_deadline?: string;
    max_teams?: number;
    entry_fee?: number;
    prize_pool?: string;
    rules?: string;
    description?: string;
    contact_phone?: string;
    is_public?: boolean;
  }) =>
    request<Tournament>("/api/v1/tournaments", { method: "POST", body: JSON.stringify(data) }),

  getTournament: (id: number) =>
    request<Tournament>(`/api/v1/tournaments/${id}`),

  updateTournament: (id: number, data: Partial<{
    name: string;
    sport: string;
    format: string;
    status: string;
    start_date: string;
    end_date: string;
    registration_deadline: string;
    max_teams: number;
    entry_fee: number;
    prize_pool: string;
    rules: string;
    description: string;
    contact_phone: string;
    is_public: boolean;
  }>) =>
    request<Tournament>(`/api/v1/tournaments/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  deleteTournament: (id: number) =>
    request<void>(`/api/v1/tournaments/${id}`, { method: "DELETE" }),

  getTournamentTeams: (tournamentId: number) =>
    request<TournamentTeam[]>(`/api/v1/tournaments/${tournamentId}/teams`),

  registerTeam: (tournamentId: number, data: {
    team_name: string;
    player1_name: string;
    player1_phone?: string;
    player1_email?: string;
    player2_name?: string;
    player2_phone?: string;
  }) =>
    request<TournamentTeam>(`/api/v1/tournaments/${tournamentId}/teams`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  withdrawTeam: (tournamentId: number, teamId: number) =>
    request<void>(`/api/v1/tournaments/${tournamentId}/teams/${teamId}`, { method: "DELETE" }),

  getTournamentMatches: (tournamentId: number) =>
    request<TournamentMatch[]>(`/api/v1/tournaments/${tournamentId}/matches`),

  generateBracket: (tournamentId: number) =>
    request<{ matches: TournamentMatch[]; status: string }>(`/api/v1/tournaments/${tournamentId}/bracket`, {
      method: "POST",
    }),

  updateMatch: (tournamentId: number, matchId: number, data: {
    score_team1?: string;
    score_team2?: string;
    winner_id?: number;
    status?: string;
    notes?: string;
  }) =>
    request<TournamentMatch>(`/api/v1/tournaments/${tournamentId}/matches/${matchId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Public tournament endpoints
  getPublicTournament: (id: number) =>
    request<Tournament>(`/api/v1/tournaments/public/${id}`),

  getPublicTournamentTeams: (id: number) =>
    request<TournamentTeam[]>(`/api/v1/tournaments/public/${id}/teams`),

  getPublicTournamentMatches: (id: number) =>
    request<TournamentMatch[]>(`/api/v1/tournaments/public/${id}/matches`),

  publicRegisterTeam: (tournamentId: number, data: {
    team_name: string;
    player1_name: string;
    player1_phone?: string;
    player1_email?: string;
    player2_name?: string;
    player2_phone?: string;
  }) =>
    request<TournamentTeam>(`/api/v1/tournaments/public/${tournamentId}/register`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
