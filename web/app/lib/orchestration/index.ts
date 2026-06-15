/**
 * orchestrator.ts — Multi-Agent Router & Orchestration System
 *
 * Inspired by Oh My OpenAgent's Discipline Agents:
 * - Sisyphus (orchestrator) → delegates to specialists
 * - Hephaestus (deep worker) → autonomous research + execution  
 * - Prometheus (planner) → strategic planning with interview mode
 * - Oracle (debugger) → architecture/debugging
 * - Librarian (search) → docs/code search
 *
 * Usage:
 *   import { routeTask, AgentRole, TaskCategory } from '@/app/lib/orchestration'
 *
 *   const result = await routeTask('fix login bug', 'debugging')
 *   // Routes to Oracle (debugger) with GPT-5.4
 */

export type AgentRole =
  | 'orchestrator' // Sisyphus - main router, plans & delegates
  | 'researcher' // Hephaestus - deep research, autonomous execution
  | 'implementer' // Writes production code
  | 'reviewer' // Code review, quality checks
  | 'debugger' // Oracle - debugging, architecture analysis
  | 'planner' // Prometheus - strategic planning
  | 'librarian' // Code/docs search specialist
  | 'visual' // UI/UX focused

export type TaskCategory =
  | 'visual-engineering' // Frontend, UI/UX, design
  | 'business-logic' // Backend, APIs, logic
  | 'debugging' // Bug fixes, troubleshooting
  | 'planning' // Architecture, strategy
  | 'research' // Investigation, learning
  | 'review' // Code review, audits
  | 'quick' // Single-file changes, typos
  | 'ultrabrain' // Hard logic, complex architecture

export interface AgentConfig {
  role: AgentRole
  name: string
  model: string
  fallbackModels?: string[]
  temperature: number
  maxTokens: number
  systemPrompt: string
  capabilities: string[]
  category: TaskCategory
  maxConcurrency: number
  timeoutMs: number
}

export interface TaskRequest {
  task: string
  category?: TaskCategory
  context?: {
    files?: string[]
    codebase?: boolean
    docs?: boolean
  }
  priority?: 'low' | 'medium' | 'high' | 'critical'
  estimatedComplexity?: 'simple' | 'medium' | 'complex'
}

export interface TaskResult {
  success: boolean
  agent: AgentRole
  model: string
  output: string
  metadata: {
    tokensUsed: number
    latencyMs: number
    iterations: number
  }
  subtasks?: TaskResult[]
}

