import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures/auth";

test.describe("Pricing Rules CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/dashboard/courts");
    await expect(page.getByRole("heading", { name: "Courts" })).toBeVisible({ timeout: 15_000 });
  });

  test("navigate to pricing page from courts", async ({ page }) => {
    const pricingLink = page.locator("a[href*='pricing']").first();
    const hasLink = await pricingLink.isVisible({ timeout: 15_000 }).catch(() => false);
    if (!hasLink) {
      test.skip(true, "No courts with pricing links available");
    }

    await pricingLink.click();
    await expect(page).toHaveURL(/\/dashboard\/courts\/pricing/);
    await expect(page.getByRole("heading", { name: "Pricing Rules" })).toBeVisible();
  });

  test("pricing page shows Add Rule button and rules table or empty state", async ({ page }) => {
    const pricingLink = page.locator("a[href*='pricing']").first();
    const hasLink = await pricingLink.isVisible({ timeout: 15_000 }).catch(() => false);
    if (!hasLink) {
      test.skip(true, "No courts with pricing links available");
    }

    await pricingLink.click();
    await expect(page.getByRole("button", { name: "Add Rule" })).toBeVisible();

    const rulesTable = page.locator("table");
    const emptyState = page.getByText("No custom pricing rules");
    await expect(rulesTable.or(emptyState)).toBeVisible({ timeout: 10_000 });
  });

  test("add pricing rule form opens and has all fields", async ({ page }) => {
    const pricingLink = page.locator("a[href*='pricing']").first();
    const hasLink = await pricingLink.isVisible({ timeout: 15_000 }).catch(() => false);
    if (!hasLink) {
      test.skip(true, "No courts with pricing links available");
    }

    await pricingLink.click();
    await page.getByRole("button", { name: "Add Rule" }).click();

    const form = page.locator(".border-emerald-200");
    await expect(form).toBeVisible();
    await expect(form.locator("select")).toBeVisible();
    await expect(form.locator('input[type="time"]').first()).toBeVisible();
    await expect(form.locator('input[type="number"]')).toBeVisible();
    await expect(form.getByPlaceholder("Peak hours")).toBeVisible();
    await expect(form.getByRole("button", { name: "Add Rule" })).toBeVisible();
    await expect(form.getByRole("button", { name: "Cancel" })).toBeVisible();
  });

  test("cancel button hides add rule form", async ({ page }) => {
    const pricingLink = page.locator("a[href*='pricing']").first();
    const hasLink = await pricingLink.isVisible({ timeout: 15_000 }).catch(() => false);
    if (!hasLink) {
      test.skip(true, "No courts with pricing links available");
    }

    await pricingLink.click();
    await page.getByRole("button", { name: "Add Rule" }).click();

    const form = page.locator(".border-emerald-200");
    await expect(form).toBeVisible();

    await form.getByRole("button", { name: "Cancel" }).click();
    await expect(form).not.toBeVisible();
  });

  test("back button navigates to courts page", async ({ page }) => {
    const pricingLink = page.locator("a[href*='pricing']").first();
    const hasLink = await pricingLink.isVisible({ timeout: 15_000 }).catch(() => false);
    if (!hasLink) {
      test.skip(true, "No courts with pricing links available");
    }

    await pricingLink.click();
    await expect(page.getByRole("heading", { name: "Pricing Rules" })).toBeVisible();

    await page.getByRole("link", { name: "" }).or(page.locator("a[href='/dashboard/courts']").first()).click();
    await expect(page).toHaveURL(/\/dashboard\/courts/);
  });
});
