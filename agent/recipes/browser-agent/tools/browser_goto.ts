import { defineTool } from 'eve/tools'
import { never } from 'eve/tools/approval'
import { z } from 'zod'
import { getPage, snapshot } from '../lib/browser'

export default defineTool({
  needsApproval: never(),
  description: 'Navigates the browser to a URL and returns a snapshot of the page.',
  inputSchema: z.object({
    url: z.string().url(),
  }),
  async execute({ url }) {
    const page = await getPage()
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    return snapshot(page)
  },
})
