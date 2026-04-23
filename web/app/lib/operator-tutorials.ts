/**
 * operator-tutorials.ts — Tutorial definitions for Operator Mode
 *
 * Each tutorial is a checklist of steps that guide new users
 * through key platform capabilities. Progress is persisted in
 * the TutorialProgress table.
 */

export interface TutorialStep {
  title: string
  description: string
  /** Route to navigate to when clicking this step */
  href?: string
  /** API endpoint to check completion automatically */
  checkEndpoint?: string
}

export interface Tutorial {
  key: string
  name: string
  description: string
  icon: string
  steps: TutorialStep[]
  /** Reward for completing all steps */
  reward?: { type: 'credits' | 'badge'; value: string }
}

export const OPERATOR_TUTORIALS: Tutorial[] = [
  {
    key: 'deploy-first-agent',
    name: 'Deploy Your First Agent',
    description: 'Get an AI agent running in under 2 minutes. No code required.',
    icon: '🚀',
    steps: [
      {
        title: 'Choose a template',
        description: 'Pick a starter template that matches what you want to build.',
        href: '/app/templates',
      },
      {
        title: 'Configure your agent',
        description: 'Name your agent, pick an AI model, and set basic preferences.',
      },
      {
        title: 'Connect Telegram',
        description: 'Link a Telegram bot so your agent can chat with users.',
        href: '/dashboard/channels',
      },
      {
        title: 'Launch!',
        description: 'Hit deploy and watch your agent come to life.',
      },
    ],
    reward: { type: 'badge', value: 'First Agent' },
  },
  {
    key: 'connect-channels',
    name: 'Connect Your Channels',
    description: 'Link Telegram, Discord, or WhatsApp so your agent can reach your audience.',
    icon: '📡',
    steps: [
      {
        title: 'Create a Telegram bot',
        description: 'Talk to @BotFather on Telegram to get a bot token.',
      },
      {
        title: 'Add the token',
        description: 'Paste your bot token in agent settings.',
        href: '/settings',
      },
      {
        title: 'Send a test message',
        description: 'Message your bot on Telegram to verify it responds.',
      },
    ],
  },
  {
    key: 'explore-skills',
    name: 'Explore Agent Skills',
    description: 'Discover what your agent can do — web search, file handling, crypto, and more.',
    icon: '✳',
    steps: [
      {
        title: 'Browse the skill marketplace',
        description: 'See all available skills your agent can use.',
        href: '/marketplace',
      },
      {
        title: 'Install a skill',
        description: 'Add a new capability to your agent.',
        href: '/dashboard/skills',
      },
      {
        title: 'Test the skill',
        description: 'Send a message to your agent that uses the new skill.',
      },
    ],
    reward: { type: 'credits', value: '10' },
  },
  {
    key: 'set-up-wallet',
    name: 'Set Up Agent Wallet',
    description: 'Give your agent a crypto wallet so it can send and receive USDC on Base.',
    icon: '💰',
    steps: [
      {
        title: 'Create a wallet',
        description: 'Your agent gets its own onchain identity on Base.',
        href: '/dashboard/wallet',
      },
      {
        title: 'Fund the wallet',
        description: 'Send a small amount of USDC to your agent\'s address.',
      },
      {
        title: 'Test a transaction',
        description: 'Have your agent send a test payment.',
      },
    ],
  },
  {
    key: 'build-workflow',
    name: 'Build a Workflow',
    description: 'Create an automated workflow that runs on a schedule or responds to events.',
    icon: '⊞',
    steps: [
      {
        title: 'Open the workflow editor',
        description: 'Go to the Workflows page in your dashboard.',
        href: '/dashboard/workflows',
      },
      {
        title: 'Add a trigger',
        description: 'Choose what starts the workflow — a schedule, message, or event.',
      },
      {
        title: 'Add actions',
        description: 'Define what your agent does when triggered.',
      },
      {
        title: 'Enable the workflow',
        description: 'Turn it on and watch it run.',
      },
    ],
    reward: { type: 'badge', value: 'Workflow Builder' },
  },
]

export function getTutorialByKey(key: string): Tutorial | undefined {
  return OPERATOR_TUTORIALS.find(t => t.key === key)
}
