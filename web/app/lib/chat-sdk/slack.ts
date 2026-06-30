/**
 * Slack Adapter for Agentbot
 *
 * Uses Vercel Chat SDK to connect Agentbot agents to Slack.
 * Supports: AI streaming, interactive cards, slash commands, thread subscriptions.
 *
 * See: https://chat-sdk.dev/docs/adapters/slack
 */

export interface SlackBotConfig {
  userName: string;
  model?: string;
  systemPrompt?: string;
}

// The Vercel Chat SDK (`chat`) was removed during the migration to the eve
// agent framework + AI Gateway (it pinned ai v6, incompatible with eve's ai v7).
// Slack support via the Chat SDK is not currently wired; this is a placeholder.
export function createSlackBot(_config: SlackBotConfig): never {
  throw new Error('Slack Chat SDK adapter is not available in this build.');
}

export const SLACK_COMMANDS = [
  {
    command: '/agent',
    description: 'Ask the agent a question',
    handler: 'handleAgentCommand',
  },
  {
    command: '/help',
    description: 'Show available commands',
    handler: 'handleHelpCommand',
  },
  {
    command: '/status',
    description: 'Check agent status',
    handler: 'handleStatusCommand',
  },
  {
    command: '/deploy',
    description: 'Deploy an agent',
    handler: 'handleDeployCommand',
  },
];

export const SLACK_CARD_TEMPLATES = {
  agentStatus: (agentName: string, status: string, uptime: string) => ({
    type: 'template',
    template: {
      type: 'message',
      components: [
        {
          type: 'header',
          text: { type: 'plain_text', text: `${agentName} Status` },
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `*Status:* ${status}\n*Uptime:* ${uptime}` },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'View Dashboard' },
              url: 'https://agentbot.sh/dashboard',
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: 'Configure' },
              url: 'https://agentbot.sh/settings',
            },
          ],
        },
      ],
    },
  }),
  alert: (title: string, message: string, severity: 'info' | 'warning' | 'error') => ({
    type: 'template',
    template: {
      type: 'message',
      components: [
        {
          type: 'header',
          text: { type: 'plain_text', text: title },
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: message },
        },
      ],
    },
  }),
};
