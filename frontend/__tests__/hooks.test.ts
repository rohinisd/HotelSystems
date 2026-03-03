import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  api: {
    getCourts: vi.fn(),
    createCourt: vi.fn(),
    updateCourt: vi.fn(),
    getBookings: vi.fn(),
    createBooking: vi.fn(),
    cancelBooking: vi.fn(),
    getDashboardKPIs: vi.fn(),
    getRevenueTrend: vi.fn(),
    getUtilization: vi.fn(),
  },
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(({ queryKey, queryFn }) => ({
    queryKey,
    queryFn,
    data: undefined,
    isLoading: true,
    error: null,
  })),
  useMutation: vi.fn(({ mutationFn }) => ({
    mutate: mutationFn,
    isLoading: false,
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
  })),
}));

describe("courts hooks", () => {
  it("courtsKeys.all is ['courts']", async () => {
    const { courtsKeys } = await import("@/lib/hooks/use-courts");
    expect(courtsKeys.all).toEqual(["courts"]);
  });

  it("courtsKeys.list includes branchId", async () => {
    const { courtsKeys } = await import("@/lib/hooks/use-courts");
    expect(courtsKeys.list(5)).toEqual(["courts", 5]);
  });

  it("courtsKeys.list without branchId", async () => {
    const { courtsKeys } = await import("@/lib/hooks/use-courts");
    expect(courtsKeys.list()).toEqual(["courts", undefined]);
  });

  it("useCourts calls useQuery with correct key", async () => {
    const { useCourts } = await import("@/lib/hooks/use-courts");
    const result = useCourts(3);
    expect(result.queryKey).toEqual(["courts", 3]);
    expect(result.isLoading).toBe(true);
  });

  it("useCreateCourt returns mutation", async () => {
    const { useCreateCourt } = await import("@/lib/hooks/use-courts");
    const result = useCreateCourt();
    expect(result.mutate).toBeDefined();
  });

  it("useUpdateCourt returns mutation", async () => {
    const { useUpdateCourt } = await import("@/lib/hooks/use-courts");
    const result = useUpdateCourt();
    expect(result.mutate).toBeDefined();
  });
});

describe("bookings hooks", () => {
  it("bookingsKeys.all is ['bookings']", async () => {
    const { bookingsKeys } = await import("@/lib/hooks/use-bookings");
    expect(bookingsKeys.all).toEqual(["bookings"]);
  });

  it("bookingsKeys.list includes params", async () => {
    const { bookingsKeys } = await import("@/lib/hooks/use-bookings");
    const params = { date: "2025-03-15", status: "confirmed" };
    expect(bookingsKeys.list(params)).toEqual(["bookings", params]);
  });

  it("useBookings calls useQuery with correct key", async () => {
    const { useBookings } = await import("@/lib/hooks/use-bookings");
    const params = { limit: 10 };
    const result = useBookings(params);
    expect(result.queryKey).toEqual(["bookings", params]);
  });

  it("useCreateBooking returns mutation", async () => {
    const { useCreateBooking } = await import("@/lib/hooks/use-bookings");
    const result = useCreateBooking();
    expect(result.mutate).toBeDefined();
  });

  it("useCancelBooking returns mutation", async () => {
    const { useCancelBooking } = await import("@/lib/hooks/use-bookings");
    const result = useCancelBooking();
    expect(result.mutate).toBeDefined();
  });
});

describe("dashboard hooks", () => {
  it("dashboardKeys.all is ['dashboard']", async () => {
    const { dashboardKeys } = await import("@/lib/hooks/use-dashboard");
    expect(dashboardKeys.all).toEqual(["dashboard"]);
  });

  it("dashboardKeys.kpis includes 'kpis' segment", async () => {
    const { dashboardKeys } = await import("@/lib/hooks/use-dashboard");
    expect(dashboardKeys.kpis()).toEqual(["dashboard", "kpis"]);
  });

  it("dashboardKeys.revenueTrend includes days", async () => {
    const { dashboardKeys } = await import("@/lib/hooks/use-dashboard");
    expect(dashboardKeys.revenueTrend(30)).toEqual([
      "dashboard",
      "revenue-trend",
      30,
    ]);
  });

  it("dashboardKeys.utilization", async () => {
    const { dashboardKeys } = await import("@/lib/hooks/use-dashboard");
    expect(dashboardKeys.utilization()).toEqual(["dashboard", "utilization"]);
  });

  it("useDashboardKPIs calls useQuery", async () => {
    const { useDashboardKPIs } = await import("@/lib/hooks/use-dashboard");
    const result = useDashboardKPIs();
    expect(result.queryKey).toEqual(["dashboard", "kpis"]);
    expect(result.isLoading).toBe(true);
  });

  it("useRevenueTrend calls useQuery with days", async () => {
    const { useRevenueTrend } = await import("@/lib/hooks/use-dashboard");
    const result = useRevenueTrend(14);
    expect(result.queryKey).toEqual(["dashboard", "revenue-trend", 14]);
  });

  it("useUtilization calls useQuery", async () => {
    const { useUtilization } = await import("@/lib/hooks/use-dashboard");
    const result = useUtilization();
    expect(result.queryKey).toEqual(["dashboard", "utilization"]);
  });
});
