import { defineTool } from 'eve/tools'
import { never } from 'eve/tools/approval'
import { z } from 'zod'

export default defineTool({
  needsApproval: never(),
  description: 'Fetches a YouTube video\'s title, author, and id from its URL.',
  inputSchema: z.object({
    url: z.string().url(),
  }),
  async execute({ url }) {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
    )
    const meta = (await res.json()) as { title?: string; author_name?: string }
    const id = new URL(url).searchParams.get('v') ?? url.split('/').pop()
    return { author: meta.author_name, id, title: meta.title }
  },
})
