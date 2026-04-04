/**
 * mcp-manager.ts — Skill-Embedded MCP Framework
 *
 * MCP (Model Context Protocol) servers embedded in skills.
 * Spin up on-demand, scoped to tasks, clean up when done.
 * Keeps context window clean by only loading MCPs when needed.
 *
 * Inspired by Oh My OpenAgent's skill-embedded MCPs.
 *
 * Usage:
 *   import { mcpManager, createSkillMcp } from '@/app/lib/mcp'
 *
 *   // Activate MCP for a skill
 *   const mcp = await mcpManager.activate('venue-finder')
 *   const results = await mcp.callTool('search_venues', { city: 'London' })
 *   await mcpManager.deactivate('venue-finder')
 */

import { prisma } from '@/app/lib/prisma'

export interface McpConfig {
  enabled?: boolean
  name: string
  version: string
  tools: McpTool[]
  resources?: McpResource[]
  prompts?: McpPrompt[]
}

export interface McpTool {
  name: string
  description: string
  parameters: Record<string, unknown>
  handler?: string // Function name or endpoint
}

export interface McpResource {
  uri: string
  name: string
  description: string
  mimeType?: string
}

export interface McpPrompt {
  name: string
  description: string
  template: string
}

export interface ActiveMcp {
  skillId: string
  config: McpConfig
  startedAt: Date
  calls: number
  lastUsedAt: Date
}

export interface McpCallResult {
  success: boolean
  data?: unknown
  error?: string
  latencyMs: number
}

/**
 * MCP Manager - handles lifecycle of skill-embedded MCPs
 */
export class McpManager {
  private activeMcps: Map<string, ActiveMcp> = new Map()
  private maxConcurrentMcps = 10
  private idleTimeoutMs = 5 * 60 * 1000 // 5 minutes
  private checkInterval?: NodeJS.Timeout

  constructor() {
    this.startIdleChecker()
  }

  /**
   * Activate MCP for a skill
   */
  async activate(skillId: string): Promise<ActiveMcp> {
    // Check if already active
    const existing = this.activeMcps.get(skillId)
    if (existing) {
      existing.lastUsedAt = new Date()
      existing.calls++
      return existing
    }

    // Check capacity
    if (this.activeMcps.size >= this.maxConcurrentMcps) {
      await this.evictOldest()
    }

    // Load skill MCP config from database
    const skill = await prisma.skill.findUnique({
      where: { id: skillId },
      select: { id: true, name: true, mcpConfig: true, mcpEnabled: true }
    })

    if (!skill) {
      throw new Error(`Skill ${skillId} not found`)
    }

    if (!skill.mcpConfig) {
      throw new Error(`Skill ${skillId} has no MCP configuration`)
    }

    const config = normalizeMcpConfig(skill.mcpConfig, skillId)

    if (!skill.mcpEnabled || config.enabled === false) {
      throw new Error(`MCP is disabled for skill ${skillId}`)
    }

    // Spin up MCP
    const mcp: ActiveMcp = {
      skillId,
      config,
      startedAt: new Date(),
      calls: 0,
      lastUsedAt: new Date()
    }

    this.activeMcps.set(skillId, mcp)
    console.log(`[MCP] Activated for skill: ${skill.name} (${skillId})`)

    return mcp
  }

  /**
   * Deactivate MCP for a skill
   */
  async deactivate(skillId: string): Promise<void> {
    const mcp = this.activeMcps.get(skillId)
    if (!mcp) return

    console.log(`[MCP] Deactivated for skill: ${skillId}`)
    this.activeMcps.delete(skillId)
  }

