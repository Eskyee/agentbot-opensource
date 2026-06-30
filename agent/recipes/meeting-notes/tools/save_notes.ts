import { defineTool } from 'eve/tools'
import { never } from 'eve/tools/approval'
import { z } from 'zod'

export default defineTool({
  needsApproval: never(),
  description:
    'Saves the structured meeting notes. Call this once the transcript has been fully processed.',
  inputSchema: z.object({
    summary: z.string(),
    decisions: z.array(z.string()),
    actionItems: z.array(z.object({
      owner: z.string(),
      task: z.string(),
    })),
    openQuestions: z.array(z.string()),
  }),
  async execute(notes) {
    return notes
  },
})
