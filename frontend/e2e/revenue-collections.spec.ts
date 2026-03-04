import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures/auth";

test.describe("Revenue Collections", () => {
  test("revenue page shows collections section", async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/dashboard/revenue");

    await expect(page.getByRole("heading", { name: "Revenue", exact: true })).toBeVisible({ timeout: 15_000 });

    const collectionsSection = page.getByText(/Collections by Payment Method/i);
    await collectionsSection.first().scrollIntoViewIfNeeded();
    await expect(collectionsSection.first()).toBeVisible({ timeout: 10_000 });
  });

  test("collections section shows payment methods", async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/dashboard/revenue");

    await expect(page.getByRole("heading", { name: "Revenue", exact: true })).toBeVisible({ timeout: 15_000 });

    const collectionsSection = page.getByText(/Collections by Payment Method/i);
    await collectionsSection.first().scrollIntoViewIfNeeded();
    await expect(collectionsSection.first()).toBeVisible({ timeout: 10_000 });

    const table = page.locator("table").filter({ hasText: /Method|method/i });
    const noDataMsg = page.getByText(/No collection data|no collections/i);

    await expect(table.or(noDataMsg).first()).toBeVisible({ timeout: 10_000 });
  });

  test("export CSV button is present", async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/dashboard/revenue");

    await expect(page.getByRole("heading", { name: "Revenue", exact: true })).toBeVisible({ timeout: 15_000 });

    const exportBtn = page.getByRole("button", { name: /Export/i });
    await expect(exportBtn).toBeVisible({ timeout: 10_000 });
  });
});
