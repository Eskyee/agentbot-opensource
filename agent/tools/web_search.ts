import { defineTool } from 'eve/tools'
import { never } from 'eve/tools/approval'
import { z } from 'zod'

export default defineTool({
  needsApproval: never(),
  description:
    'Searches the web and returns ranked results with titles, URLs, and text snippets.',
  inputSchema: z.object({
    query: z.string(),
    numResults: z.number().min(1).max(10).default(5),
  }),
  async execute({ query, numResults }) {
    const res = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.EXA_API_KEY ?? '',
      },
      body: JSON.stringify({
        query,
        numResults,
        contents: { text: true },
      }),
    })
    return res.json()
  },
})
