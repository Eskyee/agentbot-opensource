/**
 * Microsoft Teams Adapter for Agentbot
 *
 * Uses Vercel Chat SDK to connect Agentbot agents to Teams.
 * Supports: Adaptive Cards, message extensions, task modules.
 *
 * See: https://chat-sdk.dev/docs/adapters/teams
 */

export interface TeamsBotConfig {
  userName: string;
  model?: string;
  systemPrompt?: string;
}

export function createTeamsBot(config: TeamsBotConfig) {
  return {
    userName: config.userName || 'agentbot',
    platform: 'teams',
    model: config.model,
    systemPrompt: config.systemPrompt,
  };
}

export const TEAMS_CAPABILITIES = [
  'Adaptive Cards for rich UI',
  'Message extensions for quick actions',
  'Task modules for complex forms',
  'Bot Framework integration',
  'Channel and chat messaging',
  'Meeting extensions',
];

export const TEAMS_CARD_TEMPLATES = {
  agentStatus: (agentName: string, status: string) => ({
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    type: 'AdaptiveCard',
    version: '1.4',
    body: [
      {
        type: 'TextBlock',
        text: `${agentName} Status`,
        size: 'Large',
        weight: 'Bolder',
      },
      {
        type: 'FactSet',
        facts: [
          { title: 'Status', value: status },
          { title: 'Platform', value: 'Agentbot' },
        ],
      },
    ],
    actions: [
      {
        type: 'Action.OpenUrl',
        title: 'View Dashboard',
        url: 'https://agentbot.sh/dashboard',
      },
    ],
  }),
  alert: (title: string, message: string) => ({
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    type: 'AdaptiveCard',
    version: '1.4',
    body: [
      {
        type: 'TextBlock',
        text: title,
        size: 'Large',
        weight: 'Bolder',
        color: 'Attention',
      },
      {
        type: 'TextBlock',
        text: message,
        wrap: true,
      },
    ],
  }),
};
