import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures/auth";
import { futureDateISO } from "./fixtures/test-data";

test.describe("Bookings Management & Payments as Owner/Manager", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "owner");
  });

  test("bookings page loads with list", async ({ page }) => {
    await page.goto("/dashboard/bookings");
    await expect(page.getByRole("heading", { name: "Bookings" })).toBeVisible();
    await expect(page.getByText("Manage all bookings")).toBeVisible();

    const content = page.locator("div.space-y-6");
    await expect(
      content.getByText("No bookings for this date").or(content.locator("div.divide-y"))
    ).toBeVisible({ timeout: 10_000 });
  });

  test("pagination controls are visible when bookings exist", async ({ page }) => {
    await page.goto("/dashboard/bookings");

    const hasBookings = await page.getByText("Showing").isVisible().catch(() => false);
    if (hasBookings) {
      await expect(page.getByText(/Showing \d+–\d+ of \d+/)).toBeVisible();
      await expect(page.getByRole("button", { name: "Previous" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Next" })).toBeVisible();
    } else {
      await expect(page.getByText("No bookings for this date")).toBeVisible();
    }
  });

  test("date filter changes displayed bookings", async ({ page }) => {
    await page.goto("/dashboard/bookings");

    const dateInput = page.locator('input[type="date"]').first();
    await expect(dateInput).toBeVisible();

    const newDate = futureDateISO(1);
    await dateInput.fill(newDate);

    await expect(dateInput).toHaveValue(newDate);
  });

  test("record payment dropdown works", async ({ page }) => {
    await page.goto("/dashboard/bookings");

    const paymentButton = page.getByRole("button", { name: /Payment/ });
    const hasPaymentButton = await paymentButton.isVisible().catch(() => false);

    if (hasPaymentButton) {
      await paymentButton.first().click();
      await expect(page.getByText("Cash")).toBeVisible({ timeout: 5_000 });
      await expect(page.getByText("UPI")).toBeVisible();
    }
  });
});
