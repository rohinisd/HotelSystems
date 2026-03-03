import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/lib/api", () => ({
  api: {
    login: vi.fn(),
    register: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  setAuth: vi.fn(),
  getToken: vi.fn(() => null),
  getRole: vi.fn(() => null),
  getFacilityId: vi.fn(() => null),
  clearAuth: vi.fn(),
  isAuthenticated: vi.fn(() => false),
}));

import LoginPage from "@/app/login/page";
import { AuthProvider } from "@/lib/auth-context";

function renderWithAuth(ui: React.ReactElement) {
  return render(<AuthProvider>{ui}</AuthProvider>);
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the login form", () => {
    renderWithAuth(<LoginPage />);
    expect(screen.getByText("Welcome back")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });

  it("fills demo credentials on click", () => {
    renderWithAuth(<LoginPage />);
    fireEvent.click(screen.getByText(/Try demo account/));
    const emailInput = screen.getByLabelText("Email") as HTMLInputElement;
    expect(emailInput.value).toBe("owner@turfstack.in");
  });

  it("toggles to register mode", () => {
    renderWithAuth(<LoginPage />);
    fireEvent.click(screen.getByText(/New here/));
    expect(screen.getByText("Create your account")).toBeInTheDocument();
    expect(screen.getByLabelText("Full Name")).toBeInTheDocument();
  });

  it("shows validation errors on register with short password", () => {
    renderWithAuth(<LoginPage />);
    fireEvent.click(screen.getByText(/New here/));

    fireEvent.change(screen.getByLabelText("Full Name"), { target: { value: "Test" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "12345" } });

    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));
    expect(screen.getByText("Password must be at least 6 characters")).toBeInTheDocument();
  });

  it("shows phone validation error for invalid format", () => {
    renderWithAuth(<LoginPage />);
    fireEvent.click(screen.getByText(/New here/));

    fireEvent.change(screen.getByLabelText("Full Name"), { target: { value: "Test User" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText("Phone"), { target: { value: "123" } });

    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));
    expect(screen.getByText("Enter a valid 10-digit phone number")).toBeInTheDocument();
  });

  it("shows password strength indicator during registration", () => {
    renderWithAuth(<LoginPage />);
    fireEvent.click(screen.getByText(/New here/));
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "strongpassword" } });
    expect(screen.getByText("Strong")).toBeInTheDocument();
  });
});
