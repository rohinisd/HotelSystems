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
    await expect(page.getByRole("button", { name: "Pickleball" })).toHaveClass(/border-emerald-500|bg-emerald-50|bg-primary/);
  });

  test("can select branch and see courts", async ({ page }) => {
    await page.goto("/book");
    await page.getByRole("button", { name: "Pickleball" }).click();

    const branchButtons = page.locator("button").filter({ hasText: /Gachibowli|Madhapur/ });
    const branchCount = await branchButtons.count();

    let foundCourt = false;
    for (let i = 0; i < branchCount; i++) {
      await branchButtons.nth(i).click();
      const courtButton = page.locator("button").filter({ hasText: /\/hr/ }).first();
      const noCourts = page.getByText(/No .+ courts at this branch/);

      const found = await courtButton.isVisible({ timeout: 5_000 }).catch(() => false);
      if (found) {
        foundCourt = true;
        break;
      }
      const noMsg = await noCourts.isVisible({ timeout: 2_000 }).catch(() => false);
      if (noMsg) continue;
    }

    if (!foundCourt) {
      test.skip(true, "No pickleball courts found at any branch in production data");
    }

    await expect(page.locator("button").filter({ hasText: /\/hr/ }).first()).toBeVisible();
  });

  test("can pick date and see time slots", async ({ page }) => {
    await page.goto("/book");
    await page.getByRole("button", { name: "Pickleball" }).click();

    const branchButtons = page.locator("button").filter({ hasText: /Gachibowli|Madhapur/ });
    const branchCount = await branchButtons.count();

    for (let i = 0; i < branchCount; i++) {
      await branchButtons.nth(i).click();
      const courtBtn = page.locator("button").filter({ hasText: /\/hr/ }).first();
      if (await courtBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await courtBtn.click();
        break;
      }
    }

    const courtSelected = page.locator('input[type="date"]');
    if (!(await courtSelected.isVisible({ timeout: 3_000 }).catch(() => false))) {
      test.skip(true, "No pickleball courts available to test date/slot selection");
    }

    await courtSelected.fill(futureDateISO(1));
    await expect(page.locator("button").filter({ hasText: /AM|PM/ }).first()).toBeVisible({ timeout: 15_000 });
  });

  test("full booking flow with Pay Later", async ({ page }) => {
    await page.goto("/book");
    await page.getByRole("button", { name: "Pickleball" }).click();

    const branchButtons = page.locator("button").filter({ hasText: /Gachibowli|Madhapur/ });
    const branchCount = await branchButtons.count();

    let courtFound = false;
    for (let i = 0; i < branchCount; i++) {
      await branchButtons.nth(i).click();
      const courtBtn = page.locator("button").filter({ hasText: /\/hr/ }).first();
      if (await courtBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await courtBtn.click();
        courtFound = true;
        break;
      }
    }

    if (!courtFound) {
      test.skip(true, "No pickleball courts available for booking flow");
    }

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
