/**
 * Agent deployment to OpenClaw Gateway
 * 
 * Deploys ALL agent data to the OpenClaw gateway:
 * - Agent configuration
 * - Installed skills (with full code)
 * - Memories (key-value store)
 * - Files (metadata)
 * - User settings
 */

import { prisma } from '@/app/lib/prisma'

const GATEWAY_HTTP_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://openclaw-gateway-lqma:10000'
const apiSecret = (process.env.BACKEND_API_SECRET || process.env.INTERNAL_API_KEY)?.trim()

export interface AgentDeployPayload {
  agentId: string
  userId: string
  name: string
  model: string
  config: Record<string, unknown>
  skills: DeploySkill[]
  memories: DeployMemory[]
  files: DeployFile[]
}

export interface DeploySkill {
  id: string
  name: string
  description: string
  category: string
  code: string
  author: string
  mcpConfig?: Record<string, unknown> | null
  mcpEnabled: boolean
}

export interface DeployMemory {
  key: string
  value: string
  createdAt: string
}

export interface DeployFile {
  id: string
  filename: string
  path: string | null
  size: number
  mimeType: string | null
  url: string | null
  createdAt: string
}

export interface AgentDeployResult {
  success: boolean
  gatewayId?: string
  deployedAt?: string
  error?: string
  details?: {
    skillsDeployed: number
    memoriesDeployed: number
    filesDeployed: number
  }
}

/**
 * Deploy a complete agent to the OpenClaw gateway
 * Includes skills, memories, files, and configuration
 */
export async function deployAgentToGateway(
  payload: AgentDeployPayload
): Promise<AgentDeployResult> {
  try {
    console.log(`[AgentDeploy] Deploying agent ${payload.agentId} to gateway...`)
    console.log(`[AgentDeploy] - Skills: ${payload.skills.length}`)
    console.log(`[AgentDeploy] - Memories: ${payload.memories.length}`)
    console.log(`[AgentDeploy] - Files: ${payload.files.length}`)

    const response = await fetch(`${GATEWAY_HTTP_URL}/api/agents/deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiSecret ? { 'X-Internal-Key': apiSecret } : {}),
      },
      body: JSON.stringify({
        type: 'deploy_agent',
        ...payload,
        timestamp: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(30000), // 30s timeout for full deploy
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown error')
      console.error(`[AgentDeploy] Gateway responded ${response.status}: ${errorBody}`)
      return {
        success: false,
        error: `Gateway error: ${response.status} - ${errorBody}`,
      }
    }

    const data = await response.json()
    console.log(`[AgentDeploy] Successfully deployed agent ${payload.agentId}`)
    
    return {
      success: true,
      gatewayId: data.gatewayId || payload.agentId,
      deployedAt: new Date().toISOString(),
      details: {
        skillsDeployed: payload.skills.length,
        memoriesDeployed: payload.memories.length,
        filesDeployed: payload.files.length,
      },
    }
  } catch (error) {
    console.error('[AgentDeploy] Failed to deploy agent:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Fetch all agent data from database for deployment
 */
export async function fetchAgentDataForDeployment(
  agentId: string
): Promise<Omit<AgentDeployPayload, 'userId' | 'name' | 'model'> & { 
  userId: string
  name: string
  model: string | null
  config: Record<string, unknown>
}> {
  // Get agent with all related data
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: {
      installedSkills: {
        where: { enabled: true },
        include: { skill: true },
      },
      memories: true,
      files: true,
    },
  })

  if (!agent) {
    throw new Error(`Agent ${agentId} not found`)
  }

  return {
    agentId: agent.id,
    userId: agent.userId,
    name: agent.name,
    model: agent.model || 'default',
    config: (agent.config as Record<string, unknown>) || {},
    skills: agent.installedSkills.map((is: {
      skill: {
        id: string;
        name: string;
        description: string;
        category: string;
        code: string;
        author: string;
        mcpConfig: unknown;
        mcpEnabled: boolean;
      };
    }) => ({
      id: is.skill.id,
      name: is.skill.name,
      description: is.skill.description,
      category: is.skill.category,
      code: is.skill.code,
      author: is.skill.author,
      mcpConfig: is.skill.mcpConfig as Record<string, unknown> | null,
      mcpEnabled: is.skill.mcpEnabled,
    })),
    memories: agent.memories.map((m: {
      key: string;
      value: string;
      createdAt: Date;
    }) => ({
      key: m.key,
      value: m.value,
      createdAt: m.createdAt.toISOString(),
    })),
    files: agent.files.map((f: {
      id: string;
      filename: string;
      path: string | null;
      size: number;
      mimeType: string | null;
      url: string | null;
      createdAt: Date;
    }) => ({
      id: f.id,
      filename: f.filename,
      path: f.path,
      size: f.size,
      mimeType: f.mimeType,
      url: f.url,
      createdAt: f.createdAt.toISOString(),
    })),
  }
}

/**
 * Sync agent data to gateway (for updates after provisioning)
 */
export async function syncAgentToGateway(agentId: string): Promise<AgentDeployResult> {
  try {
    const agentData = await fetchAgentDataForDeployment(agentId)
    
    return await deployAgentToGateway({
      ...agentData,
      model: agentData.model || 'default',
    })
  } catch (error) {
    console.error('[AgentDeploy] Sync failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Deploy a single skill to an agent on the gateway
 * Used when skills are installed after agent provisioning
 */
export async function deploySkillToAgent(
  agentId: string,
  skillId: string
): Promise<AgentDeployResult> {
  try {
    const installedSkill = await prisma.installedSkill.findFirst({
      where: { agentId, skillId, enabled: true },
      include: { skill: true },
    })

    if (!installedSkill) {
      return {
        success: false,
        error: 'Skill not found or not installed',
      }
    }

    const response = await fetch(`${GATEWAY_HTTP_URL}/api/agents/${agentId}/skills`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiSecret ? { 'X-Internal-Key': apiSecret } : {}),
      },
      body: JSON.stringify({
        type: 'install_skill',
        skill: {
          id: installedSkill.skill.id,
          name: installedSkill.skill.name,
          description: installedSkill.skill.description,
          category: installedSkill.skill.category,
          code: installedSkill.skill.code,
          author: installedSkill.skill.author,
          mcpConfig: installedSkill.skill.mcpConfig,
          mcpEnabled: installedSkill.skill.mcpEnabled,
        },
        timestamp: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      return {
        success: false,
        error: `Gateway error: ${response.status}`,
      }
    }

    return {
      success: true,
      deployedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error('[AgentDeploy] Skill deploy failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Remove a skill from an agent on the gateway
 */
export async function removeSkillFromAgent(
  agentId: string,
  skillId: string
): Promise<AgentDeployResult> {
  try {
    const response = await fetch(`${GATEWAY_HTTP_URL}/api/agents/${agentId}/skills/${skillId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(apiSecret ? { 'X-Internal-Key': apiSecret } : {}),
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      return {
        success: false,
        error: `Gateway error: ${response.status}`,
      }
    }

    return { success: true }
  } catch (error) {
    console.error('[AgentDeploy] Skill removal failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
