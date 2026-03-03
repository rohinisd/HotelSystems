import { test, expect } from "@playwright/test";
import { loginAs, logout } from "./fixtures/auth";

test.describe("Landing Page & Auth", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("landing page loads with TurfStack branding", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Book courts.");
    await expect(page.getByRole("navigation").getByText("Sign In")).toBeVisible();
    await expect(page.getByRole("navigation").getByText("Book a Court")).toBeVisible();
    await expect(page.getByText("TurfStack", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("contentinfo").or(page.locator("footer")).getByText(/TurfStack/)).toBeVisible();
  });

  test("Sign In nav link navigates to /login", async ({ page }) => {
    await page.getByRole("link", { name: "Sign In" }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("Book a Court nav link navigates to /book", async ({ page }) => {
    await page.getByRole("link", { name: "Book a Court" }).first().click();
    await expect(page).toHaveURL(/\/book/);
  });

  test("demo button auto-fills owner credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Try demo account/ }).click();
    await expect(page.getByLabel("Email")).toHaveValue("owner@turfstack.in");
  });

  test("login as owner shows dashboard with Owner badge in topbar", async ({ page }) => {
    await loginAs(page, "owner");
    await expect(page.getByText("Owner").first()).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("logout redirects to login page", async ({ page }) => {
    await loginAs(page, "owner");
    await logout(page);
    await expect(page).toHaveURL(/\/login/);
  });
});
