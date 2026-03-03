import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures/auth";
import { BRANCHES } from "./fixtures/test-data";

test.describe("Branch Management as Owner", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "owner");
  });

  test("branches page loads with Gachibowli and Madhapur", async ({ page }) => {
    await page.goto("/dashboard/branches");
    await expect(page.getByRole("heading", { name: "Branches" })).toBeVisible();
    for (const name of BRANCHES) {
      await expect(page.getByText(name).first()).toBeVisible({ timeout: 10_000 });
    }
  });

  test("add branch form creates new branch", async ({ page }) => {
    const branchName = `E2E Branch ${Date.now()}`;
    await page.goto("/dashboard/branches");
    await expect(page.getByRole("heading", { name: "Branches" })).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: "Add Branch" }).click();

    const formCard = page.locator(".border-emerald-200");
    await expect(formCard).toBeVisible();

    await formCard.getByPlaceholder("Main Branch").fill(branchName);
    await formCard.getByPlaceholder("9876543210").fill("9999999999");
    await formCard.getByPlaceholder("123 Sports Road").fill("Test Road");
    await formCard.getByPlaceholder("Hyderabad").fill("Hyderabad");
    await formCard.getByPlaceholder("Telangana").fill("Telangana");
    await formCard.getByPlaceholder("500032").fill("500001");
    await formCard.locator('input[type="time"]').first().fill("06:00");
    await formCard.locator('input[type="time"]').nth(1).fill("22:00");

    await formCard.getByRole("button", { name: "Create Branch" }).click();

    await expect(page.getByText(branchName)).toBeVisible({ timeout: 15_000 });
  });

  test("branch cards show address and hours", async ({ page }) => {
    await page.goto("/dashboard/branches");
    await expect(page.getByRole("heading", { name: "Branches" })).toBeVisible();

    const branchCards = page.locator("div.grid").last().locator("div[class*='hover:shadow-md']");
    await expect(branchCards.first()).toBeVisible({ timeout: 10_000 });

    const firstCard = branchCards.first();
    await expect(firstCard.locator("span").filter({ hasText: /Active|Inactive/ })).toBeVisible();
    await expect(firstCard.locator("span").filter({ hasText: /-|:/ })).toBeVisible();
  });
});
