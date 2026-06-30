import { defineTool } from 'eve/tools';
import { z } from 'zod';
import { backendGet } from '../lib/agentbot-api';

export default defineTool({
  description:
    "Query a user's agent metrics from the agentbot backend: a business summary, a live performance snapshot, or a historical time series.",
  inputSchema: z.object({
    view: z
      .enum(['summary', 'performance', 'historical'])
      .default('summary')
      .describe(
        'summary = business KPIs, performance = live CPU/memory/error rate, historical = time series'
      ),
    range: z
      .enum(['1h', '24h', '7d', '30d'])
      .optional()
      .describe('Time range for the historical view (defaults to 24h)'),
  }),
  async execute(input, ctx) {
    const user = {
      userId: ctx.session.auth?.sub || '',
      email: ctx.session.auth?.email || '',
    };
    const userId = encodeURIComponent(user.userId);
    if (input.view === 'performance') {
      return backendGet(`/api/metrics/${userId}/performance`, undefined, user);
    }
    if (input.view === 'historical') {
      return backendGet(`/api/metrics/${userId}/historical`, { range: input.range || '24h' }, user);
    }
    return backendGet(`/api/metrics/${userId}/summary`, undefined, user);
  },
});
