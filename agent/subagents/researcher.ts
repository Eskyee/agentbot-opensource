import { defineAgent } from 'eve';

export default defineAgent({
  description: 'Research agent that gathers information from the web and documentation.',
  model: 'anthropic/claude-sonnet-4',
});
