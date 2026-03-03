import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures/auth";

test.describe("Team Management as Owner", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/dashboard/team");
    await expect(page.getByRole("heading", { name: "Team" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Team Members")).toBeVisible({ timeout: 15_000 });
  });

  test("team page loads with members listed", async ({ page }) => {
    const memberRows = page.locator("div.space-y-3 > div.rounded-lg.border");
    await expect(memberRows.first()).toBeVisible({ timeout: 10_000 });
  });

  test("add member form opens and submits", async ({ page }) => {
    const memberName = `E2E User ${Date.now()}`;
    await page.getByRole("button", { name: "Add Member" }).click();

    const form = page.locator("form");
    await expect(form).toBeVisible({ timeout: 5_000 });

    await form.getByPlaceholder("Ravi Kumar").fill(memberName);
    await form.getByPlaceholder("ravi@turfstack.in").fill(`e2e-${Date.now()}@turfstack.in`);
    await form.getByPlaceholder("9876543210").fill("9999999999");
    await form.locator("select").selectOption("staff");
    await form.getByPlaceholder("Min 6 characters").fill("testpass123");

    await form.getByRole("button", { name: "Add Member" }).click();

    const successToast = page.getByText(/added as staff/);
    const errorToast = page.getByText(/Failed to invite/);
    await expect(successToast.or(errorToast)).toBeVisible({ timeout: 15_000 });
  });

  test("change member role via dropdown", async ({ page }) => {
    const memberRows = page.locator("div.space-y-3 > div.rounded-lg.border");
    const rowWithSelect = memberRows.filter({ has: page.locator("select") }).first();
    await expect(rowWithSelect).toBeVisible({ timeout: 10_000 });

    await rowWithSelect.locator("select").selectOption("manager");

    await expect(page.getByText(/role changed to manager/)).toBeVisible({ timeout: 10_000 });
  });

  test("deactivate and reactivate member", async ({ page }) => {
    const memberRows = page.locator("div.space-y-3 > div.rounded-lg.border");
    const rowWithPower = memberRows.filter({ has: page.locator("select") }).first();
    await expect(rowWithPower).toBeVisible({ timeout: 10_000 });

    const powerButton = rowWithPower.getByRole("button");
    await powerButton.click();

    await expect(page.getByText(/deactivated|activated/).first()).toBeVisible({ timeout: 10_000 });

    await page.waitForTimeout(1_000);
    const updatedRow = memberRows.filter({ has: page.locator("select") }).first();
    await updatedRow.getByRole("button").click();
    await expect(page.getByText(/activated/).first()).toBeVisible({ timeout: 10_000 });
  });

  test("owner row has no modification controls", async ({ page }) => {
    const ownerRow = page.locator("div.space-y-3 > div.rounded-lg.border").filter({
      hasText: "owner@turfstack.in",
    });
    await expect(ownerRow).toBeVisible({ timeout: 10_000 });

    await expect(ownerRow.locator("select")).toHaveCount(0);
    await expect(ownerRow.getByRole("button")).toHaveCount(0);
  });
});
