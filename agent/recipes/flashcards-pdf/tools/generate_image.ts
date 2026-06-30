import { defineTool } from 'eve/tools'
import { always } from 'eve/tools/approval'
import { z } from 'zod'

export default defineTool({
  needsApproval: always(),
  description:
    'Generates an illustrative image for a flash-card concept and returns its URL.',
  inputSchema: z.object({
    prompt: z.string(),
  }),
  async execute({ prompt }) {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ''}`,
      },
      body: JSON.stringify({ model: 'gpt-image-1', prompt, size: '1024x1024' }),
    })
    const data = (await res.json()) as { data?: { url?: string }[] }
    return { url: data.data?.[0]?.url ?? '' }
  },
})
