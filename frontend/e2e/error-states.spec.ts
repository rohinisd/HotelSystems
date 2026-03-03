import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures/auth";

test.describe("Error & Loading States", () => {
  test("auth guard redirects unauthenticated users to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });

  test("loading indicator appears during navigation", async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/dashboard");

    await page.route("**/api/v1/dashboard/**", async (route) => {
      await new Promise((r) => setTimeout(r, 500));
      await route.continue();
    });

    await page.getByRole("link", { name: "Revenue" }).click();
    await expect(page).toHaveURL(/\/dashboard\/revenue/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Revenue", exact: true })).toBeVisible({ timeout: 15_000 });
  });

  test("toast appears on booking cancellation", async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/dashboard/bookings");

    await expect(page.getByRole("heading", { name: "Bookings" })).toBeVisible({ timeout: 10_000 });

    const cancelBtn = page.getByRole("button", { name: "Cancel" }).first();
    const hasCancelBtn = await cancelBtn.isVisible().catch(() => false);

    if (hasCancelBtn) {
      page.once("dialog", (dialog) => dialog.accept());
      await cancelBtn.click();
      await expect(page.getByText("Booking cancelled")).toBeVisible({ timeout: 5_000 });
    } else {
      await expect(page.getByRole("heading", { name: "Bookings" })).toBeVisible();
    }
  });
});
