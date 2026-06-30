import { defineTool } from 'eve/tools'
import { never } from 'eve/tools/approval'
import { z } from 'zod'
import { indexDoc } from '../lib/vector-store'

export default defineTool({
  needsApproval: never(),
  description:
    'Adds a document to the knowledge corpus by chunking and embedding it.',
  inputSchema: z.object({
    source: z.string(),
    content: z.string(),
  }),
  async execute({ source, content }) {
    const chunks = await indexDoc({ source, content })
    return { chunks, source }
  },
})
