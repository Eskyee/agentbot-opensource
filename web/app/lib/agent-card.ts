/**
 * A2A Agent Cards.
 *
 * A2A (Google's agent-to-agent protocol, now the Linux Foundation standard that
 * absorbed IBM's ACP) describes each agent with a JSON "Agent Card": identity,
 * capabilities, skills, and auth. Any agent can discover any other by reading
 * its card. Agentbot pairs this with native USDC wallets + negotiation — so a
 * discovered Agentbot agent can be hired and paid, not just queried.
 *
 * Spec reference: https://a2a-protocol.org (Agent Card schema). We emit the
 * standard fields plus an `x-agentbot` extension for the on-chain payment rail.
 */

export type A2ASkill = {
  id: string
  name: string
  description: string
  tags: string[]
}

export type AgentCard = {
  protocolVersion: string
  name: string
  description: string
  url: string
  provider: { organization: string; url: string }
  version: string
  capabilities: {
    streaming: boolean
    pushNotifications: boolean
    stateTransitionHistory: boolean
  }
  defaultInputModes: string[]
  defaultOutputModes: string[]
  skills: A2ASkill[]
  securitySchemes?: Record<string, unknown>
  /** Agentbot-specific: on-chain payment + negotiation rails */
  'x-agentbot'?: {
    payments?: { network: string; asset: string; address: string }
    negotiation?: boolean
    bus?: boolean
  }
}

type AgentInput = {
  id: string
  name: string
  model?: string | null
  status: string
  showcaseDescription?: string
  installedSkills?: Array<{ enabled: boolean; skill: { name: string; description: string; category: string } }>
}

const ORIGIN = (process.env.NEXTAUTH_URL || 'https://agentbot.sh').replace(/\/+$/, '')

function slugId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'skill'
}

/**
 * Build an A2A Agent Card from an Agent and (optionally) its owner's wallet.
 * Only enabled skills are advertised. Pass a wallet address to expose the
 * payment rail; omit it for query-only discovery.
 */
export function buildAgentCard(agent: AgentInput, opts?: { walletAddress?: string; network?: string }): AgentCard {
  const enabledSkills = (agent.installedSkills ?? []).filter((s) => s.enabled)
  const skills: A2ASkill[] = enabledSkills.map((s) => ({
    id: slugId(s.skill.name),
    name: s.skill.name,
    description: s.skill.description.slice(0, 280),
    tags: [s.skill.category].filter(Boolean),
  }))

  // Every agent can at least converse
  if (skills.length === 0) {
    skills.push({
      id: 'chat',
      name: 'Conversation',
      description: 'General assistance and task delegation via natural language.',
      tags: ['chat'],
    })
  }

  const card: AgentCard = {
    protocolVersion: '0.2.0',
    name: agent.name,
    description:
      agent.showcaseDescription?.trim() ||
      `An autonomous Agentbot agent${agent.model ? ` running ${agent.model}` : ''}, always on via the OpenClaw runtime.`,
    url: `${ORIGIN}/api/agents/${agent.id}/a2a`,
    provider: { organization: 'Agentbot', url: ORIGIN },
    version: '1.0.0',
    capabilities: {
      streaming: true,
      pushNotifications: false,
      stateTransitionHistory: false,
    },
    defaultInputModes: ['text/plain', 'application/json'],
    defaultOutputModes: ['text/plain', 'application/json'],
    skills,
  }

  if (opts?.walletAddress) {
    card['x-agentbot'] = {
      payments: {
        network: opts.network || 'base',
        asset: 'USDC',
        address: opts.walletAddress,
      },
      negotiation: true,
      bus: true,
    }
  } else {
    card['x-agentbot'] = { negotiation: true, bus: true }
  }

  return card
}
