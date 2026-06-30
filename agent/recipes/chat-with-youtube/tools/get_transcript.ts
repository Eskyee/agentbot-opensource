import { defineTool } from 'eve/tools'
import { never } from 'eve/tools/approval'
import { YoutubeTranscript } from 'youtube-transcript'
import { z } from 'zod'

export default defineTool({
  needsApproval: never(),
  description:
    'Fetches the timestamped transcript of a YouTube video as an array of { text, seconds } segments.',
  inputSchema: z.object({
    url: z.string().url(),
  }),
  async execute({ url }) {
    const segments = await YoutubeTranscript.fetchTranscript(url)
    return {
      segments: segments.map((s) => ({
        seconds: Math.floor(s.offset / 1000),
        text: s.text,
      })),
    }
  },
})
