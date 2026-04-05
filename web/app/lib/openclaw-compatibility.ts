/**
 * openclaw-compatibility.ts - OpenClaw 2026.4.2 Compatibility Layer
 * 
 * Handles breaking changes and migrations for OpenClaw 2026.4.2:
 * - Plugin config path migrations (x_search, web_fetch)
 * - Task Flow integration
 * - Gateway/exec loopback fixes
 * - Agent/subagent pairing fixes
 * - Provider routing updates
 */

import { prisma } from './prisma'

export interface CompatibilityConfig {
  version: string
  migrations: Migration[]
  features: {
    taskFlow: boolean
    pluginOwnedConfig: boolean
    execYoloMode: boolean
    centralizedProviders: boolean
  }
}

export interface Migration {
  id: string
  description: string
  applied: boolean
  appliedAt?: Date
}

// OpenClaw 2026.4.2 configuration paths
export const PLUGIN_CONFIG_PATHS = {
  // New plugin-owned paths (2026.4.2+)
  xai: {
    xSearch: 'plugins.entries.xai.config.xSearch',
    webSearch: 'plugins.entries.xai.config.webSearch.apiKey'
  },
  firecrawl: {
    webFetch: 'plugins.entries.firecrawl.config.webFetch'
  },
  // Legacy paths (pre-2026.4.2)
  legacy: {
    xSearch: 'core.tools.web.x_search',
    firecrawl: 'core.tools.web.fetch.firecrawl'
  }
} as const

/**
 * Check if running OpenClaw version supports new features
 */
export function isVersionCompatible(version: string): {
  compatible: boolean
  missingFeatures: string[]
} {
  const minVersion = '2026.4.2'
  const versionParts = version.split('.').map(Number)
  const minParts = minVersion.split('.').map(Number)
  
  const compatible = versionParts[0] > minParts[0] || 
    (versionParts[0] === minParts[0] && versionParts[1] >= minParts[1])
  
  const missingFeatures: string[] = []
  
  if (!compatible) {
    missingFeatures.push(
      'Task Flow managed mode',
      'Plugin-owned config paths',
      'Exec YOLO mode defaults',
      'Centralized provider routing'
    )
  }
  
  return { compatible, missingFeatures }
}

/**
 * Migrate plugin configuration from legacy to new paths
 * Equivalent to `openclaw doctor --fix`
 */
export async function migratePluginConfig(userId: string): Promise<{
  migrated: boolean
  changes: string[]
  errors: string[]
}> {
  const changes: string[] = []
  const errors: string[] = []
  
  try {
    // Get user's agent configuration
    const agent = await prisma.agent.findFirst({
      where: { userId },
      select: { config: true, id: true }
    })
    
    if (!agent?.config) {
      return { migrated: false, changes: [], errors: ['No agent config found'] }
    }
    
    const config = agent.config as Record<string, any>
    let migrated = false
    
    // Migrate x_search config
    if (config.core?.tools?.web?.x_search) {
      // Move to new path
      if (!config.plugins) config.plugins = {}
      if (!config.plugins.entries) config.plugins.entries = {}
      if (!config.plugins.entries.xai) config.plugins.entries.xai = {}
      if (!config.plugins.entries.xai.config) config.plugins.entries.xai.config = {}
      
      config.plugins.entries.xai.config.xSearch = {
        ...config.core.tools.web.x_search,
        // Ensure API key is in correct location
        apiKey: config.core.tools.web.x_search.apiKey || process.env.XAI_API_KEY
      }
      
      // Remove legacy config
      delete config.core.tools.web.x_search
      changes.push('Migrated x_search to plugins.entries.xai.config.xSearch')
      migrated = true
    }
    
    // Migrate Firecrawl config
    if (config.core?.tools?.web?.fetch?.firecrawl) {
      if (!config.plugins) config.plugins = {}
      if (!config.plugins.entries) config.plugins.entries = {}
      if (!config.plugins.entries.firecrawl) config.plugins.entries.firecrawl = {}
      if (!config.plugins.entries.firecrawl.config) config.plugins.entries.firecrawl.config = {}
      
      config.plugins.entries.firecrawl.config.webFetch = {
        ...config.core.tools.web.fetch.firecrawl
      }
      
      delete config.core.tools.web.fetch.firecrawl
      changes.push('Migrated firecrawl to plugins.entries.firecrawl.config.webFetch')
      migrated = true
    }
    
    // Update agent config if migrations occurred
    if (migrated) {
      await prisma.agent.update({
        where: { id: agent.id },
        data: { config }
      })
    }
    
    return { migrated, changes, errors }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error')
    return { migrated: false, changes, errors }
  }
}

