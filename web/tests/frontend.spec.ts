import { test, expect } from '@playwright/test';

// These tests run against `BASE_URL` (defaults to http://localhost:3000 from
// playwright.config.ts). In CI we boot `next start` against a stub Postgres
// URL, so any test that requires a live database, authenticated session, or
// the Railway backend is gated with `test.skip(!!process.env.CI, …)`.

test.describe('Agentbot Frontend', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Agentbot/);
    // The hero copy was updated April 2026 — match the current headline.
    await expect(
      page.getByRole('heading', { name: /Deploy an/i })
    ).toBeVisible();
  });

  test('pricing page loads', async ({ page }) => {
    await page.goto('/pricing');
    // Hero on /pricing currently reads "One Creative Crew, One Business Mind"
    // and tier prices are £29 / £69 / £149 / £499 per month.
    await expect(page.getByText(/One Creative Crew/i)).toBeVisible();
    await expect(page.getByText('£29').first()).toBeVisible();
  });

  test('login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Welcome to Agentbot')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  });

  test('documentation page loads', async ({ page }) => {
    await page.goto('/documentation');
    await expect(page.getByRole('heading', { name: 'Docs' })).toBeVisible();
  });

  test('blog page loads', async ({ page }) => {
    test.skip(!!process.env.CI, 'Blog page reads from auto-blog content; skipped in CI without seeded data');
    await page.goto('/blog');
    await expect(page.getByRole('heading', { name: 'Blog' })).toBeVisible();
  });

  test('navbar has correct links', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation').first();
    await expect(nav.getByRole('link', { name: 'Docs' }).first()).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Marketplace' }).first()).toBeVisible();
  });

  test('dashboard loads', async ({ page }) => {
    test.skip(!!process.env.CI, 'Requires authenticated session; redirects to /login in CI');
    await page.goto('/dashboard');
    await expect(page.getByText('Dashboard')).toBeVisible();
  });

  test('trading page loads', async ({ page }) => {
    test.skip(!!process.env.CI, 'Requires authenticated session; redirects to /login in CI');
    await page.goto('/dashboard/trading');
    await expect(page.getByText('Trading Agent')).toBeVisible();
  });
});
