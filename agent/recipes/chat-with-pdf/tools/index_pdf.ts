import { defineTool } from 'eve/tools'
import { never } from 'eve/tools/approval'
import { extractText, getDocumentProxy } from 'unpdf'
import { z } from 'zod'
import { chunkText, upsertChunks } from '../lib/vector-store'

export default defineTool({
  needsApproval: never(),
  description:
    'Downloads a PDF, splits each page into chunks, embeds them, and stores them for retrieval.',
  inputSchema: z.object({
    url: z.string().url(),
    doc: z.string().optional(),
  }),
  async execute({ url, doc }) {
    const buffer = await fetch(url).then((r) => r.arrayBuffer())
    const pdf = await getDocumentProxy(new Uint8Array(buffer))
    const { text } = await extractText(pdf, { mergePages: false })

    const chunks = text.flatMap((pageText, i) =>
      chunkText(pageText).map((content) => ({
        doc: doc ?? url,
        page: i + 1,
        content,
      }))
    )

    await upsertChunks(chunks)
    return { chunks: chunks.length, doc: doc ?? url, pages: text.length }
  },
})
