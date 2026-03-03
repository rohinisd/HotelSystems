import { test, expect } from "@playwright/test";

test.describe("Rate Limiting", () => {
  test("6 rapid login failures trigger rate limit error", async ({ page }) => {
    // Use a unique non-existent email to avoid locking real demo accounts
    const fakeEmail = `rate-limit-test-${Date.now()}@example.com`;
    const wrongPassword = "wrongpassword123";

    await page.goto("/login");

    for (let i = 0; i < 6; i++) {
      await page.getByLabel("Email").fill(fakeEmail);
      await page.getByLabel("Password").fill(wrongPassword);
      await page.getByRole("button", { name: "Sign In" }).click();
      // Wait for form to submit and error to appear
      await page.waitForTimeout(500);
    }

    // After 6 attempts (rate limit is 5/minute), expect rate limit error
    // Error appears in: div.rounded-lg.bg-red-50.border.border-red-100 or similar
    const errorContainer = page.locator("div.rounded-lg.bg-red-50.border.border-red-100, div.bg-red-50.border.border-red-100");
    await expect(errorContainer).toBeVisible({ timeout: 5_000 });

    const errorText = await errorContainer.textContent();
    const hasRateLimitError =
      /429|rate limit|too many|rate limit exceeded|too many requests/i.test(errorText || "") ||
      (errorText || "").toLowerCase().includes("limit");

    expect(hasRateLimitError).toBeTruthy();
  });
});
