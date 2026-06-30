import { defineTool } from 'eve/tools'
import { never } from 'eve/tools/approval'
import { z } from 'zod'
import { getPage, snapshot } from '../lib/browser'

export default defineTool({
  needsApproval: never(),
  description:
    'Clicks the element matching the given selector (from a snapshot) and returns the resulting page snapshot.',
  inputSchema: z.object({
    selector: z.string(),
  }),
  async execute({ selector }) {
    const page = await getPage()
    await page.click(selector)
    await page.waitForLoadState('domcontentloaded').catch(() => {})
    return snapshot(page)
  },
})
