/**
 * background-agents.ts — Parallel Background Agent Execution
 *
 * Run multiple agents in parallel like a real dev team.
 * Keeps context lean by delegating to specialists.
 *
 * Inspired by Oh My OpenAgent's background agents.
 *
 * Usage:
 *   import { backgroundAgents } from '@/app/lib/background-agents'
 *
 *   // Fire multiple agents in parallel
 *   const results = await backgroundAgents.execute([
 *     { task: 'Analyze API', agent: 'researcher' },
 *     { task: 'Design UI', agent: 'visual' },
 *     { task: 'Write tests', agent: 'reviewer' }
 *   ])
 */

import { AgentConfig, AGENT_CONFIGS, AgentRole, TaskResult } from '@/app/lib/orchestration'

export interface BackgroundTask {
  id: string
  task: string
  agent: AgentRole
  priority?: 'low' | 'medium' | 'high' | 'critical'
  context?: Record<string, unknown>
  timeoutMs?: number
}

export interface BackgroundResult {
  taskId: string
  success: boolean
  agent: AgentRole
  output: string
  error?: string
  startedAt: Date
  completedAt: Date
  latencyMs: number
}

export interface ExecutionOptions {
  maxConcurrency?: number
  timeoutMs?: number
  continueOnError?: boolean
  onProgress?: (completed: number, total: number) => void
}

/**
 * Background Agents Manager
 */
export class BackgroundAgents {
  private maxConcurrency: number
  private activeExecutions: Map<string, Promise<BackgroundResult>> = new Map()

  constructor(maxConcurrency: number = 5) {
    this.maxConcurrency = maxConcurrency
  }

  /**
   * Execute multiple tasks in parallel
   */
  async execute(
    tasks: Omit<BackgroundTask, 'id'>[],
    options: ExecutionOptions = {}
  ): Promise<BackgroundResult[]> {
    const { maxConcurrency = this.maxConcurrency, continueOnError = true, onProgress } = options

    // Assign IDs to tasks
    const tasksWithIds: BackgroundTask[] = tasks.map((t, idx) => ({
      ...t,
      id: `bg-${Date.now()}-${idx}`
    }))

    console.log(`[BackgroundAgents] Executing ${tasks.length} tasks with concurrency ${maxConcurrency}`)

    const results: BackgroundResult[] = []
    const queue = [...tasksWithIds]
    const executing = new Set<string>()

    return new Promise((resolve) => {
      const processNext = async () => {
        // Check if done
        if (queue.length === 0 && executing.size === 0) {
          resolve(results)
          return
        }

        // Fill concurrency slots
        while (queue.length > 0 && executing.size < maxConcurrency) {
          const task = queue.shift()!
          executing.add(task.id)

          // Execute task
          this.executeTask(task, options.timeoutMs)
            .then(result => {
              results.push(result)
              executing.delete(task.id)
              onProgress?.(results.length, tasks.length)
              processNext()
            })
            .catch(error => {
              results.push({
                taskId: task.id,
                success: false,
                agent: task.agent,
                output: '',
                error: error instanceof Error ? error.message : String(error),
                startedAt: new Date(),
                completedAt: new Date(),
                latencyMs: 0
              })
              executing.delete(task.id)
              onProgress?.(results.length, tasks.length)
              
              if (!continueOnError) {
                resolve(results)
                return
              }
              processNext()
            })
        }
      }

      processNext()
    })
  }

  /**
   * Execute a single background task
   */
  private async executeTask(
    task: BackgroundTask,
    timeoutMs: number = 120000
  ): Promise<BackgroundResult> {
    const startTime = Date.now()
    const startedAt = new Date()

    try {
      const agent = AGENT_CONFIGS[task.agent]
      if (!agent) {
        throw new Error(`Unknown agent: ${task.agent}`)
      }

      console.log(`[BackgroundAgents] ${agent.name} executing: ${task.task.slice(0, 50)}...`)

      // In production, this would call the actual AI model
      // For now, simulate execution
      await this.simulateExecution(task, timeoutMs)

      const completedAt = new Date()
      const latencyMs = Date.now() - startTime

      return {
        taskId: task.id,
        success: true,
        agent: task.agent,
        output: `Task completed by ${agent.name}: ${task.task}`,
        startedAt,
        completedAt,
        latencyMs
      }

    } catch (error) {
      return {
        taskId: task.id,
        success: false,
        agent: task.agent,
        output: '',
        error: error instanceof Error ? error.message : String(error),
        startedAt,
        completedAt: new Date(),
        latencyMs: Date.now() - startTime
      }
    }
  }

