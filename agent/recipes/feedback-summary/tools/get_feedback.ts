import { defineTool } from 'eve/tools'
import { never } from 'eve/tools/approval'
import { z } from 'zod'

export default defineTool({
  needsApproval: never(),
  description:
    'Retrieves a page of customer feedback entries from the feedback data source.',
  inputSchema: z.object({
    page: z.number().min(1).default(1),
    pageSize: z.number().min(1).max(100).default(50),
    segment: z.string().optional(),
  }),
  async execute({ page, pageSize, segment }) {
    const url = new URL(process.env.FEEDBACK_API_URL ?? 'http://localhost:4111/feedback')
    url.searchParams.set('page', String(page))
    url.searchParams.set('pageSize', String(pageSize))
    if (segment) {
      url.searchParams.set('segment', segment)
    }
    const res = await fetch(url)
    return { entries: await res.json() }
  },
})
