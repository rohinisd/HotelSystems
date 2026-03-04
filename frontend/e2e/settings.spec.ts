import { test, expect } from "@playwright/test";
import { loginAs, CREDENTIALS } from "./fixtures/auth";

function labelledInput(page: import("@playwright/test").Page, labelText: string) {
  return page.locator(".space-y-1\\.5").filter({ hasText: labelText }).locator("input");
}

test.describe("Settings Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/dashboard/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Your Profile")).toBeVisible({ timeout: 30_000 });
  });

  test("settings page shows pre-filled profile", async ({ page }) => {
    const nameInput = labelledInput(page, "Full Name");
    await expect(nameInput).toBeVisible({ timeout: 10_000 });

    const emailInput = labelledInput(page, "Email");
    await expect(emailInput).toHaveValue(CREDENTIALS.owner.email, { timeout: 10_000 });
  });

  test("edit name and save shows toast", async ({ page }) => {
    const nameInput = labelledInput(page, "Full Name");
    await expect(nameInput).toBeVisible({ timeout: 10_000 });
    await nameInput.fill("Updated Owner Name");
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByText("Profile updated")).toBeVisible({ timeout: 10_000 });
  });

  test("saved name persists on refresh", async ({ page }) => {
    const nameInput = labelledInput(page, "Full Name");
    await expect(nameInput).toBeVisible({ timeout: 10_000 });
    await nameInput.fill("Persisted Name");
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByText("Profile updated")).toBeVisible({ timeout: 10_000 });

    await page.reload();
    await expect(page.getByText("Your Profile")).toBeVisible({ timeout: 30_000 });
    await expect(labelledInput(page, "Full Name")).toHaveValue("Persisted Name", { timeout: 10_000 });
  });

  test("save button disabled when no changes", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Save Changes" })).toBeDisabled();
  });

  test("owner sees Facility card", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Facility" })).toBeVisible({ timeout: 10_000 });
    const facilityNameInput = labelledInput(page, "Facility Name");
    await expect(facilityNameInput).toHaveValue("TurfStack Arena");
  });
});