  /**
   * Simulate task execution (replace with actual AI calls)
   */
  private async simulateExecution(task: BackgroundTask, timeoutMs: number): Promise<void> {
    // Simulate work time based on task complexity
    const workTime = Math.min(1000 + Math.random() * 2000, timeoutMs)
    await new Promise(resolve => setTimeout(resolve, workTime))
  }

  /**
   * Execute with automatic decomposition
   */
  async executeComplex(
    complexTask: string,
    subtasks: Omit<BackgroundTask, 'id' | 'task'>[],
    options: ExecutionOptions = {}
  ): Promise<BackgroundResult[]> {
    // Create tasks with descriptions
    const tasks: Omit<BackgroundTask, 'id'>[] = subtasks.map((st, idx) => ({
      ...st,
      task: `${complexTask} (part ${idx + 1}/${subtasks.length})`
    }))

    return this.execute(tasks, options)
  }

  /**
   * Map-Reduce pattern
   */
  async mapReduce<T, R>(
    items: T[],
    mapFn: (item: T) => Omit<BackgroundTask, 'id'>,
    reduceFn: (results: BackgroundResult[]) => R,
    options: ExecutionOptions = {}
  ): Promise<R> {
    const tasks = items.map(mapFn)
    const results = await this.execute(tasks, options)
    return reduceFn(results)
  }

  /**
   * Fan-out with aggregation
   */
  async fanOut(
    task: string,
    variations: string[],
    agent: AgentRole,
    options: ExecutionOptions = {}
  ): Promise<BackgroundResult[]> {
    const tasks = variations.map((variation, idx) => ({
      task: `${task} - ${variation}`,
      agent,
      priority: 'medium' as const
    }))

    return this.execute(tasks, options)
  }

  /**
   * Pipeline execution (sequential with handoff)
   */
  async pipeline(
    stages: Array<{
      name: string
      agent: AgentRole
      transform: (input: string) => string
    }>,
    initialInput: string,
    options: ExecutionOptions = {}
  ): Promise<BackgroundResult[]> {
    const results: BackgroundResult[] = []
    let currentInput = initialInput

    for (const stage of stages) {
      const result = await this.execute([
        {
          task: stage.transform(currentInput),
          agent: stage.agent
        }
      ], { ...options, maxConcurrency: 1 })

      results.push(result[0])
      
      if (!result[0].success) {
        break
      }

      currentInput = result[0].output
    }

    return results
  }

  /**
   * Get execution stats
   */
  getStats(): {
    maxConcurrency: number
    activeExecutions: number
  } {
    return {
      maxConcurrency: this.maxConcurrency,
      activeExecutions: this.activeExecutions.size
    }
  }
}

// Singleton instance
export const backgroundAgents = new BackgroundAgents()

/**
 * Quick parallel execution helper
 */
export async function parallel<T>(
  tasks: Array<() => Promise<T>>,
  maxConcurrency: number = 5
): Promise<T[]> {
  const results: T[] = []
  const executing: Promise<void>[] = []

  for (const task of tasks) {
    const promise = task().then(result => {
      results.push(result)
    })

    executing.push(promise)

    if (executing.length >= maxConcurrency) {
      await Promise.race(executing)
      executing.splice(executing.findIndex(p => p === promise), 1)
    }
  }

  await Promise.all(executing)
  return results
}

/**
 * Race multiple agents, return first successful result
 */
export async function raceAgents(
  task: string,
  agents: AgentRole[],
  timeoutMs: number = 30000
): Promise<BackgroundResult> {
  const promises = agents.map(agent =>
    backgroundAgents.execute([{ task, agent }], { timeoutMs, continueOnError: true })
      .then(results => results[0])
  )

  return Promise.race(promises)
}
