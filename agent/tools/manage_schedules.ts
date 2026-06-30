import { defineTool } from 'eve/tools';
import { z } from 'zod';
import { backendGet, backendPost, backendDelete } from '../lib/agentbot-api';

export default defineTool({
  description:
    'Manage scheduled tasks via the agentbot backend. Tasks are one-shot: they fire at runAt (default now) when the scheduler claims them; cron is stored for reference.',
  inputSchema: z.object({
    action: z.enum(['create', 'list', 'delete']).describe('Action to perform'),
    id: z.string().optional().describe('Task id (required for delete)'),
    agentId: z.string().optional().describe('Agent the task belongs to'),
    name: z.string().optional().describe('Task name'),
    cron: z
      .string()
      .optional()
      .describe("Cron expression, stored for reference (e.g. '0 9 * * 1-5')"),
    prompt: z.string().optional().describe('What the agent should do when triggered'),
    agentUrl: z
      .string()
      .optional()
      .describe('Agent execute URL the scheduler POSTs to when the task fires'),
    runAt: z.string().optional().describe('ISO 8601 time to run (defaults to now)'),
  }),
  async execute(input, ctx) {
    const user = {
      userId: ctx.session.auth?.sub || '',
      email: ctx.session.auth?.email || '',
    };
    if (input.action === 'list') {
      return backendGet('/api/schedules', undefined, user);
    }
    if (input.action === 'delete') {
      if (!input.id) throw new Error('id is required to delete a scheduled task');
      return backendDelete(`/api/schedules/${encodeURIComponent(input.id)}`, user);
    }
    return backendPost(
      '/api/schedules',
      {
        agentId: input.agentId,
        name: input.name,
        cron: input.cron,
        prompt: input.prompt,
        agentUrl: input.agentUrl,
        runAt: input.runAt,
      },
      user
    );
  },
});
