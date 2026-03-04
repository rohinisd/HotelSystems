import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures/auth";
import { futureDateISO } from "./fixtures/test-data";

test.describe("Booking Source in Walk-in Flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "staff");
  });

  test("staff sees booking source dropdown after selecting slot", async ({ page }) => {
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
      test.skip(true, "No courts available to test booking source");
    }

    const dateInput = page.locator('input[type="date"]');
    await dateInput.fill(futureDateISO(5));

    const availableSlot = page.locator("button:not([disabled])").filter({ hasText: /AM|PM/ }).first();
    const hasSlot = await availableSlot.isVisible({ timeout: 15_000 }).catch(() => false);
    if (!hasSlot) {
      test.skip(true, "No available slots");
    }

    await availableSlot.click();

    const sourceSelect = page.locator("select").filter({ hasText: /TurfStack/ });
    await expect(sourceSelect).toBeVisible({ timeout: 5_000 });
  });

  test("booking source dropdown has all expected options", async ({ page }) => {
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
    await dateInput.fill(futureDateISO(5));

    const availableSlot = page.locator("button:not([disabled])").filter({ hasText: /AM|PM/ }).first();
    const hasSlot = await availableSlot.isVisible({ timeout: 15_000 }).catch(() => false);
    if (!hasSlot) {
      test.skip(true, "No available slots");
    }

    await availableSlot.click();

    const sourceSelect = page.locator("select").filter({ hasText: /TurfStack/ });
    await expect(sourceSelect).toBeVisible({ timeout: 5_000 });

    const options = sourceSelect.locator("option");
    const optionTexts = await options.allTextContents();
    expect(optionTexts).toContain("TurfStack");
    expect(optionTexts).toContain("Hudle");
    expect(optionTexts).toContain("Playo");
    expect(optionTexts).toContain("KheloMore");
  });

  test("player does not see booking source dropdown", async ({ page }) => {
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
    await dateInput.fill(futureDateISO(5));

    const availableSlot = page.locator("button:not([disabled])").filter({ hasText: /AM|PM/ }).first();
    const hasSlot = await availableSlot.isVisible({ timeout: 15_000 }).catch(() => false);
    if (!hasSlot) {
      test.skip(true, "No available slots");
    }

    await availableSlot.click();

    const sourceSelect = page.locator("select").filter({ hasText: /TurfStack/ });
    await expect(sourceSelect).not.toBeVisible({ timeout: 3_000 });
  });
});
