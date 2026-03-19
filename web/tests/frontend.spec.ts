import { test, expect } from '@playwright/test';

test.describe('Agentbot Frontend', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Agentbot/);
    await expect(page.getByRole('heading', { name: 'Deploy OpenClaw in 60 Seconds' })).toBeVisible();
  });

  test('pricing page loads', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.getByText('Simple Pricing')).toBeVisible();
    await expect(page.getByText('£9/mo')).toBeVisible();
  });

  test('login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Welcome to Agentbot')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  });

  test('docs page loads', async ({ page }) => {
    await page.goto('/docs');
    await expect(page.getByRole('heading', { name: 'View Docs' })).toBeVisible();
  });

  test('blog page loads', async ({ page }) => {
    await page.goto('/blog');
    await expect(page.getByRole('heading', { name: 'Blog' })).toBeVisible();
  });

  test('footer has correct links', async ({ page }) => {
    await page.goto('/');
    const footer = page.getByRole('contentinfo');
    await expect(footer).toContainText('Moltx');
    await expect(footer).toContainText('Moltbook');
  });

  test('navbar has correct links', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation');
    await expect(nav.getByRole('link', { name: 'Docs' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Marketplace' })).toBeVisible();
  });

  test('dashboard loads', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText('Dashboard')).toBeVisible();
  });

  test('trading page loads', async ({ page }) => {
    await page.goto('/dashboard/trading');
    await expect(page.getByText('Trading Agent')).toBeVisible();
  });
});
