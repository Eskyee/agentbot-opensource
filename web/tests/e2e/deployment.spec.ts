import { test, expect } from '@playwright/test';

/**
 * Deployment E2E Tests
 * Tests critical user flows for production deployment readiness
 */

test.describe('Deployment Health Checks', () => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

  test('homepage loads successfully', async ({ page }) => {
    const response = await page.goto(baseUrl);

    await expect(page.locator('body')).toBeVisible();
    await expect(page).toHaveTitle(/agentbot|Agentbot/i);

    const statusCode = response?.status() || 200;
    expect(statusCode).toBe(200);
  });

  test('health check endpoint responds', async ({ request }) => {
    const response = await request.get(`${baseUrl}/api/health`);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(body.status).toBe('ok');
    expect(body).toHaveProperty('timestamp');
  });
});

test.describe('User Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(process.env.BASE_URL || 'http://localhost:3000');
  });

  test('login page is accessible', async ({ page }) => {
    await page.click('text=Login');
    await expect(page).toHaveURL(/\/login|\/auth\/signin/i);
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('OAuth providers are displayed', async ({ page }) => {
    await page.click('text=Login');

    await expect(page.locator('text=Google|Continue with Google')).toBeVisible();
    await expect(page.locator('text=GitHub|Continue with GitHub')).toBeVisible();
  });

  test('signup page is accessible', async ({ page }) => {
    await page.click('text=Sign up|Create account');
    await expect(page).toHaveURL(/\/signup|\/auth\/signup/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});

test.describe('Dashboard Access', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(process.env.BASE_URL || 'http://localhost:3000');
  });

  test('dashboard link exists in navigation', async ({ page }) => {
    const dashboardLink = page.locator('a[href*="dashboard"], a[href*="/dash"]');

    await expect(dashboardLink.first()).toBeVisible();
  });

  test('protected routes redirect to authentication', async ({ page }) => {
    await page.goto('/dashboard');

    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/login|\/auth\/signin|\/sign-in/i);
  });
});

test.describe('API Endpoints', () => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

  test('stats endpoint returns valid data', async ({ request }) => {
    const response = await request.get(`${baseUrl}/api/stats`);

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body).toHaveProperty('cpu');
    expect(body).toHaveProperty('memory');
    expect(body).toHaveProperty('health');
    expect(body).toHaveProperty('timestamp');

    expect(typeof body.cpu).toBe('number');
    expect(typeof body.memory).toBe('number');
    expect(body.health).toMatch(/healthy|degraded|unhealthy/i);
  });

  test('health endpoint includes system metrics', async ({ request }) => {
    const response = await request.get(`${baseUrl}/api/health`);

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('health');
    expect(body).toHaveProperty('cpu');
    expect(body).toHaveProperty('memory');

    expect(body.status).toBe('ok');
    expect(body.health).toMatch(/healthy|degraded|unhealthy/i);
  });

  test('404 endpoint correctly handles not found', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-12345');

    expect(response?.status()).toBe(404);
    await expect(page.locator('text=404|Not Found')).toBeVisible();
  });
});

test.describe('Security Headers', () => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

  test('X-Frame-Options header is set', async ({ page }) => {
    const response = await page.goto(baseUrl);
    const headers = response?.headers();

    expect(headers?.['x-frame-options']).toBeDefined();
    expect(headers?.['x-frame-options'].toLowerCase()).toBe('deny');
  });

  test('X-Content-Type-Options header is set', async ({ page }) => {
    const response = await page.goto(baseUrl);
    const headers = response?.headers();

    expect(headers?.['x-content-type-options']).toBeDefined();
    expect(headers?.['x-content-type-options'].toLowerCase()).toBe('nosniff');
  });

  test('Referrer-Policy header is set', async ({ page }) => {
    const response = await page.goto(baseUrl);
    const headers = response?.headers();

    expect(headers?.['referrer-policy']).toBeDefined();
  });
});

test.describe('Database Connectivity', () => {
  test('database URL is not exposed in frontend', async ({ page, request }) => {
    const response = await request.get(process.env.BASE_URL || 'http://localhost:3000');
    const html = await response.text();

    expect(html).not.toMatch(/DATABASE_URL|postgresql:|mysql:/i);
    expect(html).not.toMatch(/\/\/.*@/);
  });
});

test.describe('Frontend Build Assets', () => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

  test('JavaScript bundles load successfully', async ({ page }) => {
    const response = await page.goto(baseUrl);
    const scripts = await page.$$eval('script[src]', scripts =>
      scripts.map(s => s.getAttribute('src'))
    );

    const scriptUrls = scripts.filter(Boolean);
    expect(scriptUrls.length).toBeGreaterThan(0);
  });

  test('CSS styles load successfully', async ({ page }) => {
    const response = await page.goto(baseUrl);
    const stylesheets = await page.$$eval('link[rel="stylesheet"]', links =>
      links.map(l => l.getAttribute('href'))
    );

    const styleUrls = stylesheets.filter(Boolean);
    expect(styleUrls.length).toBeGreaterThan(0);
  });
});

test.describe('Error Handling', () => {
  test('unauthorized API request returns 401', async ({ request }) => {
    const response = await request.get('/api/agents', {
      headers: { Authorization: '' }
    });

    expect(response.status()).toBe(401);
  });

  test('malformed API request returns 400', async ({ request }) => {
    const response = await request.post('/api/deployments', {
      data: { invalid: 'data' }
    });

    expect(response.status()).toBe(400 || 401);
  });
});

test.describe('Performance', () => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

  test('homepage loads under 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000);
  });

  test('LCP (Largest Contentful Paint) is reasonable', async ({ page }) => {
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime + lastEntry.duration);
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      });
    });

    expect(lcp).toBeLessThan(4000);
  });
});
