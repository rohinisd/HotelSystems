import { test, expect } from "@playwright/test";

test.describe("Legal & Policy Pages", () => {
  test("terms page loads with all sections", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.getByRole("heading", { name: "Terms & Conditions" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("About TurfStack")).toBeVisible();
    await expect(page.getByText("Booking & Payments")).toBeVisible();
    await expect(page.getByText("Governing Law")).toBeVisible();
    await expect(page.getByRole("link", { name: "gen.girish@gmail.com" })).toBeVisible();
  });

  test("privacy page loads with data handling sections", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { name: "Privacy Policy" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Information We Collect")).toBeVisible();
    await expect(page.getByText("Data Security")).toBeVisible();
    await expect(page.getByText("Your Rights")).toBeVisible();
  });

  test("refund policy page loads with cancellation tiers", async ({ page }) => {
    await page.goto("/refund-policy");
    await expect(page.getByRole("heading", { name: "Cancellation & Refund Policy" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Full refund")).toBeVisible();
    await expect(page.getByText("50% refund")).toBeVisible();
    await expect(page.getByText("No refund")).toBeVisible();
    await expect(page.getByText("No-Show Policy")).toBeVisible();
  });

  test("contact page loads with business details", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("heading", { name: "Contact Us" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("gen.girish@gmail.com")).toBeVisible();
    await expect(page.getByText("Hyderabad")).toBeVisible();
    await expect(page.getByText("Girish Basavaraj Hiremath")).toBeVisible();
    await expect(page.getByText("Razorpay Software Pvt. Ltd.")).toBeVisible();
  });

  test("footer links navigate between legal pages", async ({ page }) => {
    await page.goto("/terms");

    await page.getByRole("contentinfo").getByRole("link", { name: "Privacy" }).click();
    await expect(page).toHaveURL(/\/privacy/);

    await page.getByRole("contentinfo").getByRole("link", { name: "Refund Policy" }).click();
    await expect(page).toHaveURL(/\/refund-policy/);

    await page.getByRole("contentinfo").getByRole("link", { name: "Contact" }).click();
    await expect(page).toHaveURL(/\/contact/);
  });

  test("landing page footer links to all legal pages", async ({ page }) => {
    await page.goto("/");

    const footer = page.getByRole("contentinfo").or(page.locator("footer"));
    await expect(footer.getByRole("link", { name: "Terms" })).toBeVisible();
    await expect(footer.getByRole("link", { name: "Privacy" })).toBeVisible();
    await expect(footer.getByRole("link", { name: "Refund Policy" })).toBeVisible();
    await expect(footer.getByRole("link", { name: "Contact" })).toBeVisible();
  });
});
