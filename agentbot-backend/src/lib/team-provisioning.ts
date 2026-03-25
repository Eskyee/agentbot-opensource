/**
 * Team Provisioning — Multi-Agent Docker Sandbox
 * 
 * Creates coordinated agent teams for Collective/Label tiers.
 * Each agent in the team gets its own Render service.
 * 
 * Collective: 3 agents (PM + Engineer + QA)
 * Label: 5+ agents with custom YAML config
 */

import { createContainer, type PlanType, type ContainerResult } from './container-manager'

// Team templates
export interface AgentConfig {
  name: string
  role: string
  description: string
  instruction: string
  model: string
  tools: string[]
  memoryShared: boolean
}

export interface TeamConfig {
  name: string
  description: string
  agents: AgentConfig[]
}

// Pre-built team templates
export const TEAM_TEMPLATES: Record<string, TeamConfig> = {
  dev_team: {
    name: 'Dev Team',
    description: 'Product Manager + Engineer + QA',
    agents: [
      {
        name: 'pm',
        role: 'Product Manager',
        description: 'Coordinates the team, breaks down requirements, tracks progress',
        instruction: `You are the Product Manager of a development team.
Break requirements into clear iterations. Coordinate the engineer to build features.
Use the QA agent to verify implementations. Track progress via todos.
Report completion to the user with clear summaries.`,
        model: 'openrouter/xiaomi/mimo-v2-pro',
        tools: ['filesystem', 'think', 'todo', 'memory'],
        memoryShared: true,
      },
      {
        name: 'engineer',
        role: 'Engineer',
        description: 'Implements features, writes code, runs tests',
        instruction: `You are the Engineer of a development team.
Implement features based on requirements from the PM.
Write clean, well-documented code. Run tests before marking complete.
Report blockers immediately.`,
        model: 'openrouter/xiaomi/mimo-v2-pro',
        tools: ['filesystem', 'shell', 'think'],
        memoryShared: true,
      },
      {
        name: 'qa',
        role: 'QA',
        description: 'Tests implementations, reports bugs, verifies fixes',
        instruction: `You are the QA agent of a development team.
Test implementations from the Engineer. Report bugs with reproduction steps.
Verify fixes before marking resolved. Maintain a test log.`,
        model: 'openrouter/xiaomi/mimo-v2-pro',
        tools: ['filesystem', 'shell', 'think'],
        memoryShared: true,
      },
    ],
  },

  content_team: {
    name: 'Content Team',
    description: 'Content Manager + Writer + Editor',
    agents: [
      {
        name: 'manager',
        role: 'Content Manager',
        description: 'Plans content strategy, assigns topics, reviews output',
        instruction: `You are the Content Manager.
Plan content strategy based on goals. Assign topics to the writer.
Review drafts from the editor. Ensure brand consistency.`,
        model: 'openrouter/xiaomi/mimo-v2-pro',
        tools: ['filesystem', 'think', 'todo', 'memory'],
        memoryShared: true,
      },
      {
        name: 'writer',
        role: 'Writer',
        description: 'Researches topics and creates content drafts',
        instruction: `You are the Writer.
Create content based on topics assigned by the Manager.
Research thoroughly. Write engaging, well-structured content.
Submit drafts for editorial review.`,
        model: 'openrouter/xiaomi/mimo-v2-pro',
        tools: ['filesystem', 'think', 'memory'],
        memoryShared: true,
      },
      {
        name: 'editor',
        role: 'Editor',
        description: 'Reviews and polishes content for publication',
        instruction: `You are the Editor.
Review writer drafts for clarity, grammar, and brand voice.
Provide constructive feedback. Polish final versions for publication.`,
        model: 'openrouter/xiaomi/mimo-v2-pro',
        tools: ['filesystem', 'think'],
        memoryShared: true,
      },
    ],
  },

  research_team: {
    name: 'Research Team',
    description: 'Lead Researcher + Analyst + Writer',
    agents: [
      {
        name: 'lead',
        role: 'Lead Researcher',
        description: 'Defines research questions, coordinates analysis',
        instruction: `You are the Lead Researcher.
Define research questions and methodology. Coordinate the analyst for data gathering.
Synthesize findings into actionable insights.`,
        model: 'openrouter/xiaomi/mimo-v2-pro',
        tools: ['filesystem', 'think', 'todo', 'memory'],
        memoryShared: true,
      },
      {
        name: 'analyst',
        role: 'Analyst',
        description: 'Gathers and processes data, identifies patterns',
        instruction: `You are the Analyst.
Gather data from available sources. Process and analyze findings.
Identify patterns and trends. Report raw findings to the Lead Researcher.`,
        model: 'openrouter/xiaomi/mimo-v2-pro',
        tools: ['filesystem', 'shell', 'think'],
        memoryShared: true,
      },
      {
        name: 'writer',
        role: 'Research Writer',
        description: 'Compiles research into readable reports',
        instruction: `You are the Research Writer.
Compile research findings into clear, readable reports.
Use proper citations. Structure reports for different audiences.`,
        model: 'openrouter/xiaomi/mimo-v2-pro',
        tools: ['filesystem', 'think'],
        memoryShared: true,
      },
    ],
  },
}

