import { type Page, expect } from "@playwright/test";

export const CREDENTIALS: Record<string, { email: string; password: string }> = {
  owner: { email: "owner@turfstack.in", password: "password123" },
  manager: { email: "manager@turfstack.in", password: "password123" },
  staff: { email: "staff@turfstack.in", password: "password123" },
  accountant: { email: "accounts@turfstack.in", password: "password123" },
  player: { email: "arjun@turfstack.in", password: "password123" },
  player2: { email: "meera@turfstack.in", password: "password123" },
};

export type Role = keyof typeof CREDENTIALS;

export async function loginAs(page: Page, role: Role) {
  const { email, password } = CREDENTIALS[role];

  for (let attempt = 0; attempt < 3; attempt++) {
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign In" }).click();

    try {
      await page.waitForURL(/\/dashboard|\/book/, { timeout: 30_000 });
      return;
    } catch {
      const errorBox = page.locator(".bg-red-50");
      const hasError = await errorBox.isVisible().catch(() => false);
      if (hasError && attempt < 2) {
        await page.waitForTimeout(5_000 * (attempt + 1));
        continue;
      }
      if (attempt === 2) throw new Error(`loginAs(${role}) failed after 3 attempts`);
    }
  }
}

export async function logout(page: Page) {
  await page.getByRole("button", { name: "Sign Out" }).click();
  await page.waitForURL("/login", { timeout: 10_000 });
}
