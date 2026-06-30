import { defineTool } from 'eve/tools'
import { never } from 'eve/tools/approval'
import { z } from 'zod'

export default defineTool({
  needsApproval: never(),
  description: 'Fetches a CSV file from a URL and returns its raw text content.',
  inputSchema: z.object({
    url: z.string().url(),
  }),
  async execute({ url }) {
    const content = await fetch(url).then((r) => r.text())
    return { content, url }
  },
})
