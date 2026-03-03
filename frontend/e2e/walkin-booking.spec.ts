import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures/auth";
import { futureDateISO } from "./fixtures/test-data";

test.describe("Walk-in Booking as Staff", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "staff");
  });

  test("staff sees Walk-in Booking heading on /book", async ({ page }) => {
    await page.goto("/book");
    await expect(page.getByRole("heading", { name: "Walk-in Booking" })).toBeVisible();
  });

  test("staff can navigate to booking from sidebar", async ({ page }) => {
    await page.goto("/dashboard");
    const sidebar = page.getByRole("navigation");
    const walkinLink = sidebar.getByRole("link", { name: "Walk-in Booking" });
    await expect(walkinLink).toBeVisible({ timeout: 10_000 });
    await walkinLink.click();
    await expect(page).toHaveURL(/\/book/);
  });

  test("staff sees player detail fields after selecting slot", async ({ page }) => {
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
      test.skip(true, "No pickleball courts available for walk-in test");
    }

    const dateInput = page.locator('input[type="date"]');
    await dateInput.fill(futureDateISO(3));

    const availableSlot = page.locator("button:not([disabled])").filter({ hasText: /AM|PM/ }).first();
    const hasSlot = await availableSlot.isVisible({ timeout: 15_000 }).catch(() => false);
    if (!hasSlot) {
      test.skip(true, "No available slots for walk-in test");
    }

    await availableSlot.click();

    await expect(page.getByRole("heading", { name: /Player Details/ })).toBeVisible();
    await expect(page.getByPlaceholder("Player name")).toBeVisible();
    await expect(page.getByPlaceholder("Phone number")).toBeVisible();
  });

  test("full walk-in booking flow with Pay Later", async ({ page }) => {
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
      test.skip(true, "No pickleball courts available for walk-in flow");
    }

    const dateInput = page.locator('input[type="date"]');
    await dateInput.fill(futureDateISO(4));

    const availableSlot = page.locator("button:not([disabled])").filter({ hasText: /AM|PM/ }).first();
    const hasSlot = await availableSlot.isVisible({ timeout: 15_000 }).catch(() => false);
    if (!hasSlot) {
      test.skip(true, "No available slots for walk-in flow");
    }

    await availableSlot.click();

    await page.getByPlaceholder("Player name").fill("Walk-in Player E2E");
    await page.getByPlaceholder("Phone number").fill("9876543210");

    await page.getByRole("button", { name: "Confirm Booking" }).click();
    await page.waitForURL(/\/book\/confirmation/, { timeout: 15_000 });

    const payLaterBtn = page.getByRole("button", { name: /Pay later|Pay Later/ }).or(page.getByText(/Pay later at the venue/));
    await payLaterBtn.first().click();
    await expect(page.getByText("Booking Confirmed!")).toBeVisible({ timeout: 10_000 });
  });
});
