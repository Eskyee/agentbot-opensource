import { expect, test } from '@playwright/test'

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:3007'
const shouldRun = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/i.test(baseUrl)

test.describe('OpenClaude playground', () => {
  test.skip(!shouldRun, 'Playground E2E uses the local mock server path.')

  test('generates files and publishes through the local fallback path', async ({ page }) => {
    const pageErrors: string[] = []
    const hydrationErrors: string[] = []

    page.on('pageerror', (error) => pageErrors.push(error.message))
    page.on('console', (message) => {
      if (message.type() !== 'error') return
      const text = message.text()
      if (/hydration|writeText|NotAllowed|Recoverable/i.test(text)) {
        hydrationErrors.push(text)
      }
    })

    await page.goto(`${baseUrl}/playground`)
    await page.evaluate(() => localStorage.removeItem('agentbot:openclaude-playground:projects:v1'))
    await page.reload()

    await expect(page.getByText('What should we build?')).toBeVisible()

    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.getByText('Files 14').first()).toBeVisible()

    await page.evaluate(() => {
      [...document.querySelectorAll('button')]
        .find((button) => button.textContent?.trim() === 'Publish')
        ?.click()
    })
    await expect(page.getByRole('heading', { name: 'Publish project' })).toBeVisible()

    await page.evaluate(() => {
      [...document.querySelectorAll('button')]
        .filter((button) => button.textContent?.trim() === 'Publish')
        .at(-1)
        ?.click()
    })
    await expect(page.getByText('LOCAL_PREVIEW')).toBeVisible()
    await expect(page.getByText('gitlawb.app')).toBeVisible()

    await page.getByRole('button', { name: 'Refresh status' }).click()
    await expect(page.getByText('LOCAL_PREVIEW')).toBeVisible()

    expect(pageErrors).toEqual([])
    expect(hydrationErrors).toEqual([])
  })
})