// Plan → team size limits
export const PLAN_AGENT_LIMITS: Record<string, number> = {
  solo: 1,
  collective: 3,
  label: 10,
  network: 50,
}

/**
 * Provision a team of agents
 */
export async function provisionTeam(
  userId: string,
  plan: PlanType,
  templateKey: string = 'dev_team',
  customAgents?: AgentConfig[]
): Promise<{ teamId: string; agents: ContainerResult[]; template: TeamConfig }> {
  // Validate plan
  const limit = PLAN_AGENT_LIMITS[plan] || 1
  if (plan === 'solo') {
    throw new Error('Team provisioning requires Collective or Label plan')
  }

  // Get template or use custom
  let template: TeamConfig
  if (customAgents && customAgents.length > 0) {
    if (customAgents.length > limit) {
      throw new Error(`Plan ${plan} allows max ${limit} agents, got ${customAgents.length}`)
    }
    template = {
      name: 'Custom Team',
      description: 'User-defined team configuration',
      agents: customAgents,
    }
  } else {
    template = TEAM_TEMPLATES[templateKey]
    if (!template) {
      throw new Error(`Unknown team template: ${templateKey}. Available: ${Object.keys(TEAM_TEMPLATES).join(', ')}`)
    }
    if (template.agents.length > limit) {
      throw new Error(`Template ${templateKey} has ${template.agents.length} agents but plan ${plan} allows max ${limit}`)
    }
  }

  // Generate team ID
  const teamId = `team_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  // Provision each agent
  const agents: ContainerResult[] = []
  for (const agent of template.agents) {
    try {
      const result = await createContainer(
        `${userId}_${agent.name}`,
        plan
      )
      agents.push({
        ...result,
        container: `${teamId}/${agent.name}`,
      })
    } catch (err) {
      console.error(`[TeamProvision] Failed to provision agent ${agent.name}:`, err)
      agents.push({
        container: `${teamId}/${agent.name}`,
        status: 'failed',
      })
    }
  }

  return { teamId, agents, template }
}

/**
 * Generate YAML config for a team (for Label tier custom config)
 */
export function generateTeamYAML(template: TeamConfig): string {
  const yaml = `# Agentbot Team Configuration
# Generated: ${new Date().toISOString()}
# Team: ${template.name}

name: ${template.name}
description: ${template.description}

agents:
${template.agents
  .map(
    (a) => `  ${a.name}:
    role: ${a.role}
    description: ${a.description}
    model: ${a.model}
    tools: [${a.tools.join(', ')}]
    memory_shared: ${a.memoryShared}
    instruction: |
${a.instruction
  .split('\n')
  .map((line) => `      ${line}`)
  .join('\n')}`
  )
  .join('\n\n')}
`
  return yaml
}
