/**
 * Agentbot Chat SDK Configuration
 *
 * Multi-platform bot support via Vercel Chat SDK.
 * Adapters: Slack, Teams, Linear, GitHub
 *
 * See: https://github.com/vercel/chat
 * Docs: https://chat-sdk.dev/docs
 */

export interface ChatPlatformConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  status: 'available' | 'coming_soon';
  capabilities: string[];
  envVars: string[];
  setupUrl?: string;
}

export const CHAT_PLATFORMS: ChatPlatformConfig[] = [
  {
    id: 'slack',
    name: 'Slack',
    icon: '💬',
    description: 'Build Slack bots with AI streaming, interactive cards, and slash commands',
    status: 'available',
    capabilities: [
      'AI streaming responses',
      'Interactive Block Kit cards',
      'Slash commands (/agent, /help)',
      'Thread subscriptions',
      'File uploads',
      'Reactions and emoji',
    ],
    envVars: ['SLACK_BOT_TOKEN', 'SLACK_SIGNING_SECRET', 'SLACK_APP_ID'],
    setupUrl: 'https://api.slack.com/apps',
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    icon: '🟦',
    description: 'Build Teams bots with Adaptive Cards and message extensions',
    status: 'available',
    capabilities: [
      'Adaptive Cards',
      'Message extensions',
      'Task modules',
      'Bot Framework integration',
      'Channel and chat messaging',
    ],
    envVars: ['TEAMS_APP_ID', 'TEAMS_APP_PASSWORD', 'TEAMS_TENANT_ID'],
    setupUrl: 'https://developer.microsoft.com/en-us/microsoft-teams',
  },
  {
    id: 'linear',
    name: 'Linear',
    icon: '📋',
    description: 'Automate issue tracking, triage, and project management',
    status: 'available',
    capabilities: [
      'Issue creation and updates',
      'Label management',
      'Priority assignment',
      'Team member tagging',
      'Project tracking',
    ],
    envVars: ['LINEAR_API_KEY'],
    setupUrl: 'https://linear.app/settings/api',
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: '🐙',
    description: 'Automate PR reviews, issue triage, and code analysis',
    status: 'available',
    capabilities: [
      'PR reviews and comments',
      'Issue triage and labeling',
      'Code analysis',
      'CI/CD integration',
      'Release management',
    ],
    envVars: ['GITHUB_TOKEN', 'GITHUB_WEBHOOK_SECRET'],
    setupUrl: 'https://github.com/settings/tokens',
  },
];

export function getPlatformConfig(platformId: string): ChatPlatformConfig | undefined {
  return CHAT_PLATFORMS.find((p) => p.id === platformId);
}

export function getAvailablePlatforms(): ChatPlatformConfig[] {
  return CHAT_PLATFORMS.filter((p) => p.status === 'available');
}
