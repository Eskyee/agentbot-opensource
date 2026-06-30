import { defineTool } from 'eve/tools';
import { z } from 'zod';
import { backendGet } from '../lib/agentbot-api';

export default defineTool({
  description:
    'List connected services for the current user (GitHub, Linear, Slack, etc.). Shows which integrations are active and their status.',
  inputSchema: z.object({}),
  async execute(_input, ctx) {
    const user = {
      userId: ctx.session.auth?.sub || '',
      email: ctx.session.auth?.email || '',
    };
    return backendGet('/api/user-connections', undefined, user);
  },
});
