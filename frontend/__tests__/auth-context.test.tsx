import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/lib/auth-context";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

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

function TestConsumer() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="authenticated">{String(auth.isAuthenticated)}</span>
      <span data-testid="role">{auth.role ?? "null"}</span>
      <span data-testid="facilityId">{auth.facilityId ?? "null"}</span>
      <span data-testid="initialized">{String(auth.initialized)}</span>
      <button onClick={() => auth.login("test-token", "owner", 1)}>login</button>
      <button onClick={auth.logout}>logout</button>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
    vi.clearAllMocks();
  });

  it("initializes as unauthenticated when no token", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );
    expect(screen.getByTestId("authenticated").textContent).toBe("false");
    expect(screen.getByTestId("initialized").textContent).toBe("true");
  });

  it("initializes as authenticated when valid token exists", () => {
    const payload = {
      sub: "1",
      email: "test@test.com",
      role: "owner",
      facility_id: 1,
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    store["sfms_token"] = `h.${btoa(JSON.stringify(payload))}.s`;
    store["sfms_role"] = "owner";
    store["sfms_facility_id"] = "1";

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );
    expect(screen.getByTestId("authenticated").textContent).toBe("true");
    expect(screen.getByTestId("role").textContent).toBe("owner");
    expect(screen.getByTestId("facilityId").textContent).toBe("1");
  });

  it("login updates auth state", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    act(() => {
      screen.getByText("login").click();
    });

    expect(screen.getByTestId("authenticated").textContent).toBe("true");
    expect(screen.getByTestId("role").textContent).toBe("owner");
    expect(screen.getByTestId("facilityId").textContent).toBe("1");
  });

  it("logout clears auth state", () => {
    const payload = {
      sub: "1",
      email: "test@test.com",
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    store["sfms_token"] = `h.${btoa(JSON.stringify(payload))}.s`;
    store["sfms_role"] = "owner";

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    act(() => {
      screen.getByText("logout").click();
    });

    expect(screen.getByTestId("authenticated").textContent).toBe("false");
    expect(screen.getByTestId("role").textContent).toBe("null");
  });
});

describe("useAuth", () => {
  it("throws when used outside AuthProvider", () => {
    function Orphan() {
      useAuth();
      return null;
    }

    expect(() => render(<Orphan />)).toThrow(
      "useAuth must be used within AuthProvider",
    );
  });
});
