import { defineTool } from 'eve/tools'
import { never } from 'eve/tools/approval'
import { z } from 'zod'
import { getPage, snapshot } from '../lib/browser'

export default defineTool({
  needsApproval: never(),
  description:
    'Returns the current page snapshot: title, URL, visible text, and interactive elements with selectors.',
  inputSchema: z.object({}),
  async execute() {
    const page = await getPage()
    return snapshot(page)
  },
})
