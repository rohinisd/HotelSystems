import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

describe("Landing page", () => {
  it("renders the TurfStack branding", () => {
    render(<Home />);
    expect(screen.getAllByText("TurfStack").length).toBeGreaterThan(0);
  });

  it("renders call-to-action buttons", () => {
    render(<Home />);
    expect(screen.getAllByText(/Book a Court/).length).toBeGreaterThan(0);
    expect(screen.getByText("Facility Login")).toBeInTheDocument();
  });

  it("renders all feature cards", () => {
    render(<Home />);
    expect(screen.getByText("Instant Booking")).toBeInTheDocument();
    expect(screen.getByText("Revenue Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Smart Pricing")).toBeInTheDocument();
    expect(screen.getByText("No Double-Bookings")).toBeInTheDocument();
  });

  it("renders footer with copyright", () => {
    render(<Home />);
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });
});
