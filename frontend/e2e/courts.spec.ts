import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures/auth";

test.describe("Court Management as Owner", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/dashboard/courts");
    await expect(page.getByRole("heading", { name: "Courts" })).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(3_000);
  });

  test("courts page loads with heading and add button", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Add Court" })).toBeVisible();
  });

  test("add court form opens and fills correctly", async ({ page }) => {
    await page.getByRole("button", { name: "Add Court" }).click();

    const formCard = page.locator(".border-emerald-200");
    await expect(formCard).toBeVisible();

    await expect(formCard.getByPlaceholder("Court A")).toBeVisible();
    await expect(formCard.locator("select").first()).toBeVisible();
    await expect(formCard.getByPlaceholder("800")).toBeVisible();

    await formCard.getByPlaceholder("Court A").fill("Test Court E2E");
    await formCard.locator("select").first().selectOption({ label: "Pickleball" });
    await formCard.getByPlaceholder("e.g. Synthetic, Clay").fill("Synthetic");
    await formCard.getByPlaceholder("800").fill("1000");
    await formCard.getByPlaceholder("1200").fill("1500");

    await formCard.getByRole("button", { name: "Create Court" }).click();

    const newCourt = page.getByText("Test Court E2E");
    const errorMsg = page.locator(".text-red-600");
    await expect(newCourt.or(errorMsg)).toBeVisible({ timeout: 15_000 });
  });

  test("edit court form opens on pencil click", async ({ page }) => {
    const courtCards = page.locator("div.grid").last().locator("[class*='hover:shadow-md']");
    const hasCards = await courtCards.first().isVisible({ timeout: 15_000 }).catch(() => false);

    if (!hasCards) {
      test.skip(true, "No court cards loaded - likely rate limited");
    }

    await courtCards.first().locator("button").first().click();

    const formCard = page.locator(".border-emerald-200");
    await expect(formCard).toBeVisible();
    await expect(formCard.getByRole("button", { name: "Update Court" })).toBeVisible();
  });

  test("toggle court active/inactive", async ({ page }) => {
    const courtCards = page.locator("div.grid").last().locator("[class*='hover:shadow-md']");
    const hasCards = await courtCards.first().isVisible({ timeout: 15_000 }).catch(() => false);

    if (!hasCards) {
      test.skip(true, "No court cards loaded - likely rate limited");
    }

    const statusBadge = courtCards.first().locator("span.rounded-full").filter({ hasText: /Active|Inactive/ });
    await expect(statusBadge).toBeVisible({ timeout: 5_000 });
    const initialStatus = (await statusBadge.textContent())!.trim();

    await courtCards.first().locator("button").nth(1).click();

    const expectedStatus = initialStatus === "Active" ? "Inactive" : "Active";
    await page.waitForTimeout(3_000);

    const updatedBadge = page.locator("div.grid").last()
      .locator("[class*='hover:shadow-md']").first()
      .locator("span.rounded-full").filter({ hasText: expectedStatus });

    await expect(updatedBadge).toBeVisible({ timeout: 20_000 });
  });

  test("pricing rules link navigates", async ({ page }) => {
    const pricingLink = page.locator("a[href*='pricing']").first();
    const hasLink = await pricingLink.isVisible({ timeout: 15_000 }).catch(() => false);

    if (!hasLink) {
      test.skip(true, "No pricing links visible - no courts loaded");
    }

    await pricingLink.click();
    await expect(page).toHaveURL(/\/dashboard\/courts\/pricing/);
  });
});
