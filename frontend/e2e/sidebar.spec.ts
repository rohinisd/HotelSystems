import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures/auth";
import { SIDEBAR_ITEMS } from "./fixtures/test-data";

test.describe("Role-Based Sidebar", () => {
  const roles = ["owner", "manager", "staff", "accountant", "player"] as const;

  for (const role of roles) {
    test(`${role} sees expected sidebar items`, async ({ page }) => {
      await loginAs(page, role);
      const expectedItems = SIDEBAR_ITEMS[role];
      const sidebar = page.locator("div.bg-slate-900.text-white");

      for (const item of expectedItems) {
        await expect(sidebar.getByRole("link", { name: item })).toBeVisible();
      }

      // Check that nav has exactly the expected items (no extras)
      const navLinks = sidebar.locator("nav a");
      const visibleTexts = (await navLinks.allTextContents()).map((t) => t.trim()).filter(Boolean);
      await expect(visibleTexts.sort()).toEqual([...expectedItems].sort());
    });
  }
});
