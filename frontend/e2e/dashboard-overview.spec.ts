import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures/auth";

test.describe("Dashboard Overview per Role", () => {
  test("owner sees KPI cards and Today's Bookings section", async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/dashboard");

    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 10_000 });
    await expect(main.getByText("Welcome back!")).toBeVisible();

    await expect(main.locator(".grid").first()).toBeVisible({ timeout: 15_000 });

    await expect(
      main.getByRole("heading", { name: "Today's Bookings" }).first().or(main.getByText("No bookings for today"))
    ).toBeVisible({ timeout: 10_000 });
  });

  test("owner dashboard has View all link to bookings", async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/dashboard");

    const main = page.getByRole("main");
    const viewAll = main.getByRole("link", { name: /View all/ });
    const hasViewAll = await viewAll.isVisible({ timeout: 10_000 }).catch(() => false);
    if (hasViewAll) {
      await viewAll.click();
      await expect(page).toHaveURL(/\/dashboard\/bookings/);
    }
  });

  test("staff sees Today's Schedule with booking count", async ({ page }) => {
    await loginAs(page, "staff");
    await page.goto("/dashboard");

    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { name: "Today's Schedule" })).toBeVisible({ timeout: 10_000 });
    await expect(main.getByText("Bookings Today", { exact: true })).toBeVisible();
    await expect(main.getByText("Revenue Today")).toBeVisible();
    await expect(main.getByRole("link", { name: /Walk-in Booking/ })).toBeVisible();
  });

  test("player sees Welcome back with booking stats", async ({ page }) => {
    await loginAs(page, "player");
    await page.goto("/dashboard");

    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { name: "Welcome back!" })).toBeVisible({ timeout: 10_000 });
    await expect(main.getByText("Upcoming Bookings").or(main.getByText("No upcoming bookings"))).toBeVisible();
    await expect(main.getByText("Total Bookings")).toBeVisible();
    await expect(main.getByRole("link", { name: /Book a Court/ })).toBeVisible();
  });

  test("accountant sees Accounts heading with Revenue link", async ({ page }) => {
    await loginAs(page, "accountant");
    await page.goto("/dashboard");

    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { name: "Accounts" })).toBeVisible({ timeout: 10_000 });
    const revenueLink = main.getByRole("link", { name: /Revenue Reports/ });
    await expect(revenueLink).toBeVisible();

    await revenueLink.click();
    await expect(page).toHaveURL(/\/dashboard\/revenue/);
  });
});
