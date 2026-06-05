/**
 * Playwright Network Capture — generates a Postman collection from observed API calls.
 * Run: npx tsx scripts/capture-api-traffic.ts
 */
import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

interface CapturedRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  status?: number;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const OUTPUT = process.env.OUTPUT || 'postman/collections/agentbot-api-captured.json';

const PAGES = [
  '/',
  '/login',
  '/pricing',
  '/demo',
  '/documentation',
  '/partner/mimo',
  '/showcase',
  '/why',
];

async function captureTraffic() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const captured: CapturedRequest[] = [];
  const seen = new Set<string>();

  page.on('request', (req) => {
    const url = req.url();
    if (!url.startsWith(BASE_URL) || url.includes('_next') || url.includes('static')) return;
    
    const key = `${req.method()} ${url}`;
    if (seen.has(key)) return;
    seen.add(key);

    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.headers())) {
      if (k.toLowerCase() !== 'cookie') headers[k] = v;
    }

    captured.push({
      method: req.method(),
      url: url.replace(BASE_URL, ''),
      headers,
      body: req.postData() || undefined,
    });
  });

  page.on('response', async (res) => {
    const url = res.url();
    if (!url.startsWith(BASE_URL)) return;
    
    const entry = captured.find(c => c.url === url.replace(BASE_URL, '') && !c.status);
    if (!entry) return;

    entry.status = res.status();
    const rh: Record<string, string> = {};
    for (const [k, v] of Object.entries(res.headers())) {
      if (k.toLowerCase() !== 'set-cookie') rh[k] = v;
    }
    entry.responseHeaders = rh;

    try {
      const ct = res.headers()['content-type'] || '';
      if (ct.includes('json')) {
        entry.responseBody = await res.text();
      }
    } catch {}
  });

  console.log(`Capturing API traffic from ${PAGES.length} pages...`);

  for (const p of PAGES) {
    try {
      console.log(`  → ${p}`);
      await page.goto(`${BASE_URL}${p}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(1000);
    } catch (e: any) {
      console.log(`    ⚠ ${p}: ${e.message?.substring(0, 60)}`);
    }
  }

  await browser.close();

  // Build Postman collection
  const folders = new Map<string, any[]>();

  for (const req of captured) {
    const parts = req.url.split('/').filter(Boolean);
    const folder = parts.length > 1 ? parts[0] : 'root';
    if (!folders.has(folder)) folders.set(folder, []);

    const urlPath = req.url;
    const name = `${req.method} ${urlPath}`;

    folders.get(folder)!.push({
      name,
      request: {
        method: req.method,
        header: Object.entries(req.headers).map(([key, value]) => ({ key, value, type: 'text' })),
        url: {
          raw: `{{baseUrl}}${urlPath}`,
          host: ['{{baseUrl}}'],
          path: parts,
        },
        ...(req.body ? { body: { mode: 'raw', raw: req.body, options: { raw: { language: 'json' } } } } : {}),
      },
      response: req.status ? [{
        name: `${req.status}`,
        status: req.status.toString(),
        header: req.responseHeaders ? Object.entries(req.responseHeaders).map(([key, value]) => ({ key, value })) : [],
        body: req.responseBody?.substring(0, 2000) || '',
      }] : [],
    });
  }

  const collection = {
    info: {
      name: 'Agentbot API (Captured)',
      description: `Auto-generated from Playwright traffic capture on ${new Date().toISOString()}`,
      schema: 'https://schema.getpostman.com/json/collection/v2.0.0/collection.json',
    },
    variable: [
      { key: 'baseUrl', value: BASE_URL },
    ],
    item: Array.from(folders.entries()).map(([name, items]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      item: items,
    })),
  };

  // Ensure output directory exists
  const outDir = path.dirname(OUTPUT);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(OUTPUT, JSON.stringify(collection, null, 2));
  console.log(`\n✅ Captured ${captured.length} API calls → ${OUTPUT}`);
  console.log(`   Folders: ${folders.size}`);
  console.log(`   Pages scanned: ${PAGES.length}`);
}

captureTraffic().catch(console.error);
