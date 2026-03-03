import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures/auth";

test.describe("Team Management as Owner", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/dashboard/team");
    await expect(page.getByRole("heading", { name: "Team" })).toBeVisible({ timeout: 10_000 });
  });

  test("team page loads with members listed", async ({ page }) => {
    await expect(page.getByText("Team Members")).toBeVisible({ timeout: 10_000 });
    const memberRows = page.locator("div.space-y-3 > div.rounded-lg.border");
    await expect(memberRows.first()).toBeVisible({ timeout: 10_000 });
  });

  test("add member form creates a new team member", async ({ page }) => {
    await page.getByRole("button", { name: "Add Member" }).click();

    await page.getByPlaceholder("Ravi Kumar").fill("E2E Test User");
    await page.getByPlaceholder("ravi@turfstack.in").fill(`e2e-${Date.now()}@turfstack.in`);
    await page.getByPlaceholder("9876543210").first().fill("9999999999");
    await page.locator("form select").selectOption("staff");
    await page.getByPlaceholder("Min 6 characters").fill("testpass123");

    await page.locator("form").getByRole("button", { name: "Add Member" }).click();

    await expect(page.getByText(/added as staff/)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("E2E Test User", { exact: true })).toBeVisible();
  });

  test("change member role via dropdown", async ({ page }) => {
    await expect(page.getByText("Team Members")).toBeVisible({ timeout: 10_000 });

    const memberRows = page.locator("div.space-y-3 > div.rounded-lg.border");
    const rowWithSelect = memberRows.filter({ has: page.locator("select") }).first();
    await expect(rowWithSelect).toBeVisible({ timeout: 10_000 });

    await rowWithSelect.locator("select").selectOption("manager");

    await expect(page.getByText(/role changed to manager/)).toBeVisible({ timeout: 10_000 });
  });

  test("deactivate and reactivate member", async ({ page }) => {
    await expect(page.getByText("Team Members")).toBeVisible({ timeout: 10_000 });

    const memberRows = page.locator("div.space-y-3 > div.rounded-lg.border");
    const rowWithPower = memberRows.filter({ has: page.locator("select") }).first();
    await expect(rowWithPower).toBeVisible({ timeout: 10_000 });

    const powerButton = rowWithPower.getByRole("button");
    await powerButton.click();

    await expect(page.getByText("(Deactivated)").first()).toBeVisible({ timeout: 10_000 });

    await powerButton.click();
    await expect(page.getByText(/activated/).first()).toBeVisible({ timeout: 10_000 });
  });

  test("owner row has no modification controls", async ({ page }) => {
    await expect(page.getByText("Team Members")).toBeVisible({ timeout: 10_000 });

    const ownerRow = page.locator("div.space-y-3 > div.rounded-lg.border").filter({
      hasText: "owner@turfstack.in",
    });
    await expect(ownerRow).toBeVisible({ timeout: 10_000 });

    await expect(ownerRow.locator("select")).toHaveCount(0);
    await expect(ownerRow.getByRole("button")).toHaveCount(0);
  });
});
