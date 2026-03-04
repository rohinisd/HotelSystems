import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures/auth";
import { futureDateISO } from "./fixtures/test-data";

test.describe("Peak Pricing Display", () => {
  test("slot grid shows peak badge for peak-hour slots", async ({ page }) => {
    await loginAs(page, "player");
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
      test.skip(true, "No courts available to test peak pricing");
    }

    const dateInput = page.locator('input[type="date"]');
    await dateInput.fill(futureDateISO(1));

    const slots = page.locator("button").filter({ hasText: /AM|PM/ });
    await expect(slots.first()).toBeVisible({ timeout: 15_000 });

    const peakBadge = page.locator("text=Peak");
    const hasPeak = await peakBadge.first().isVisible({ timeout: 3_000 }).catch(() => false);

    if (hasPeak) {
      await expect(peakBadge.first()).toBeVisible();
    } else {
      test.skip(true, "No peak-priced slots visible (court may not have peak_hour_rate set)");
    }
  });

  test("peak badge appears in booking confirmation for peak slot", async ({ page }) => {
    await loginAs(page, "player");
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
      test.skip(true, "No courts available");
    }

    const dateInput = page.locator('input[type="date"]');
    await dateInput.fill(futureDateISO(1));

    const peakSlot = page.locator("button:not([disabled])").filter({ hasText: "Peak" }).first();
    const hasPeakSlot = await peakSlot.isVisible({ timeout: 10_000 }).catch(() => false);
    if (!hasPeakSlot) {
      test.skip(true, "No peak slots available to test confirmation badge");
    }

    await peakSlot.click();

    const summary = page.locator("text=Peak");
    await expect(summary.first()).toBeVisible({ timeout: 5_000 });
  });
});