// Agent configurations optimized for each role
export const AGENT_CONFIGS: Record<AgentRole, AgentConfig> = {
  orchestrator: {
    role: 'orchestrator',
    name: 'Sisyphus',
    model: 'kimi-k2.5',
    fallbackModels: ['claude-opus-4', 'glm-5'],
    temperature: 0.3,
    maxTokens: 4000,
    systemPrompt: `You are Sisyphus, the orchestrator. Your job is to:
1. Analyze tasks and break them down
2. Route to appropriate specialist agents
3. Coordinate parallel execution when beneficial
4. Ensure tasks complete successfully
5. Never stop halfway - drive to completion

You plan, delegate, and synthesize results. You don't write code directly unless it's a trivial task.`,
    capabilities: ['planning', 'delegation', 'coordination', 'synthesis'],
    category: 'planning',
    maxConcurrency: 5,
    timeoutMs: 120000,
  },

  researcher: {
    role: 'researcher',
    name: 'Hephaestus',
    model: 'gpt-5.4',
    fallbackModels: ['claude-opus-4', 'kimi-k2.5'],
    temperature: 0.4,
    maxTokens: 8000,
    systemPrompt: `You are Hephaestus, the researcher. You:
1. Explore codebases autonomously
2. Research patterns and best practices
3. Execute end-to-end without hand-holding
4. Find root causes of issues
5. Deliver comprehensive analysis

You are "The Legitimate Craftsman" - thorough, methodical, and self-directed.`,
    capabilities: ['codebase-analysis', 'pattern-research', 'root-cause-analysis', 'documentation'],
    category: 'research',
    maxConcurrency: 3,
    timeoutMs: 300000,
  },

  implementer: {
    role: 'implementer',
    name: 'Builder',
    model: 'kimi-k2.5',
    fallbackModels: ['claude-opus-4', 'gpt-5.4'],
    temperature: 0.2,
    maxTokens: 6000,
    systemPrompt: `You are an implementer. You write clean, production-ready code:
1. Follow existing patterns in the codebase
2. Use TypeScript-first approach
3. Include proper error handling
4. Write self-documenting code
5. Match the style of surrounding code

Check AGENTS.md for conventions. Use hashline for file edits.`,
    capabilities: ['coding', 'refactoring', 'typescript', 'testing'],
    category: 'business-logic',
    maxConcurrency: 2,
    timeoutMs: 180000,
  },

  reviewer: {
    role: 'reviewer',
    name: 'Reviewer',
    model: 'claude-opus-4',
    fallbackModels: ['kimi-k2.5'],
    temperature: 0.1,
    maxTokens: 4000,
    systemPrompt: `You are a code reviewer. You:
1. Check for bugs and logic errors
2. Verify TypeScript types
3. Ensure security best practices
4. Validate against project conventions
5. Suggest improvements without being nitpicky

Be constructive but thorough. Flag real issues, not style preferences.`,
    capabilities: ['code-review', 'security-audit', 'type-checking', 'best-practices'],
    category: 'review',
    maxConcurrency: 4,
    timeoutMs: 60000,
  },

  debugger: {
    role: 'debugger',
    name: 'Oracle',
    model: 'gpt-5.4',
    fallbackModels: ['claude-opus-4'],
    temperature: 0.2,
    maxTokens: 6000,
    systemPrompt: `You are Oracle, the debugger. You:
1. Analyze error logs and stack traces
2. Trace execution flow
3. Identify root causes
4. Propose minimal fixes
5. Prevent similar bugs

Think step-by-step. Verify your hypotheses before proposing fixes.`,
    capabilities: ['debugging', 'log-analysis', 'tracing', 'root-cause-analysis'],
    category: 'debugging',
    maxConcurrency: 2,
    timeoutMs: 120000,
  },

  planner: {
    role: 'planner',
    name: 'Prometheus',
    model: 'claude-opus-4',
    fallbackModels: ['kimi-k2.5', 'glm-5'],
    temperature: 0.3,
    maxTokens: 4000,
    systemPrompt: `You are Prometheus, the planner. Before any execution:
1. Interview the user like a senior engineer
2. Identify ambiguities and scope
3. Build a detailed, verified plan
4. Break down into discrete tasks
5. Estimate complexity and dependencies

Never start coding without a plan. Question assumptions. Surface hidden requirements.`,
    capabilities: ['planning', 'requirements-gathering', 'estimation', 'architecture'],
    category: 'planning',
    maxConcurrency: 1,
    timeoutMs: 180000,
  },

  librarian: {
    role: 'librarian',
    name: 'Librarian',
    model: 'kimi-k2.5',
    fallbackModels: ['gpt-5.4'],
    temperature: 0.1,
    maxTokens: 4000,
    systemPrompt: `You are the Librarian. You:
1. Search codebases efficiently
2. Find relevant documentation
3. Map dependencies and relationships
4. Surface relevant context
5. Answer "where is X?" questions

Be fast and precise. Return file paths and line numbers.`,
    capabilities: ['code-search', 'documentation-lookup', 'dependency-mapping'],
    category: 'research',
    maxConcurrency: 5,
    timeoutMs: 30000,
  },

  visual: {
    role: 'visual',
    name: 'Designer',
    model: 'claude-opus-4',
    fallbackModels: ['kimi-k2.5'],
    temperature: 0.4,
    maxTokens: 4000,
    systemPrompt: `You are a UI/UX specialist. You:
1. Design intuitive interfaces
2. Write clean React/Next.js code
3. Ensure accessibility
4. Match existing design systems
5. Optimize for performance

Think in components. Consider responsive design.`,
    capabilities: ['ui-design', 'react', 'css', 'accessibility', 'responsive'],
    category: 'visual-engineering',
    maxConcurrency: 2,
    timeoutMs: 120000,
  },
}

