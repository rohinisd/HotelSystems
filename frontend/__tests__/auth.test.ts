import { describe, it, expect, vi, beforeEach } from "vitest";

const store: Record<string, string> = {};

vi.stubGlobal("localStorage", {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete store[key];
  }),
});

describe("auth utilities", () => {
  beforeEach(() => {
    vi.resetModules();
    Object.keys(store).forEach((k) => delete store[k]);
    vi.clearAllMocks();
  });

  it("setAuth stores token, role, and facilityId", async () => {
    const { setAuth } = await import("@/lib/auth");
    setAuth("my-token", "owner", 42);
    expect(localStorage.setItem).toHaveBeenCalledWith("sfms_token", "my-token");
    expect(localStorage.setItem).toHaveBeenCalledWith("sfms_role", "owner");
    expect(localStorage.setItem).toHaveBeenCalledWith("sfms_facility_id", "42");
  });

  it("setAuth skips facilityId when null", async () => {
    const { setAuth } = await import("@/lib/auth");
    setAuth("my-token", "player", null);
    expect(localStorage.setItem).toHaveBeenCalledWith("sfms_token", "my-token");
    expect(localStorage.setItem).toHaveBeenCalledWith("sfms_role", "player");
    expect(localStorage.setItem).not.toHaveBeenCalledWith(
      "sfms_facility_id",
      expect.anything(),
    );
  });

  it("getToken returns token from localStorage", async () => {
    store["sfms_token"] = "stored-token";
    const { getToken } = await import("@/lib/auth");
    expect(getToken()).toBe("stored-token");
  });

  it("getToken returns null when no token", async () => {
    const { getToken } = await import("@/lib/auth");
    expect(getToken()).toBeNull();
  });

  it("getRole returns role from localStorage", async () => {
    store["sfms_role"] = "manager";
    const { getRole } = await import("@/lib/auth");
    expect(getRole()).toBe("manager");
  });

  it("getFacilityId returns parsed number", async () => {
    store["sfms_facility_id"] = "7";
    const { getFacilityId } = await import("@/lib/auth");
    expect(getFacilityId()).toBe(7);
  });

  it("getFacilityId returns null when empty", async () => {
    const { getFacilityId } = await import("@/lib/auth");
    expect(getFacilityId()).toBeNull();
  });

  it("clearAuth removes all auth keys", async () => {
    store["sfms_token"] = "t";
    store["sfms_role"] = "r";
    store["sfms_facility_id"] = "1";
    const { clearAuth } = await import("@/lib/auth");
    clearAuth();
    expect(localStorage.removeItem).toHaveBeenCalledWith("sfms_token");
    expect(localStorage.removeItem).toHaveBeenCalledWith("sfms_role");
    expect(localStorage.removeItem).toHaveBeenCalledWith("sfms_facility_id");
  });

  it("isAuthenticated returns false when no token", async () => {
    const { isAuthenticated } = await import("@/lib/auth");
    expect(isAuthenticated()).toBe(false);
  });

  it("isAuthenticated returns true for valid non-expired token", async () => {
    const payload = { sub: "1", exp: Math.floor(Date.now() / 1000) + 3600 };
    const fakeToken = `header.${btoa(JSON.stringify(payload))}.sig`;
    store["sfms_token"] = fakeToken;
    const { isAuthenticated } = await import("@/lib/auth");
    expect(isAuthenticated()).toBe(true);
  });

  it("isAuthenticated returns false for expired token", async () => {
    const payload = { sub: "1", exp: Math.floor(Date.now() / 1000) - 3600 };
    const fakeToken = `header.${btoa(JSON.stringify(payload))}.sig`;
    store["sfms_token"] = fakeToken;
    const { isAuthenticated } = await import("@/lib/auth");
    expect(isAuthenticated()).toBe(false);
  });

  it("isAuthenticated returns false for malformed token", async () => {
    store["sfms_token"] = "not-a-jwt";
    const { isAuthenticated } = await import("@/lib/auth");
    expect(isAuthenticated()).toBe(false);
  });
});
