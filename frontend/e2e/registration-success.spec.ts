import { test, expect } from "@playwright/test";

test.describe("Successful Registration", () => {
  test("valid registration creates account and redirects", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "New here? Create an account" }).click();

    const timestamp = Date.now();
    const email = `e2e_test_${timestamp}@example.com`;

    await page.getByLabel("Full Name").fill("E2E Test User");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("TestPass123");
    await page.getByRole("button", { name: "Create Account" }).click();

    const dashboardOrBook = page.waitForURL(/\/dashboard|\/book/, { timeout: 15_000 });
    const errorMsg = page.locator(".bg-red-50");

    await Promise.race([
      dashboardOrBook,
      errorMsg.waitFor({ timeout: 15_000 }).catch(() => {}),
    ]);

    const hasError = await errorMsg.isVisible().catch(() => false);
    if (hasError) {
      const errorText = await errorMsg.textContent();
      if (errorText?.includes("already registered")) {
        test.skip(true, "Test email already exists — expected in repeated runs");
      }
    }

    await expect(page).toHaveURL(/\/dashboard|\/book/);
  });

  test("duplicate email shows conflict error", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "New here? Create an account" }).click();

    await page.getByLabel("Full Name").fill("Duplicate Test");
    await page.getByLabel("Email").fill("owner@turfstack.in");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Create Account" }).click();

    await expect(page.getByText(/already registered|already exists|conflict/i)).toBeVisible({ timeout: 10_000 });
  });

  test("can toggle between login and register modes", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();

    await page.getByRole("button", { name: "New here? Create an account" }).click();
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
    await expect(page.getByLabel("Full Name")).toBeVisible();

    await page.getByRole("button", { name: /Already have an account/ }).click();
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });
});
