import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures/auth";

test.describe("Slot Blocking on Schedule", () => {
  test("schedule shows blocked legend entry", async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/dashboard/schedule");

    await expect(page.getByRole("heading", { name: "Schedule" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Blocked")).toBeVisible();
  });

  test("available slots are clickable for owner", async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/dashboard/schedule");

    const table = page.locator("table");
    const noCourtMsg = page.getByText("No courts found");
    await expect(table.or(noCourtMsg)).toBeVisible({ timeout: 20_000 });

    if (await noCourtMsg.isVisible().catch(() => false)) {
      test.skip(true, "No courts to test slot blocking");
    }

    const availableCell = page.locator("div.border-dashed.border-slate-200").first();
    const hasAvailable = await availableCell.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasAvailable) {
      test.skip(true, "No available slots to test blocking");
    }

    await expect(availableCell).toHaveClass(/cursor-pointer/);
  });

  test("clicking available slot opens block confirmation", async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/dashboard/schedule");

    const table = page.locator("table");
    const noCourtMsg = page.getByText("No courts found");
    await expect(table.or(noCourtMsg)).toBeVisible({ timeout: 20_000 });

    if (await noCourtMsg.isVisible().catch(() => false)) {
      test.skip(true, "No courts to test blocking");
    }

    const availableCell = page.locator("div.cursor-pointer.hover\\:border-rose-300").first();
    const hasAvailable = await availableCell.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasAvailable) {
      test.skip(true, "No available slots to test blocking dialog");
    }

    await availableCell.click();
    await expect(page.getByText("Block slot")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole("button", { name: "Block" })).toBeVisible();

    await page.getByRole("button", { name: "Cancel" }).click();
  });

  test("staff cannot block slots", async ({ page }) => {
    await loginAs(page, "staff");
    await page.goto("/dashboard/schedule");

    const table = page.locator("table");
    const noCourtMsg = page.getByText("No courts found");
    await expect(table.or(noCourtMsg)).toBeVisible({ timeout: 20_000 });

    if (await noCourtMsg.isVisible().catch(() => false)) {
      test.skip(true, "No courts found");
    }

    const clickableCell = page.locator("div.cursor-pointer.hover\\:border-rose-300");
    const count = await clickableCell.count();
    expect(count).toBe(0);
  });

  test("blocked slot shows rose styling with Blocked text", async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/dashboard/schedule");

    const table = page.locator("table");
    const noCourtMsg = page.getByText("No courts found");
    await expect(table.or(noCourtMsg)).toBeVisible({ timeout: 20_000 });

    if (await noCourtMsg.isVisible().catch(() => false)) {
      test.skip(true, "No courts found");
    }

    const blockedCell = page.locator("div.bg-rose-100").first();
    const hasBlocked = await blockedCell.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasBlocked) {
      test.skip(true, "No blocked slots currently visible");
    }

    await expect(blockedCell.getByText("Blocked")).toBeVisible();
  });
});