/**
 * Configure exec defaults for YOLO mode (OpenClaw 2026.4.2+)
 * security=full with ask=off
 */
export function getExecDefaults(): {
  security: 'full' | 'sandbox' | 'none'
  ask: 'on' | 'off'
  askFallback: 'block' | 'allow'
} {
  return {
    security: 'full',
    ask: 'off', // YOLO mode - no prompts
    askFallback: 'block'
  }
}

/**
 * Build OpenClaw Control URL with proper session and token
 * Updated for 2026.4.2 pairing fixes
 */
export function buildOpenClawControlUrl(options: {
  gatewayUrl: string
  token?: string
  session?: string
  userId?: string
  autoPair?: boolean
}): string {
  const { gatewayUrl, token, session = 'main', userId, autoPair = true } = options
  
  const baseUrl = gatewayUrl.replace(/\/$/, '')
  const params = new URLSearchParams()
  
  // Session key for 2026.4.2+ routing
  params.set('session', `agent:${session}:${session}`)
  
  // Token in hash fragment (never sent to server)
  const hashParams = new URLSearchParams()
  if (token) {
    hashParams.set('token', token)
  }
  
  // Auto-pair flag for gateway/exec loopback fix
  if (autoPair && userId) {
    hashParams.set('autoPair', 'true')
    hashParams.set('userId', userId)
  }
  
  const queryString = params.toString()
  const hashString = hashParams.toString()
  
  return `${baseUrl}/chat${queryString ? `?${queryString}` : ''}${hashString ? `#${hashString}` : ''}`
}

/**
 * Handle Task Flow integration (2026.4.2+)
 */
export interface TaskFlowConfig {
  mode: 'managed' | 'mirrored'
  durable: boolean
  revisions: boolean
}

export function getTaskFlowDefaults(): TaskFlowConfig {
  return {
    mode: 'managed', // Use managed mode for background orchestration
    durable: true,   // Persist flow state
    revisions: true  // Track revisions
  }
}

/**
 * Provider routing configuration (centralized in 2026.4.2)
 */
export const PROVIDER_ROUTES = {
  // Native endpoints (get full features)
  native: [
    'api.openai.com',
    'api.anthropic.com',
    'api.github.com/copilot'
  ],
  // Proxy endpoints (restricted features)
  proxy: [] as string[]
} as const

/**
 * Check if provider endpoint is native or proxy
 */
export function classifyProviderEndpoint(url: string): 'native' | 'proxy' {
  const hostname = new URL(url).hostname
  return PROVIDER_ROUTES.native.some(native => hostname.includes(native)) 
    ? 'native' 
    : 'proxy'
}

/**
 * Fix agent/subagent pairing scope (2026.4.2 fix)
 * Ensures sessions_spawn doesn't fail with "pairing required"
 */
export async function fixAgentPairingScope(agentId: string): Promise<{
  fixed: boolean
  message: string
}> {
  try {
    // Pin admin-only subagent gateway calls to operator.admin
    // while keeping agent at least privilege
    await prisma.agent.update({
      where: { id: agentId },
      data: {
        config: {
          update: {
            gateway: {
              role: 'admin', // For subagent operations
              scope: 'operator.admin'
            }
          }
        }
      }
    })
    
    return {
      fixed: true,
      message: 'Agent pairing scope updated for 2026.4.2 compatibility'
    }
  } catch (error) {
    return {
      fixed: false,
      message: error instanceof Error ? error.message : 'Failed to fix pairing scope'
    }
  }
}

/**
 * Comprehensive compatibility check and fix
 */
export async function ensureCompatibility(userId: string): Promise<{
  compatible: boolean
  fixes: string[]
  errors: string[]
}> {
  const fixes: string[] = []
  const errors: string[] = []
  
  // 1. Migrate plugin config
  const migration = await migratePluginConfig(userId)
  if (migration.migrated) {
    fixes.push(...migration.changes)
  }
  errors.push(...migration.errors)
  
  // 2. Fix agent pairing scope
  const agent = await prisma.agent.findFirst({ where: { userId } })
  if (agent) {
    const pairingFix = await fixAgentPairingScope(agent.id)
    if (pairingFix.fixed) {
      fixes.push(pairingFix.message)
    }
  }
  
  // 3. Verify token format
  const { getOrCreateUserGatewayToken } = await import('./token-manager')
  const tokenResult = await getOrCreateUserGatewayToken(userId)
  if (tokenResult?.isNew) {
    fixes.push('Generated new gateway token for 2026.4.2 compatibility')
  }
  
  return {
    compatible: errors.length === 0,
    fixes,
    errors
  }
}
