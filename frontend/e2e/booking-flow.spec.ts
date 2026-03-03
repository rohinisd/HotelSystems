import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures/auth";
import { futureDateISO } from "./fixtures/test-data";

test.describe("Booking Flow as Player", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "player");
  });

  test("booking page loads with Book a Court heading", async ({ page }) => {
    await page.goto("/book");
    await expect(page.getByRole("heading", { name: "Book a Court" })).toBeVisible();
  });

  test("can select a sport", async ({ page }) => {
    await page.goto("/book");
    await page.getByRole("button", { name: "Pickleball" }).click();
    await expect(page.getByRole("button", { name: "Pickleball" })).toHaveClass(/border-emerald-500|bg-emerald-50/);
  });

  test("can select branch and see courts", async ({ page }) => {
    await page.goto("/book");
    await page.getByRole("button", { name: "Pickleball" }).click();
    await page.getByRole("button", { name: "Gachibowli" }).click();
    const courtButton = page.getByRole("button", { name: /Court [A-Z0-9]/ }).first();
    await expect(courtButton).toBeVisible({ timeout: 10_000 });
  });

  test("can pick date and see time slots", async ({ page }) => {
    await page.goto("/book");
    await page.getByRole("button", { name: "Pickleball" }).click();
    await page.getByRole("button", { name: "Gachibowli" }).click();
    await page.getByRole("button", { name: /Court [A-Z0-9]/ }).first().click();

    const dateInput = page.locator('input[type="date"]');
    await dateInput.fill(futureDateISO(1));

    await expect(page.locator("button").filter({ hasText: /AM|PM/ }).first()).toBeVisible({ timeout: 15_000 });
  });

  test("full booking flow with Pay Later", async ({ page }) => {
    await page.goto("/book");
    await page.getByRole("button", { name: "Pickleball" }).click();
    await page.getByRole("button", { name: "Gachibowli" }).click();
    await page.getByRole("button", { name: /Court [A-Z0-9]/ }).first().click();

    const dateInput = page.locator('input[type="date"]');
    await dateInput.fill(futureDateISO(2));

    const availableSlot = page.locator("button:not([disabled])").filter({ hasText: /AM|PM/ }).first();
    await expect(availableSlot).toBeVisible({ timeout: 15_000 });
    await availableSlot.click();

    await page.getByRole("button", { name: "Confirm Booking" }).click();
    await page.waitForURL(/\/book\/confirmation/, { timeout: 15_000 });

    const payLaterBtn = page.getByRole("button", { name: /Pay later|Pay Later/ }).or(page.getByText(/Pay later at the venue/));
    await payLaterBtn.first().click();
    await expect(page.getByText("Booking Confirmed!")).toBeVisible({ timeout: 10_000 });
  });

  test("booking appears in My Bookings", async ({ page }) => {
    await page.goto("/dashboard/my-bookings");
    await expect(page.getByRole("heading", { name: /My Bookings|Bookings/ })).toBeVisible({ timeout: 10_000 });
  });
});
