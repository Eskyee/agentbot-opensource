import { type Browser, chromium, type Page } from 'playwright'

let browser: Browser | null = null
let page: Page | null = null

/** Returns a shared page, launching a browser on first use. */
export async function getPage(): Promise<Page> {
  if (!browser) {
    const cdpUrl = process.env.BROWSER_CDP_URL
    browser = cdpUrl
      ? await chromium.connectOverCDP(cdpUrl)
      : await chromium.launch({ headless: process.env.BROWSER_HEADLESS !== 'false' })
  }
  if (!page) {
    page = await browser.newPage()
  }
  return page
}

/** Captures a lightweight snapshot: page text plus interactive elements + selectors. */
export async function snapshot(page: Page) {
  const elements = await page.$$eval(
    'a, button, input, textarea, select, [role="button"]',
    (nodes) =>
      nodes.slice(0, 60).map((node, index) => {
        const el = node as HTMLElement
        const tag = el.tagName.toLowerCase()
        const label =
          el.getAttribute('aria-label') ||
          el.getAttribute('placeholder') ||
          el.textContent?.trim().slice(0, 80) ||
          el.getAttribute('name') ||
          ''
        return { index, tag, label, selector: `${tag}:nth-of-type(${index + 1})` }
      })
  )
  return {
    url: page.url(),
    title: await page.title(),
    text: (await page.evaluate(() => document.body.innerText)).slice(0, 4000),
    elements,
  }
}
