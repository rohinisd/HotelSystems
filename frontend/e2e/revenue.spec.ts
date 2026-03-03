import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures/auth";

test.describe("Revenue & Analytics", () => {
  test("revenue page loads for owner", async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/dashboard/revenue");

    await expect(page.getByRole("heading", { name: "Revenue", exact: true })).toBeVisible({ timeout: 10_000 });
    const contentArea = page.getByText("Total Revenue").or(page.getByText("Utilization Heatmap"));
    await expect(contentArea.first()).toBeVisible({ timeout: 10_000 });
  });

  test("utilization heatmap is visible", async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/dashboard/revenue");

    await expect(page.getByRole("heading", { name: "Revenue", exact: true })).toBeVisible({ timeout: 10_000 });
    const heatmapSection = page.getByText("Utilization Heatmap");
    await heatmapSection.first().scrollIntoViewIfNeeded();
    await expect(heatmapSection.first()).toBeVisible({ timeout: 10_000 });
  });

  test("accountant can access revenue but not courts", async ({ page }) => {
    await loginAs(page, "accountant");
    await page.goto("/dashboard/revenue");

    await expect(page.getByRole("heading", { name: "Revenue", exact: true })).toBeVisible({ timeout: 15_000 });

    const sidebar = page.locator("div.bg-slate-900.text-white");
    await expect(sidebar.getByRole("link", { name: "Courts" })).not.toBeVisible();
  });
});
