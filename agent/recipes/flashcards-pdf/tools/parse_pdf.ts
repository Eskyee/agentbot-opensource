import { defineTool } from 'eve/tools'
import { never } from 'eve/tools/approval'
import { extractText, getDocumentProxy } from 'unpdf'
import { z } from 'zod'

export default defineTool({
  needsApproval: never(),
  description: 'Extracts the full text content from a PDF at the given URL.',
  inputSchema: z.object({
    url: z.string().url(),
  }),
  async execute({ url }) {
    const buffer = await fetch(url).then((r) => r.arrayBuffer())
    const pdf = await getDocumentProxy(new Uint8Array(buffer))
    const { text } = await extractText(pdf, { mergePages: true })
    return { text }
  },
})
