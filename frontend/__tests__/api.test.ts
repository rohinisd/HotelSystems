import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.stubGlobal("localStorage", {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
});

describe("API client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("exports api object with expected methods", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ status: "healthy" }),
    });

    const { api } = await import("@/lib/api");

    expect(api).toBeDefined();
    expect(typeof api.login).toBe("function");
    expect(typeof api.register).toBe("function");
    expect(typeof api.getMe).toBe("function");
    expect(typeof api.updateMe).toBe("function");
    expect(typeof api.getCourts).toBe("function");
    expect(typeof api.getBookings).toBe("function");
    expect(typeof api.getTeam).toBe("function");
    expect(typeof api.inviteUser).toBe("function");
    expect(typeof api.getDashboardKPIs).toBe("function");
    expect(typeof api.health).toBe("function");
  });

  it("attaches auth header when token exists", async () => {
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue("test-token");
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ status: "healthy" }),
    });

    const { api } = await import("@/lib/api");
    await api.health();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/health"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      }),
    );
  });
});
