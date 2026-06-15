/**
 * operator-templates.ts — Starter templates for Operator Mode
 *
 * Each template is a preset over existing workflow primitives.
 * Templates create normal Workflows + Agents — fully editable
 * from Advanced Mode after launch.
 */

export interface OperatorTemplate {
  key: string
  name: string
  description: string
  icon: string
  category: 'music' | 'community' | 'creative' | 'business'
  /** Workflow nodes created from this template */
  nodes: Array<{
    type: 'trigger' | 'action' | 'condition' | 'output'
    config: Record<string, unknown>
    position: string
  }>
  /** Default agent config */
  agentDefaults: {
    model: string
    skills: string[]
    agentType: string
  }
  /** Estimated setup time */
  setupMinutes: number
  /** What the user will see after first success */
  successMessage: string
}

export const OPERATOR_TEMPLATES: OperatorTemplate[] = [
  {
    key: 'music-promoter',
    name: 'Music Promoter',
    description: 'Promote tracks across Telegram and social channels. Auto-posts, schedules drops, and tracks engagement.',
    icon: '🎵',
    category: 'music',
    nodes: [
      { type: 'trigger', config: { event: 'schedule', interval: '6h' }, position: '{"x":0,"y":0}' },
      { type: 'action', config: { tool: 'social-post', channels: ['telegram'] }, position: '{"x":200,"y":0}' },
      { type: 'output', config: { format: 'engagement-report' }, position: '{"x":400,"y":0}' },
    ],
    agentDefaults: {
      model: 'xiaomi/mimo-v2.5-pro',
      skills: ['web-search', 'social-post'],
      agentType: 'music-promoter',
    },
    setupMinutes: 2,
    successMessage: 'Your music promoter agent is live! It will start posting to your connected channels on schedule.',
  },
  {
    key: 'community-manager',
    name: 'Community Manager',
    description: 'Monitor and engage with your community on Telegram. Auto-responds, moderates, and summarises conversations.',
    icon: '👥',
    category: 'community',
    nodes: [
      { type: 'trigger', config: { event: 'message', channel: 'telegram' }, position: '{"x":0,"y":0}' },
      { type: 'condition', config: { check: 'is-question-or-spam' }, position: '{"x":200,"y":0}' },
      { type: 'action', config: { tool: 'auto-reply', tone: 'friendly' }, position: '{"x":400,"y":0}' },
      { type: 'output', config: { format: 'daily-summary' }, position: '{"x":600,"y":0}' },
    ],
    agentDefaults: {
      model: 'xiaomi/mimo-v2.5-pro',
      skills: ['web-search', 'auto-reply'],
      agentType: 'community-manager',
    },
    setupMinutes: 3,
    successMessage: 'Your community manager is listening! It will respond to questions and moderate your Telegram group.',
  },
  {
    key: 'content-creator',
    name: 'Content Creator',
    description: 'Generate blog posts, social content, and newsletters based on your brand voice and topics.',
    icon: '✍️',
    category: 'creative',
    nodes: [
      { type: 'trigger', config: { event: 'schedule', interval: '24h' }, position: '{"x":0,"y":0}' },
      { type: 'action', config: { tool: 'content-generate', types: ['blog', 'social'] }, position: '{"x":200,"y":0}' },
      { type: 'output', config: { format: 'draft-review' }, position: '{"x":400,"y":0}' },
    ],
    agentDefaults: {
      model: 'xiaomi/mimo-v2.5-pro',
      skills: ['web-search', 'file-handler'],
      agentType: 'content-creator',
    },
    setupMinutes: 2,
    successMessage: 'Your content creator is ready! Check your drafts in the activity feed.',
  },
  {
    key: 'crypto-analyst',
    name: 'Crypto Analyst',
    description: 'Track token prices, monitor wallets, and get alerts on market movements. Built for Base and Solana.',
    icon: '📊',
    category: 'business',
    nodes: [
      { type: 'trigger', config: { event: 'schedule', interval: '1h' }, position: '{"x":0,"y":0}' },
      { type: 'action', config: { tool: 'market-scan', chains: ['base', 'solana'] }, position: '{"x":200,"y":0}' },
      { type: 'condition', config: { check: 'price-alert-threshold' }, position: '{"x":400,"y":0}' },
      { type: 'output', config: { format: 'alert-telegram' }, position: '{"x":600,"y":0}' },
    ],
    agentDefaults: {
      model: 'xiaomi/mimo-v2.5-pro',
      skills: ['web-search', 'crypto-prices'],
      agentType: 'crypto-analyst',
    },
    setupMinutes: 3,
    successMessage: 'Your crypto analyst is monitoring the markets! You\'ll get alerts via Telegram.',
  },
  {
    key: 'dj-radio',
    name: 'DJ Radio Host',
    description: 'Launch an AI-powered radio show on baseFM. Curates playlists, takes requests, and mixes live.',
    icon: '📻',
    category: 'music',
    nodes: [
      { type: 'trigger', config: { event: 'schedule', interval: '4h' }, position: '{"x":0,"y":0}' },
      { type: 'action', config: { tool: 'basefm-broadcast', mode: 'auto-dj' }, position: '{"x":200,"y":0}' },
      { type: 'output', config: { format: 'stream-stats' }, position: '{"x":400,"y":0}' },
    ],
    agentDefaults: {
      model: 'xiaomi/mimo-v2.5-pro',
      skills: ['web-search', 'audio-gen'],
      agentType: 'dj-radio',
    },
    setupMinutes: 5,
    successMessage: 'Your DJ is on air! Check baseFM Live to hear your show.',
  },
  {
    key: 'event-scout',
    name: 'Event Scout',
    description: 'Find and curate music events, festivals, and gigs. Auto-posts listings and sends alerts for matching events.',
    icon: '🎪',
    category: 'community',
    nodes: [
      { type: 'trigger', config: { event: 'schedule', interval: '12h' }, position: '{"x":0,"y":0}' },
      { type: 'action', config: { tool: 'web-search', query: 'music events' }, position: '{"x":200,"y":0}' },
      { type: 'condition', config: { check: 'matches-preferences' }, position: '{"x":400,"y":0}' },
      { type: 'output', config: { format: 'event-digest' }, position: '{"x":600,"y":0}' },
    ],
    agentDefaults: {
      model: 'xiaomi/mimo-v2.5-pro',
      skills: ['web-search', 'social-post'],
      agentType: 'event-scout',
    },
    setupMinutes: 2,
    successMessage: 'Your event scout is searching! You\'ll get a digest of matching events.',
  },
]

export function getTemplateByKey(key: string): OperatorTemplate | undefined {
  return OPERATOR_TEMPLATES.find(t => t.key === key)
}

export function getTemplatesByCategory(category: string): OperatorTemplate[] {
  return OPERATOR_TEMPLATES.filter(t => t.category === category)
}
