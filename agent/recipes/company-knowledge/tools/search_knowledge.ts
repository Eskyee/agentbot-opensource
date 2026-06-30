import { defineTool } from 'eve/tools'
import { never } from 'eve/tools/approval'
import { z } from 'zod'
import { redactPii } from '../lib/pii'
import { searchDocs } from '../lib/vector-store'

export default defineTool({
  needsApproval: never(),
  description:
    'Searches the company knowledge corpus and returns the most relevant passages (with PII redacted) and their sources.',
  inputSchema: z.object({
    query: z.string(),
    topK: z.number().min(1).max(10).default(5),
  }),
  async execute({ query, topK }) {
    const hits = await searchDocs(query, topK)
    const results = hits.map((row) => ({
      content: redactPii(String(row.content)),
      source: row.source,
    }))
    return { results }
  },
})
