import { defineTool } from 'eve/tools'
import { z } from 'zod'

export default defineTool({
  description:
    'List the messaging channels an Agentbot agent can be deployed to (where users can talk to their agent).',
  inputSchema: z.object({}),
  async execute() {
    return {
      channels: [
        { name: 'Telegram', kind: 'chat' },
        { name: 'Discord', kind: 'chat' },
        { name: 'WhatsApp', kind: 'chat' },
        { name: 'X', kind: 'social' },
      ],
    }
  },
})
