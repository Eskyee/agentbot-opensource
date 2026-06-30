import { defineTool } from 'eve/tools'
import { never } from 'eve/tools/approval'
import { z } from 'zod'
import { getPage, snapshot } from '../lib/browser'

export default defineTool({
  needsApproval: never(),
  description:
    'Types text into the input matching the selector (optionally pressing Enter), then returns a snapshot.',
  inputSchema: z.object({
    selector: z.string(),
    text: z.string(),
    submit: z.boolean().default(false),
  }),
  async execute({ selector, text, submit }) {
    const page = await getPage()
    await page.fill(selector, text)
    if (submit) {
      await page.press(selector, 'Enter')
      await page.waitForLoadState('domcontentloaded').catch(() => {})
    }
    return snapshot(page)
  },
})
