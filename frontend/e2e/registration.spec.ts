import { test, expect } from "@playwright/test";

test.describe("Registration & Form Validation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "New here? Create an account" }).click();
  });

  test("toggling to register mode shows Create your account heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
  });

  test("short name shows validation error", async ({ page }) => {
    await page.getByLabel("Full Name").fill("A");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Create Account" }).click();
    await expect(page.getByText("Name must be at least 2 characters")).toBeVisible({ timeout: 5_000 });
  });

  test("invalid email shows Enter a valid email address", async ({ page }) => {
    await page.getByLabel("Full Name").fill("John Doe");
    await page.getByLabel("Email").fill("test@test");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Create Account" }).click();
    await expect(page.getByText("Enter a valid email address")).toBeVisible({ timeout: 5_000 });
  });

  test("short password shows Password must be at least 6 characters", async ({ page }) => {
    await page.getByLabel("Full Name").fill("John Doe");
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("12345");
    await page.getByRole("button", { name: "Create Account" }).click();
    await expect(page.getByText("Password must be at least 6 characters")).toBeVisible({ timeout: 5_000 });
  });

  test("6-char password shows Weak strength label", async ({ page }) => {
    await page.getByLabel("Password").fill("123456");
    await expect(page.getByText("Weak", { exact: true })).toBeVisible();
  });

  test("8-char password shows Good strength label", async ({ page }) => {
    await page.getByLabel("Password").fill("12345678");
    await expect(page.getByText("Good", { exact: true })).toBeVisible();
  });

  test("12+ char password shows Strong strength label", async ({ page }) => {
    await page.getByLabel("Password").fill("123456789012");
    await expect(page.getByText("Strong", { exact: true })).toBeVisible();
  });
});
