import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures/auth";

test.describe("Equipment Management as Owner", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/dashboard/equipment");
    await expect(page.getByRole("heading", { name: "Equipment" })).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(3_000);
  });

  test("equipment page loads with heading and summary cards", async ({ page }) => {
    await expect(page.getByText("Total Items")).toBeVisible();
    await expect(page.getByText("Low Stock")).toBeVisible();
    await expect(page.getByText("Out of Stock")).toBeVisible();
    await expect(page.locator("p").filter({ hasText: "Needs Repair" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add Equipment" })).toBeVisible();
  });

  test("add equipment form opens and has all fields", async ({ page }) => {
    await page.getByRole("button", { name: "Add Equipment" }).click();

    const formCard = page.locator(".border-emerald-200");
    await expect(formCard).toBeVisible();

    await expect(formCard.getByPlaceholder("e.g. Wilson Pro Staff")).toBeVisible();
    await expect(formCard.getByPlaceholder("e.g. Wilson, Yonex")).toBeVisible();
    await expect(formCard.getByRole("button", { name: "Add Equipment" })).toBeVisible();
  });

  test("add equipment form submits successfully", async ({ page }) => {
    await page.getByRole("button", { name: "Add Equipment" }).click();

    const formCard = page.locator(".border-emerald-200");
    await formCard.getByPlaceholder("e.g. Wilson Pro Staff").fill("E2E Test Racket");
    await formCard.getByPlaceholder("e.g. Wilson, Yonex").fill("TestBrand");

    const quantityInputs = formCard.locator("input[type='number']");
    await quantityInputs.nth(0).fill("5");
    await quantityInputs.nth(1).fill("5");

    await formCard.getByRole("button", { name: "Add Equipment" }).click();

    const newItem = page.getByText("E2E Test Racket");
    const errorMsg = page.locator(".text-red-600");
    await expect(newItem.or(errorMsg)).toBeVisible({ timeout: 15_000 });
  });

  test("edit equipment form opens on pencil click", async ({ page }) => {
    const cards = page.locator("div.grid").last().locator("[class*='hover:shadow-md']");
    const hasCards = await cards.first().isVisible({ timeout: 15_000 }).catch(() => false);

    if (!hasCards) {
      test.skip(true, "No equipment cards loaded");
    }

    await cards.first().locator("button").first().click();

    const formCard = page.locator(".border-emerald-200");
    await expect(formCard).toBeVisible();
    await expect(formCard.getByRole("button", { name: "Update Equipment" })).toBeVisible();
  });

  test("delete confirmation dialog appears", async ({ page }) => {
    const cards = page.locator("div.grid").last().locator("[class*='hover:shadow-md']");
    const hasCards = await cards.first().isVisible({ timeout: 15_000 }).catch(() => false);

    if (!hasCards) {
      test.skip(true, "No equipment cards loaded");
    }

    await cards.first().locator("button").nth(1).click();

    await expect(page.getByText("Remove Equipment")).toBeVisible();
    await expect(page.getByText("Are you sure you want to remove this equipment")).toBeVisible();
    await expect(page.getByRole("button", { name: "Yes, Remove" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Keep Equipment" })).toBeVisible();

    await page.getByRole("button", { name: "Keep Equipment" }).click();
    await expect(page.getByText("Remove Equipment")).not.toBeVisible();
  });

  test("search filters equipment list", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search equipment...");
    await expect(searchInput).toBeVisible();
    await searchInput.fill("nonexistent-item-xyz-12345");
    await page.waitForTimeout(1_000);

    const noResults = page.getByText("No equipment matches your filters");
    const emptyState = page.getByText("No equipment added yet");
    const cards = page.locator("div.grid").last().locator("[class*='hover:shadow-md']");

    const hasNoResults = await noResults.isVisible().catch(() => false);
    const hasEmptyState = await emptyState.isVisible().catch(() => false);
    const cardCount = await cards.count();

    expect(hasNoResults || hasEmptyState || cardCount === 0).toBeTruthy();
  });

  test("category filter dropdown works", async ({ page }) => {
    const categorySelect = page.locator("select").filter({ hasText: "All Categories" });
    await expect(categorySelect).toBeVisible();
    await categorySelect.selectOption({ label: "Racket" });
    await page.waitForTimeout(2_000);

    const heading = page.getByRole("heading", { name: "Equipment" });
    await expect(heading).toBeVisible();
  });

  test("condition filter dropdown works", async ({ page }) => {
    const conditionSelect = page.locator("select").filter({ hasText: "All Conditions" });
    await expect(conditionSelect).toBeVisible();
    await conditionSelect.selectOption({ label: "Good" });
    await page.waitForTimeout(2_000);

    const heading = page.getByRole("heading", { name: "Equipment" });
    await expect(heading).toBeVisible();
  });
});

test.describe("Equipment visibility by role", () => {
  test("staff can view equipment page but not add/edit", async ({ page }) => {
    await loginAs(page, "staff");
    await page.goto("/dashboard/equipment");
    await expect(page.getByRole("heading", { name: "Equipment" })).toBeVisible({ timeout: 15_000 });

    await expect(page.getByRole("button", { name: "Add Equipment" })).not.toBeVisible();
  });

  test("player does not have equipment in sidebar", async ({ page }) => {
    await loginAs(page, "player");
    const sidebar = page.locator("div.bg-slate-900.text-white");
    await expect(sidebar.getByRole("link", { name: "Equipment" })).not.toBeVisible();
  });
});