  /**
   * Call a tool on an active MCP
   */
  async callTool(
    skillId: string,
    toolName: string,
    parameters: Record<string, unknown>
  ): Promise<McpCallResult> {
    const startTime = Date.now()

    try {
      // Ensure MCP is active
      let mcp = this.activeMcps.get(skillId)
      if (!mcp) {
        mcp = await this.activate(skillId)
      }

      // Find tool
      const tool = mcp.config.tools.find(t => t.name === toolName)
      if (!tool) {
        throw new Error(`Tool ${toolName} not found in skill ${skillId}`)
      }

      // Update usage
      mcp.calls++
      mcp.lastUsedAt = new Date()

      // Execute tool (in production, this would call the actual handler)
      const result = await this.executeTool(skillId, tool, parameters)

      return {
        success: true,
        data: result,
        latencyMs: Date.now() - startTime
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        latencyMs: Date.now() - startTime
      }
    }
  }

  /**
   * Execute a tool handler
   */
  private async executeTool(
    skillId: string,
    tool: McpTool,
    parameters: Record<string, unknown>
  ): Promise<unknown> {
    // In production, this would:
    // 1. Import the skill's tool handlers
    // 2. Validate parameters against schema
    // 3. Execute with proper error handling
    // 4. Return typed results

    console.log(`[MCP] Executing tool ${tool.name} for skill ${skillId}`)
    console.log(`[MCP] Parameters:`, parameters)

    // Mock execution - return success
    return {
      tool: tool.name,
      skillId,
      parameters,
      executedAt: new Date().toISOString()
    }
  }

  /**
   * Get active MCPs
   */
  getActiveMcps(): ActiveMcp[] {
    return Array.from(this.activeMcps.values())
  }

  /**
   * Check if MCP is active
   */
  isActive(skillId: string): boolean {
    return this.activeMcps.has(skillId)
  }

  /**
   * Get MCP statistics
   */
  getStats(): {
    active: number
    max: number
    totalCalls: number
    oldestMcp?: string
  } {
    const mcps = this.getActiveMcps()
    let totalCalls = 0
    let oldest: ActiveMcp | undefined

    for (const mcp of mcps) {
      totalCalls += mcp.calls
      if (!oldest || mcp.lastUsedAt < oldest.lastUsedAt) {
        oldest = mcp
      }
    }

    return {
      active: mcps.length,
      max: this.maxConcurrentMcps,
      totalCalls,
      oldestMcp: oldest?.skillId
    }
  }

  /**
   * Evict oldest MCP when at capacity
   */
  private async evictOldest(): Promise<void> {
    let oldest: ActiveMcp | undefined

    for (const mcp of this.activeMcps.values()) {
      if (!oldest || mcp.lastUsedAt < oldest.lastUsedAt) {
        oldest = mcp
      }
    }

    if (oldest) {
      console.log(`[MCP] Evicting oldest: ${oldest.skillId}`)
      await this.deactivate(oldest.skillId)
    }
  }

  /**
   * Check for idle MCPs
   */
  private startIdleChecker(): void {
    this.checkInterval = setInterval(async () => {
      const now = Date.now()

      for (const [skillId, mcp] of this.activeMcps) {
        const idleTime = now - mcp.lastUsedAt.getTime()
        if (idleTime > this.idleTimeoutMs) {
          console.log(`[MCP] Idle timeout: ${skillId}`)
          await this.deactivate(skillId)
        }
      }
    }, 60000) // Check every minute
  }

  /**
   * Stop idle checker
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }
  }

  /**
   * Clear all active MCPs
   */
  async clearAll(): Promise<void> {
    const promises = Array.from(this.activeMcps.keys()).map(id =>
      this.deactivate(id)
    )
    await Promise.all(promises)
  }
}

// Singleton instance
export const mcpManager = new McpManager()

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeMcpTool(value: unknown, skillId: string, index: number): McpTool {
  if (!isRecord(value)) {
    throw new Error(`Skill ${skillId} has invalid MCP tool at index ${index}`)
  }

  const { name, description, parameters, handler } = value

  if (typeof name !== 'string' || name.length === 0) {
    throw new Error(`Skill ${skillId} has invalid MCP tool name at index ${index}`)
  }

  if (typeof description !== 'string' || description.length === 0) {
    throw new Error(`Skill ${skillId} has invalid MCP tool description for ${name}`)
  }

  if (!isRecord(parameters)) {
    throw new Error(`Skill ${skillId} has invalid MCP tool parameters for ${name}`)
  }

  return {
    name,
    description,
    parameters,
    handler: typeof handler === 'string' ? handler : undefined
  }
}

