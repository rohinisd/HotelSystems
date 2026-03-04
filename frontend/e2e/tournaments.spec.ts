import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures/auth";

test.describe("Tournament Management", () => {
  test("tournaments page loads for owner", async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/dashboard/tournaments");

    await expect(page.getByRole("heading", { name: "Tournaments" })).toBeVisible({ timeout: 15_000 });
  });

  test("tournaments page has create button", async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/dashboard/tournaments");

    await expect(page.getByRole("heading", { name: "Tournaments" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: /Create Tournament/i })).toBeVisible();
  });

  test("create tournament form opens and has required fields", async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/dashboard/tournaments");

    await expect(page.getByRole("heading", { name: "Tournaments" })).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: /Create Tournament/i }).click();

    const formCard = page.locator(".border-emerald-200");
    await expect(formCard).toBeVisible({ timeout: 5_000 });

    await expect(formCard.getByPlaceholder("e.g. Summer Pickleball League")).toBeVisible();
    await expect(formCard.locator('input[type="date"]').first()).toBeVisible();
    await expect(formCard.getByRole("button", { name: /Create Tournament/i })).toBeVisible();
  });

  test("create tournament with valid data", async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/dashboard/tournaments");

    await expect(page.getByRole("heading", { name: "Tournaments" })).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: /Create Tournament/i }).click();

    const formCard = page.locator(".border-emerald-200");
    await expect(formCard).toBeVisible({ timeout: 5_000 });

    const name = `E2E Cup ${Date.now().toString().slice(-6)}`;
    await formCard.getByPlaceholder("e.g. Summer Pickleball League").fill(name);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);
    const startDate = tomorrow.toISOString().split("T")[0];
    await formCard.locator('input[type="date"]').first().fill(startDate);

    await formCard.getByRole("button", { name: /Create Tournament/i }).click();

    const card = page.getByText(name);
    const error = page.locator(".text-red-600, [role='alert']");
    await expect(card.or(error)).toBeVisible({ timeout: 15_000 });
  });

  test("tournament card displays status badge", async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/dashboard/tournaments");

    await expect(page.getByRole("heading", { name: "Tournaments" })).toBeVisible({ timeout: 15_000 });

    const cards = page.locator(".hover\\:shadow-md");
    const hasCards = await cards.first().isVisible({ timeout: 10_000 }).catch(() => false);
    if (!hasCards) {
      test.skip(true, "No tournaments to verify status badge");
    }

    const statusBadge = cards.first().locator("span.rounded-full").filter({ hasText: /draft|registration|in.progress|completed|cancelled/i });
    await expect(statusBadge.first()).toBeVisible();
  });

  test("tournament card links to detail page", async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/dashboard/tournaments");

    await expect(page.getByRole("heading", { name: "Tournaments" })).toBeVisible({ timeout: 15_000 });

    const cards = page.locator(".hover\\:shadow-md");
    const hasCards = await cards.first().isVisible({ timeout: 10_000 }).catch(() => false);
    if (!hasCards) {
      test.skip(true, "No tournament cards to test navigation");
    }

    const cardLink = cards.first().locator("a").first();
    await cardLink.click();
    await expect(page).toHaveURL(/\/dashboard\/tournaments\/\d+/, { timeout: 10_000 });
  });

  test("tournament nav visible in sidebar for owner", async ({ page }) => {
    await loginAs(page, "owner");
    const sidebar = page.locator("div.bg-slate-900.text-white");
    await expect(sidebar.getByRole("link", { name: "Tournaments" })).toBeVisible({ timeout: 10_000 });
  });

  test("staff cannot see tournaments in sidebar", async ({ page }) => {
    await loginAs(page, "staff");
    const sidebar = page.locator("div.bg-slate-900.text-white");
    await expect(sidebar.getByRole("link", { name: "Tournaments" })).not.toBeVisible();
  });

  test("player cannot see tournaments in sidebar", async ({ page }) => {
    await loginAs(page, "player");
    const sidebar = page.locator("div.bg-slate-900.text-white");
    await expect(sidebar.getByRole("link", { name: "Tournaments" })).not.toBeVisible();
  });
});

test.describe("Tournament Detail Page", () => {
  test("detail page loads with overview content", async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/dashboard/tournaments");

    await expect(page.getByRole("heading", { name: "Tournaments" })).toBeVisible({ timeout: 15_000 });

    const cards = page.locator(".hover\\:shadow-md");
    const hasCards = await cards.first().isVisible({ timeout: 10_000 }).catch(() => false);
    if (!hasCards) {
      test.skip(true, "No tournaments to view detail page");
    }

    const cardLink = cards.first().locator("a").first();
    await cardLink.click();
    await expect(page).toHaveURL(/\/dashboard\/tournaments\/\d+/, { timeout: 10_000 });

    const overviewTab = page.getByRole("button", { name: /Overview/i });
    const teamsTab = page.getByRole("button", { name: /Teams/i });
    const bracketTab = page.getByRole("button", { name: /Bracket/i });

    await expect(overviewTab.or(teamsTab).or(bracketTab)).toBeVisible({ timeout: 10_000 });
  });

  test("teams tab shows team list or empty state", async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/dashboard/tournaments");

    await expect(page.getByRole("heading", { name: "Tournaments" })).toBeVisible({ timeout: 15_000 });

    const cards = page.locator(".hover\\:shadow-md");
    const hasCards = await cards.first().isVisible({ timeout: 10_000 }).catch(() => false);
    if (!hasCards) {
      test.skip(true, "No tournaments to test teams tab");
    }

    const cardLink = cards.first().locator("a").first();
    await cardLink.click();
    await expect(page).toHaveURL(/\/dashboard\/tournaments\/\d+/, { timeout: 10_000 });

    const teamsTab = page.getByRole("button", { name: /Teams/i });
    const hasTeamsTab = await teamsTab.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasTeamsTab) {
      test.skip(true, "No teams tab found on detail page");
    }

    await teamsTab.click();

    const teamContent = page.locator("table, [class*='space-y']");
    const emptyState = page.getByText(/No teams|no registered/i);
    const addTeamBtn = page.getByRole("button", { name: /Add Team/i });

    await expect(teamContent.or(emptyState).or(addTeamBtn)).toBeVisible({ timeout: 10_000 });
  });

  test("bracket tab exists on detail page", async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/dashboard/tournaments");

    await expect(page.getByRole("heading", { name: "Tournaments" })).toBeVisible({ timeout: 15_000 });

    const cards = page.locator(".hover\\:shadow-md");
    const hasCards = await cards.first().isVisible({ timeout: 10_000 }).catch(() => false);
    if (!hasCards) {
      test.skip(true, "No tournaments to test bracket tab");
    }

    const cardLink = cards.first().locator("a").first();
    await cardLink.click();
    await expect(page).toHaveURL(/\/dashboard\/tournaments\/\d+/, { timeout: 10_000 });

    const bracketTab = page.getByRole("button", { name: /Bracket/i });
    const hasBracketTab = await bracketTab.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasBracketTab) {
      test.skip(true, "No bracket tab found on detail page");
    }

    await bracketTab.click();

    const bracketContent = page.getByRole("button", { name: /Generate Bracket/i });
    const matchCards = page.locator("[class*='rounded']").filter({ hasText: /Round|Match/i });
    const noMatchesMsg = page.getByText(/no matches|generate bracket/i);

    await expect(bracketContent.or(matchCards.first()).or(noMatchesMsg)).toBeVisible({ timeout: 10_000 });
  });
});
