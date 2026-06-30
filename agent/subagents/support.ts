import { defineAgent } from 'eve';

export default defineAgent({
  description: 'Support agent that handles customer inquiries and troubleshoots issues.',
  model: 'anthropic/claude-sonnet-4',
});
