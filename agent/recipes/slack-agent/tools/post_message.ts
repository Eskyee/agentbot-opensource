import { defineTool } from 'eve/tools'
import { always } from 'eve/tools/approval'
import { z } from 'zod'

export default defineTool({
  needsApproval: always(),
  description:
    'Posts a message to a Slack channel, optionally threaded under a parent message.',
  inputSchema: z.object({
    channel: z.string(),
    text: z.string(),
    threadTs: z.string().optional(),
  }),
  async execute({ channel, text, threadTs }) {
    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN ?? ''}`,
      },
      body: JSON.stringify({ channel, text, thread_ts: threadTs }),
    })
    return res.json()
  },
})
