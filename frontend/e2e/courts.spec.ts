import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures/auth";

test.describe("Court Management as Owner", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/dashboard/courts");
    await expect(page.getByRole("heading", { name: "Courts" })).toBeVisible({ timeout: 10_000 });
  });

  test("courts page loads with existing courts listed", async ({ page }) => {
    const courtCards = page.locator("div.grid").last().locator("[class*='hover:shadow-md']");
    await expect(courtCards.first()).toBeVisible({ timeout: 10_000 });
  });

  test("add court form opens and creates a court", async ({ page }) => {
    await page.getByRole("button", { name: "Add Court" }).click();

    const formCard = page.locator(".border-emerald-200");
    await expect(formCard).toBeVisible();

    await formCard.getByPlaceholder("Court A").fill("Test Court E2E");
    await formCard.locator("select").first().selectOption({ label: "Pickleball" });
    await formCard.getByPlaceholder("e.g. Synthetic, Clay").fill("Synthetic");
    await formCard.getByPlaceholder("800").fill("1000");
    await formCard.getByPlaceholder("1200").fill("1500");

    await formCard.getByRole("button", { name: "Create Court" }).click();

    await expect(page.getByText("Test Court E2E")).toBeVisible({ timeout: 10_000 });
  });

  test("edit court changes hourly rate", async ({ page }) => {
    const courtCards = page.locator("div.grid").last().locator("[class*='hover:shadow-md']");
    await expect(courtCards.first()).toBeVisible({ timeout: 10_000 });

    const firstCard = courtCards.first();
    await firstCard.locator("button").first().click();

    const formCard = page.locator(".border-emerald-200");
    await expect(formCard).toBeVisible();

    const rateInput = formCard.getByPlaceholder("800");
    await rateInput.clear();
    await rateInput.fill("999");

    await formCard.getByRole("button", { name: "Update Court" }).click();

    await expect(page.getByText("999")).toBeVisible({ timeout: 10_000 });
  });

  test("toggle court active/inactive", async ({ page }) => {
    const courtCards = page.locator("div.grid").last().locator("[class*='hover:shadow-md']");
    await expect(courtCards.first()).toBeVisible({ timeout: 10_000 });

    const firstCard = courtCards.first();
    const statusBadge = firstCard.locator("span.rounded-full").filter({ hasText: /Active|Inactive/ });
    const initialStatus = await statusBadge.textContent();

    const powerButton = firstCard.locator("button").nth(1);
    await powerButton.click();

    const expectedStatus = initialStatus?.trim() === "Active" ? "Inactive" : "Active";
    await expect(firstCard.locator("span.rounded-full").filter({ hasText: expectedStatus })).toBeVisible({ timeout: 10_000 });

    await powerButton.click();
    await expect(firstCard.locator("span.rounded-full").filter({ hasText: initialStatus!.trim() })).toBeVisible({ timeout: 10_000 });
  });

  test("pricing rules link navigates", async ({ page }) => {
    const courtCards = page.locator("div.grid").last().locator("[class*='hover:shadow-md']");
    await expect(courtCards.first()).toBeVisible({ timeout: 10_000 });

    await page.locator("a[href*='pricing']").first().click();
    await expect(page).toHaveURL(/\/dashboard\/courts\/pricing/);
  });
});
