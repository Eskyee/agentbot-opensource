import { defineTool } from 'eve/tools';
import { z } from 'zod';
import { backendGet } from '../lib/agentbot-api';

export default defineTool({
  description:
    'Get the status and details of an agent by its ID, or list all agents when no ID is given.',
  inputSchema: z.object({
    agentId: z.string().optional().describe('Agent ID to look up. Omit to list all agents.'),
  }),
  async execute(input, ctx) {
    const user = {
      userId: ctx.session.auth?.sub || '',
      email: ctx.session.auth?.email || '',
    };
    if (input.agentId) {
      return backendGet(`/api/agents/${encodeURIComponent(input.agentId)}`, undefined, user);
    }
    return backendGet('/api/agents', undefined, user);
  },
});
