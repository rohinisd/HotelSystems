import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures/auth";

test.describe("Schedule View", () => {
  test("schedule page loads with timeline grid", async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/dashboard/schedule");

    await expect(page.getByRole("heading", { name: "Schedule" })).toBeVisible();

    const table = page.locator("table");
    const noCourtMsg = page.getByText("No courts found");

    await expect(table.or(noCourtMsg)).toBeVisible({ timeout: 20_000 });

    if (await table.isVisible()) {
      await expect(page.locator("th").filter({ hasText: "Court" })).toBeVisible();
    }
  });

  test("date navigation works", async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/dashboard/schedule");

    const dateInput = page.locator('input[type="date"]');
    await expect(dateInput).toBeVisible({ timeout: 10_000 });
    const initialDate = await dateInput.inputValue();

    const todayButton = page.getByRole("button", { name: "Today" });
    if (await todayButton.isVisible().catch(() => false)) {
      await todayButton.click();
    }

    const dateControls = page.locator("div.flex").filter({ has: dateInput });
    const prevButton = dateControls.locator("button").first();
    const nextButton = dateControls.locator("button").nth(1);

    await nextButton.click();
    const dateAfterNext = await dateInput.inputValue();

    await prevButton.click();
    const dateAfterPrev = await dateInput.inputValue();

    expect(dateAfterNext).not.toBe(initialDate);
    expect(dateAfterPrev).toBe(initialDate);
  });

  test("schedule is accessible to staff role", async ({ page }) => {
    await loginAs(page, "staff");
    await page.goto("/dashboard/schedule");

    await expect(page.getByRole("heading", { name: "Schedule" })).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/dashboard\/schedule/);
  });
});
