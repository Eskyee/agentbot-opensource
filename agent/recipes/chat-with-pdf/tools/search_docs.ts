import { defineTool } from 'eve/tools'
import { never } from 'eve/tools/approval'
import { z } from 'zod'
import { search } from '../lib/vector-store'

export default defineTool({
  needsApproval: never(),
  description:
    'Retrieves the most relevant PDF chunks for a question, including the page number of each chunk for citation.',
  inputSchema: z.object({
    query: z.string(),
    topK: z.number().min(1).max(10).default(5),
  }),
  async execute({ query, topK }) {
    const hits = await search(query, topK)
    return { hits }
  },
})
