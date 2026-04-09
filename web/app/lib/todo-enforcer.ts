/**
 * todo-enforcer.ts — Task Tracking & Progress Enforcement
 *
 * Inspired by Oh My OpenAgent's Todo Enforcer.
 * Tracks tasks, detects idle agents, and ensures completion.
 */

export interface TodoItem {
  id: string
  description: string
  status: 'pending' | 'in-progress' | 'completed' | 'blocked' | 'failed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  agent?: string
  startedAt?: Date
  completedAt?: Date
  estimatedMinutes: number
  actualMinutes?: number
  dependencies: string[]
  subtasks: string[]
  notes: string[]
  retryCount: number
  maxRetries: number
}

export interface TodoSession {
  id: string
  startedAt: Date
  lastActivityAt: Date
  items: TodoItem[]
  currentItemId?: string
  idleThresholdMinutes: number
}

export class TodoEnforcer {
  private sessions: Map<string, TodoSession> = new Map()
  private checkInterval?: NodeJS.Timeout

  constructor(private idleThresholdMinutes: number = 5) {
    this.startIdleChecker()
  }

  /**
   * Create a new todo session
   */
  createSession(sessionId?: string): TodoSession {
    const id = sessionId || `session-${Date.now()}`
    const session: TodoSession = {
      id,
      startedAt: new Date(),
      lastActivityAt: new Date(),
      items: [],
      idleThresholdMinutes: this.idleThresholdMinutes
    }
    this.sessions.set(id, session)
    return session
  }

  /**
   * Add a task to the session
   */
  addTask(
    sessionId: string,
    description: string,
    options: {
      priority?: TodoItem['priority']
      estimatedMinutes?: number
      dependencies?: string[]
    } = {}
  ): TodoItem {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    const item: TodoItem = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      description,
      status: 'pending',
      priority: options.priority || 'medium',
      estimatedMinutes: options.estimatedMinutes || 15,
      dependencies: options.dependencies || [],
      subtasks: [],
      notes: [],
      retryCount: 0,
      maxRetries: 3
    }

    session.items.push(item)
    this.updateActivity(sessionId)