function normalizeMcpResource(value: unknown, skillId: string, index: number): McpResource {
  if (!isRecord(value)) {
    throw new Error(`Skill ${skillId} has invalid MCP resource at index ${index}`)
  }

  const { uri, name, description, mimeType } = value

  if (typeof uri !== 'string' || typeof name !== 'string' || typeof description !== 'string') {
    throw new Error(`Skill ${skillId} has invalid MCP resource at index ${index}`)
  }

  return {
    uri,
    name,
    description,
    mimeType: typeof mimeType === 'string' ? mimeType : undefined
  }
}

function normalizeMcpPrompt(value: unknown, skillId: string, index: number): McpPrompt {
  if (!isRecord(value)) {
    throw new Error(`Skill ${skillId} has invalid MCP prompt at index ${index}`)
  }

  const { name, description, template } = value

  if (typeof name !== 'string' || typeof description !== 'string' || typeof template !== 'string') {
    throw new Error(`Skill ${skillId} has invalid MCP prompt at index ${index}`)
  }

  return {
    name,
    description,
    template
  }
}

function normalizeMcpConfig(rawConfig: unknown, skillId: string): McpConfig {
  if (!isRecord(rawConfig)) {
    throw new Error(`Skill ${skillId} has invalid MCP configuration`)
  }

  const { enabled, name, version, tools, resources, prompts } = rawConfig

  if (typeof name !== 'string' || name.length === 0) {
    throw new Error(`Skill ${skillId} has invalid MCP name`)
  }

  if (!Array.isArray(tools)) {
    throw new Error(`Skill ${skillId} has invalid MCP tools configuration`)
  }

  return {
    enabled: typeof enabled === 'boolean' ? enabled : undefined,
    name,
    version: typeof version === 'string' && version.length > 0 ? version : '1.0.0',
    tools: tools.map((tool, index) => normalizeMcpTool(tool, skillId, index)),
    resources: Array.isArray(resources)
      ? resources.map((resource, index) => normalizeMcpResource(resource, skillId, index))
      : undefined,
    prompts: Array.isArray(prompts)
      ? prompts.map((prompt, index) => normalizeMcpPrompt(prompt, skillId, index))
      : undefined
  }
}

/**
 * Create MCP configuration for a skill
 */
export function createSkillMcp(
  name: string,
  tools: Omit<McpTool, 'handler'>[],
  options: Partial<McpConfig> = {}
): McpConfig {
  return {
    enabled: true,
    name,
    version: '1.0.0',
    tools: tools.map(t => ({
      ...t,
      handler: `${name}.${t.name}`
    })),
    ...options
  }
}

/**
 * Built-in MCPs for common operations
 */
export const BUILTIN_MCPS = {
  websearch: createSkillMcp('websearch', [
    {
      name: 'search',
      description: 'Search the web',
      parameters: {
        query: { type: 'string', required: true },
        limit: { type: 'number', default: 5 }
      }
    },
    {
      name: 'fetch_page',
      description: 'Fetch and parse a webpage',
      parameters: {
        url: { type: 'string', required: true }
      }
    }
  ]),

  context7: createSkillMcp('context7', [
    {
      name: 'get_docs',
      description: 'Get documentation for a library',
      parameters: {
        library: { type: 'string', required: true },
        topic: { type: 'string' }
      }
    }
  ]),

  grep_app: createSkillMcp('grep_app', [
    {
      name: 'search_code',
      description: 'Search GitHub code',
      parameters: {
        query: { type: 'string', required: true },
        language: { type: 'string' }
      }
    }
  ])
}
