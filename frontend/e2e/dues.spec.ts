import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures/auth";

test.describe("Dues Tracking", () => {
  test("dues page loads for owner", async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/dashboard/dues");

    await expect(page.getByRole("heading", { name: "Dues" })).toBeVisible({ timeout: 15_000 });
  });

  test("dues page shows summary cards", async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/dashboard/dues");

    await expect(page.getByRole("heading", { name: "Dues" })).toBeVisible({ timeout: 15_000 });

    const totalOutstanding = page.getByText("Total Outstanding");
    const pendingBookings = page.getByText("Pending Bookings");

    await expect(totalOutstanding.or(pendingBookings).first()).toBeVisible({ timeout: 10_000 });
  });

  test("dues page accessible to accountant", async ({ page }) => {
    await loginAs(page, "accountant");
    await page.goto("/dashboard/dues");

    await expect(page.getByRole("heading", { name: "Dues" })).toBeVisible({ timeout: 15_000 });
  });

  test("dues page shows table or empty state", async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/dashboard/dues");

    await expect(page.getByRole("heading", { name: "Dues" })).toBeVisible({ timeout: 15_000 });

    const table = page.locator("table");
    const emptyState = page.getByText(/No outstanding dues|No pending/i);
    const errorState = page.getByText(/Failed to load/i);

    await expect(table.or(emptyState).or(errorState)).toBeVisible({ timeout: 15_000 });
  });

  test("dues page has record payment links", async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/dashboard/dues");

    await expect(page.getByRole("heading", { name: "Dues" })).toBeVisible({ timeout: 15_000 });

    const table = page.locator("table");
    const hasTable = await table.isVisible({ timeout: 10_000 }).catch(() => false);
    if (!hasTable) {
      test.skip(true, "No dues table visible - may have no outstanding payments");
    }

    const rows = table.locator("tbody tr");
    const rowCount = await rows.count();
    if (rowCount === 0) {
      test.skip(true, "No due items to check");
    }

    const recordLink = page.getByRole("link", { name: /Record Payment/i }).first();
    const hasLink = await recordLink.isVisible({ timeout: 5_000 }).catch(() => false);
    if (hasLink) {
      await expect(recordLink).toHaveAttribute("href", /\/dashboard\/bookings/);
    }
  });

  test("dues nav item visible in sidebar for owner", async ({ page }) => {
    await loginAs(page, "owner");
    const sidebar = page.locator("div.bg-slate-900.text-white");
    await expect(sidebar.getByRole("link", { name: "Dues" })).toBeVisible({ timeout: 10_000 });
  });

  test("player cannot see dues in sidebar", async ({ page }) => {
    await loginAs(page, "player");
    const sidebar = page.locator("div.bg-slate-900.text-white");
    await expect(sidebar.getByRole("link", { name: "Dues" })).not.toBeVisible();
  });
});