// Category to agent role mapping
export const CATEGORY_AGENTS: Record<TaskCategory, AgentRole[]> = {
  'visual-engineering': ['visual', 'implementer'],
  'business-logic': ['implementer', 'researcher'],
  debugging: ['debugger', 'researcher', 'orchestrator'],
  planning: ['planner', 'orchestrator'],
  research: ['librarian', 'researcher'],
  review: ['reviewer'],
  quick: ['implementer'],
  ultrabrain: ['orchestrator', 'planner', 'researcher'],
}

/**
 * Route a task to the appropriate agent based on category
 */
export function routeToAgent(
  task: string,
  category: TaskCategory = 'business-logic'
): AgentConfig {
  const roles = CATEGORY_AGENTS[category]
  if (!roles || roles.length === 0) {
    return AGENT_CONFIGS.orchestrator
  }

  // For now, return first matching agent
  // In production, this could use intent analysis to pick best match
  return AGENT_CONFIGS[roles[0]]
}

/**
 * Execute a task with the routed agent
 */
export async function routeTask(
  task: string,
  category: TaskCategory = 'business-logic',
  context?: TaskRequest['context']
): Promise<TaskResult> {
  const agent = routeToAgent(task, category)

  console.log(`[Orchestrator] Routing "${task.slice(0, 50)}..." to ${agent.name} (${agent.role})`)

  // In production, this would call the actual AI model
  // For now, return a mock result
  return {
    success: true,
    agent: agent.role,
    model: agent.model,
    output: `Task routed to ${agent.name} with ${agent.model}`,
    metadata: {
      tokensUsed: 0,
      latencyMs: 0,
      iterations: 1,
    },
  }
}

/**
 * Execute multiple subtasks in parallel
 */
export async function executeParallel(
  subtasks: Array<{
    task: string
    category: TaskCategory
  }>
): Promise<TaskResult[]> {
  console.log(`[Orchestrator] Executing ${subtasks.length} subtasks in parallel`)

  // In production, these would actually run in parallel
  // with proper concurrency limits per agent
  const results: TaskResult[] = []

  for (const subtask of subtasks) {
    const result = await routeTask(subtask.task, subtask.category)
    results.push(result)
  }

  return results
}

/**
 * Check if a task should be escalated to planner
 */
export function shouldUsePlanner(task: string): boolean {
  const complexIndicators = [
    'architecture',
    'redesign',
    'refactor',
    'migration',
    'implement',
    'build',
    'create',
    'design',
    'strategy',
    'plan',
    'multiple',
    'complex',
    'integrate',
  ]

  const taskLower = task.toLowerCase()
  return (
    complexIndicators.some((indicator) => taskLower.includes(indicator)) ||
    task.length > 200 ||
    task.split(' ').length > 30
  )
}

/**
 * Get agent for task with auto-detection
 */
export function autoRoute(task: string): AgentConfig {
  // Check for complex tasks that need planning
  if (shouldUsePlanner(task)) {
    return AGENT_CONFIGS.planner
  }

  // Check for debugging keywords
  const debugKeywords = ['fix', 'bug', 'error', 'crash', 'debug', 'broken', 'fails', 'issue']
  if (debugKeywords.some((kw) => task.toLowerCase().includes(kw))) {
    return AGENT_CONFIGS.debugger
  }

  // Check for visual/UI keywords
  const visualKeywords = ['ui', 'css', 'component', 'page', 'design', 'layout', 'style', 'frontend']
  if (visualKeywords.some((kw) => task.toLowerCase().includes(kw))) {
    return AGENT_CONFIGS.visual
  }

  // Check for research keywords
  const researchKeywords = ['find', 'search', 'lookup', 'where', 'how does', 'explain']
  if (researchKeywords.some((kw) => task.toLowerCase().includes(kw))) {
    return AGENT_CONFIGS.librarian
  }

  // Default to implementer
  return AGENT_CONFIGS.implementer
}