    console.log(`[TodoEnforcer] Added task: ${description}`)
    return item
  }

  /**
   * Start working on a task
   */
  startTask(sessionId: string, taskId: string, agent?: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    const item = session.items.find(i => i.id === taskId)
    if (!item) return

    // Check dependencies
    const unresolvedDeps = item.dependencies.filter(depId => {
      const dep = session.items.find(i => i.id === depId)
      return !dep || dep.status !== 'completed'
    })

    if (unresolvedDeps.length > 0) {
      item.status = 'blocked'
      item.notes.push(`Blocked by: ${unresolvedDeps.join(', ')}`)
      return
    }

    item.status = 'in-progress'
    item.startedAt = new Date()
    item.agent = agent
    session.currentItemId = taskId

    this.updateActivity(sessionId)
    console.log(`[TodoEnforcer] Started task: ${item.description}`)
  }

  /**
   * Mark a task as completed
   */
  completeTask(sessionId: string, taskId: string, notes?: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    const item = session.items.find(i => i.id === taskId)
    if (!item) return

    item.status = 'completed'
    item.completedAt = new Date()
    
    if (item.startedAt) {
      item.actualMinutes = Math.round(
        (item.completedAt.getTime() - item.startedAt.getTime()) / 60000
      )
    }

    if (notes) {
      item.notes.push(notes)
    }

    session.currentItemId = undefined
    this.updateActivity(sessionId)

    console.log(`[TodoEnforcer] Completed task: ${item.description}`)
  }

  /**
   * Mark a task as failed
   */
  failTask(sessionId: string, taskId: string, error: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    const item = session.items.find(i => i.id === taskId)
    if (!item) return

    item.retryCount++
    item.notes.push(`Failed (attempt ${item.retryCount}): ${error}`)

    if (item.retryCount >= item.maxRetries) {
      item.status = 'failed'
      console.error(`[TodoEnforcer] Task failed permanently: ${item.description}`)
    } else {
      item.status = 'pending'
      console.log(`[TodoEnforcer] Task failed, will retry: ${item.description}`)
    }

    session.currentItemId = undefined
    this.updateActivity(sessionId)
  }

  /**
   * Get next pending task
   */
  getNextTask(sessionId: string): TodoItem | undefined {
    const session = this.sessions.get(sessionId)
    if (!session) return undefined

    return session.items.find(i => 
      i.status === 'pending' && 
      i.dependencies.every(depId => {
        const dep = session.items.find(item => item.id === depId)
        return dep?.status === 'completed'
      })
    )
  }

  /**
   * Check session progress
   */
  getProgress(sessionId: string): {
    total: number
    completed: number
    inProgress: number
    pending: number
    blocked: number
    failed: number
    percentComplete: number
  } {
    const session = this.sessions.get(sessionId)
    if (!session) {
      return { total: 0, completed: 0, inProgress: 0, pending: 0, blocked: 0, failed: 0, percentComplete: 0 }
    }

    const items = session.items
    const completed = items.filter(i => i.status === 'completed').length
    const inProgress = items.filter(i => i.status === 'in-progress').length
    const pending = items.filter(i => i.status === 'pending').length
    const blocked = items.filter(i => i.status === 'blocked').length
    const failed = items.filter(i => i.status === 'failed').length

    return {
      total: items.length,
      completed,
      inProgress,
      pending,
      blocked,
      failed,
      percentComplete: items.length > 0 ? Math.round((completed / items.length) * 100) : 0
    }
  }

  /**
   * Check if agent is idle
   */
  isIdle(sessionId: string): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    const idleTime = Date.now() - session.lastActivityAt.getTime()
    return idleTime > session.idleThresholdMinutes * 60 * 1000
  }

  /**
   * Get summary of session
   */
  getSummary(sessionId: string): string {
    const session = this.sessions.get(sessionId)
    if (!session) return 'No session found'

    const progress = this.getProgress(sessionId)
    const items = session.items

    const lines = [
      `Session: ${sessionId}`,
      `Started: ${session.startedAt.toISOString()}`,
      `Last Activity: ${session.lastActivityAt.toISOString()}`,
      ``,
      `Progress: ${progress.completed}/${progress.total} (${progress.percentComplete}%)`,
      `  Completed: ${progress.completed}`,
      `  In Progress: ${progress.inProgress}`,
      `  Pending: ${progress.pending}`,
      `  Blocked: ${progress.blocked}`,
      `  Failed: ${progress.failed}`,
      ``,
      'Tasks:'
    ]

    items.forEach(item => {
      const status = item.status === 'completed' ? '✓' :
                    item.status === 'in-progress' ? '▶' :
                    item.status === 'blocked' ? '⊘' :
                    item.status === 'failed' ? '✗' : '○'
      lines.push(`  ${status} ${item.description}`)
    })

    return lines.join('\n')
  }

  /**
   * Alert when agent goes idle
   */
  private checkIdle(): void {
    this.sessions.forEach((session, sessionId) => {
      if (this.isIdle(sessionId)) {
        const nextTask = this.getNextTask(sessionId)
        if (nextTask) {
          console.warn(`[TodoEnforcer] Session ${sessionId} is idle! Next task waiting: ${nextTask.description}`)
          // In production, this could send notifications, trigger alerts, etc.
        }
      }
    })
  }

  /**
   * Start idle checker
   */
  private startIdleChecker(): void {
    this.checkInterval = setInterval(() => {
      this.checkIdle()
    }, 60000) // Check every minute
  }

  /**
   * Update last activity timestamp
   */
  private updateActivity(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.lastActivityAt = new Date()
    }
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
   * Get all sessions
   */
  getAllSessions(): TodoSession[] {
    return Array.from(this.sessions.values())
  }

  /**
   * Clear completed sessions
   */
  clearCompletedSessions(): void {
    this.sessions.forEach((session, id) => {
      const progress = this.getProgress(id)
      if (progress.percentComplete === 100) {
        this.sessions.delete(id)
      }
    })
  }
}

// Singleton instance
export const todoEnforcer = new TodoEnforcer()

/**
 * Create a task list from a complex request
 */
export function createTaskList(description: string): TodoItem[] {
  // Parse description for subtasks
  const lines = description.split('\n').filter(l => l.trim())
  
  return lines.map((line, idx) => ({
    id: `parsed-${idx}`,
    description: line.replace(/^[-*\d.)]+\s*/, '').trim(),
    status: 'pending',
    priority: 'medium',
    estimatedMinutes: 15,
    dependencies: [],
    subtasks: [],
    notes: [],
    retryCount: 0,
    maxRetries: 3
  }))
}
