import { test, expect } from "@playwright/test";
import { loginAs, CREDENTIALS } from "./fixtures/auth";

test.describe("Settings Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/dashboard/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible({ timeout: 10_000 });
  });

  test("settings page shows pre-filled profile", async ({ page }) => {
    await expect(page.getByLabel("Full Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toHaveValue(CREDENTIALS.owner.email);
  });

  test("edit name and save shows toast", async ({ page }) => {
    const nameInput = page.getByLabel("Full Name");
    await nameInput.fill("Updated Owner Name");
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByText("Profile updated")).toBeVisible({ timeout: 5_000 });
  });

  test("saved name persists on refresh", async ({ page }) => {
    const nameInput = page.getByLabel("Full Name");
    await nameInput.fill("Persisted Name");
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByText("Profile updated")).toBeVisible({ timeout: 5_000 });

    await page.reload();
    await expect(page.getByLabel("Full Name")).toHaveValue("Persisted Name", { timeout: 10_000 });
  });

  test("save button disabled when no changes", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Save Changes" })).toBeDisabled();
  });

  test("owner sees Facility card", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Facility" })).toBeVisible();
    await expect(page.getByText("TurfStack Arena")).toBeVisible();
  });
});
