/**
 * session-recovery.ts — Automatic Session Recovery
 *
 * Recovers from session errors, context window limits, and API failures.
 * Inspired by Oh My OpenAgent's session recovery.
 *
 * Usage:
 *   import { sessionRecovery } from '@/app/lib/session-recovery'
 *
 *   sessionRecovery.checkpoint('analysis-complete', data)
 *   // ... later if crash ...
 *   const recovered = sessionRecovery.recover('analysis-complete')
 */

export interface RecoveryCheckpoint {
  id: string
  label: string
  data: unknown
  timestamp: Date
  sessionId: string
  metadata?: Record<string, unknown>
}

export interface RecoverySession {
  id: string
  startedAt: Date
  lastCheckpointAt: Date
  checkpoints: RecoveryCheckpoint[]
  status: 'active' | 'recovered' | 'failed'
  error?: string
}

export interface RecoveryOptions {
  maxCheckpoints?: number
  autoSaveInterval?: number // minutes
  storage?: 'memory' | 'localStorage' | 'database'
}

/**
 * Session Recovery Manager
 */
export class SessionRecovery {
  private sessions: Map<string, RecoverySession> = new Map()
  private options: RecoveryOptions
  private autoSaveInterval?: NodeJS.Timeout

  constructor(options: RecoveryOptions = {}) {
    this.options = {
      maxCheckpoints: 50,
      autoSaveInterval: 5,
      storage: 'memory',
      ...options
    }

    if (this.options.autoSaveInterval) {
      this.startAutoSave()
    }
  }

  /**
   * Create a new recovery session
   */
  createSession(sessionId?: string): RecoverySession {
    const id = sessionId || `session-${Date.now()}`
    const session: RecoverySession = {
      id,
      startedAt: new Date(),
      lastCheckpointAt: new Date(),
      checkpoints: [],
      status: 'active'
    }

    this.sessions.set(id, session)
    console.log(`[SessionRecovery] Created session: ${id}`)
    return session
  }

  /**
   * Save a checkpoint
   */
  checkpoint(
    sessionId: string,
    label: string,
    data: unknown,
    metadata?: Record<string, unknown>
  ): RecoveryCheckpoint {
    let session = this.sessions.get(sessionId)
    if (!session) {
      session = this.createSession(sessionId)
    }

    const checkpoint: RecoveryCheckpoint = {
      id: `cp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      label,
      data,
      timestamp: new Date(),
      sessionId,
      metadata
    }

    session.checkpoints.push(checkpoint)
    session.lastCheckpointAt = new Date()

    // Limit checkpoints
    if (session.checkpoints.length > (this.options.maxCheckpoints || 50)) {
      session.checkpoints = session.checkpoints.slice(-(this.options.maxCheckpoints || 50))
    }

    console.log(`[SessionRecovery] Checkpoint: ${label} (${sessionId})`)
    return checkpoint
  }

  /**
   * Recover from a checkpoint
   */
  recover(sessionId: string, checkpointLabel?: string): RecoveryCheckpoint | null {
    const session = this.sessions.get(sessionId)
    if (!session) {
      console.warn(`[SessionRecovery] No session found: ${sessionId}`)
      return null
    }

    if (checkpointLabel) {
      // Find specific checkpoint
      const checkpoint = session.checkpoints.find(cp => cp.label === checkpointLabel)
      if (checkpoint) {
        session.status = 'recovered'
        console.log(`[SessionRecovery] Recovered to: ${checkpointLabel} (${sessionId})`)
        return checkpoint
      }
    } else {
      // Return latest checkpoint
      const latest = session.checkpoints[session.checkpoints.length - 1]
      if (latest) {
        session.status = 'recovered'
        console.log(`[SessionRecovery] Recovered to latest: ${latest.label} (${sessionId})`)
        return latest
      }
    }

    console.warn(`[SessionRecovery] No checkpoint found for recovery (${sessionId})`)
    return null
  }

  /**
   * Get session history
   */
  getHistory(sessionId: string): RecoveryCheckpoint[] {
    const session = this.sessions.get(sessionId)
    return session?.checkpoints || []
  }

  /**
   * Mark session as failed
   */
  failSession(sessionId: string, error: string): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.status = 'failed'
      session.error = error
      console.error(`[SessionRecovery] Session failed: ${sessionId} - ${error}`)
    }
  }

  /**
   * Retry from last checkpoint
   */
  async retry<T>(
    sessionId: string,
    operation: (data: unknown) => Promise<T>,
    maxRetries: number = 3
  ): Promise<T | null> {
    const checkpoint = this.recover(sessionId)
    if (!checkpoint) {
      throw new Error(`No checkpoint to retry from (${sessionId})`)
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[SessionRecovery] Retry attempt ${attempt}/${maxRetries} (${sessionId})`)
        const result = await operation(checkpoint.data)
        
        // Save new checkpoint on success
        this.checkpoint(sessionId, `retry-success-${attempt}`, result)
        return result

      } catch (error) {
        console.error(`[SessionRecovery] Retry ${attempt} failed:`, error)
        
        if (attempt === maxRetries) {
          this.failSession(sessionId, error instanceof Error ? error.message : String(error))
          return null
        }

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)))
      }
    }

    return null
  }

  /**
   * Handle context window limit
   */
  handleContextLimit(sessionId: string, currentContext: unknown): RecoveryCheckpoint | null {
    console.warn(`[SessionRecovery] Context window limit reached (${sessionId})`)
    
    // Save current state
    this.checkpoint(sessionId, 'context-limit', currentContext, {
      reason: 'context_window_exceeded'
    })

    // Return to last good checkpoint
    const session = this.sessions.get(sessionId)
    if (session && session.checkpoints.length > 1) {
      // Return to checkpoint before the last one
      const previousCheckpoint = session.checkpoints[session.checkpoints.length - 2]
      console.log(`[SessionRecovery] Rolling back to: ${previousCheckpoint.label}`)
      return previousCheckpoint
    }

    return null
  }

  /**
   * Handle API failure
   */
  handleApiFailure(sessionId: string, error: Error, fallbackData?: unknown): RecoveryCheckpoint | null {
    console.error(`[SessionRecovery] API failure: ${error.message} (${sessionId})`)
    
    // Save error state
    this.checkpoint(sessionId, 'api-failure', { error: error.message, fallbackData }, {
      error: error.message,
      type: 'api_failure'
    })

    // Try to recover
    return this.recover(sessionId)
  }

  /**
   * Export session for persistence
   */
  exportSession(sessionId: string): string | null {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    return JSON.stringify({
      ...session,
      checkpoints: session.checkpoints.map(cp => ({
        ...cp,
        timestamp: cp.timestamp.toISOString()
      })),
      startedAt: session.startedAt.toISOString(),
      lastCheckpointAt: session.lastCheckpointAt.toISOString()
    })
  }

  /**
   * Import session from storage
   */
  importSession(serialized: string): RecoverySession {
    const data = JSON.parse(serialized)
    
    const session: RecoverySession = {
      ...data,
      startedAt: new Date(data.startedAt),
      lastCheckpointAt: new Date(data.lastCheckpointAt),
      checkpoints: data.checkpoints.map((cp: any) => ({
        ...cp,
        timestamp: new Date(cp.timestamp)
      }))
    }

    this.sessions.set(session.id, session)
    return session
  }

  /**
   * Clean up old sessions
   */
  cleanup(maxAgeHours: number = 24): void {
    const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000)

    for (const [id, session] of this.sessions) {
      if (session.lastCheckpointAt < cutoff) {
        this.sessions.delete(id)
        console.log(`[SessionRecovery] Cleaned up old session: ${id}`)
      }
    }
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): RecoverySession[] {
    return Array.from(this.sessions.values()).filter(s => s.status === 'active')
  }

  /**
   * Start auto-save interval
   */
  private startAutoSave(): void {
    const intervalMs = (this.options.autoSaveInterval || 5) * 60 * 1000
    
    this.autoSaveInterval = setInterval(() => {
      for (const session of this.sessions.values()) {
        if (session.status === 'active') {
          this.checkpoint(session.id, 'auto-save', {
            timestamp: new Date(),
            checkpoints: session.checkpoints.length
          })
        }
      }
    }, intervalMs)
  }

  /**
   * Stop auto-save
   */
  stop(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval)
    }
  }

  /**
   * Get recovery statistics
   */
  getStats(): {
    totalSessions: number
    activeSessions: number
    totalCheckpoints: number
    failedSessions: number
  } {
    const sessions = Array.from(this.sessions.values())
    
    return {
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => s.status === 'active').length,
      totalCheckpoints: sessions.reduce((sum, s) => sum + s.checkpoints.length, 0),
      failedSessions: sessions.filter(s => s.status === 'failed').length
    }
  }
}

// Singleton instance
export const sessionRecovery = new SessionRecovery()

/**
 * Decorator for automatic checkpointing
 */
export function withRecovery<T extends (...args: any[]) => any>(
  sessionId: string,
  checkpointLabel: string,
  fn: T
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      const result = await fn(...args)
      sessionRecovery.checkpoint(sessionId, checkpointLabel, result)
      return result
    } catch (error) {
      sessionRecovery.failSession(sessionId, error instanceof Error ? error.message : String(error))
      throw error
    }
  }) as T
}

/**
 * Wrap an async function with recovery
 */
export function wrapWithRecovery<TArgs extends any[], TReturn>(
  sessionId: string,
  fn: (...args: TArgs) => Promise<TReturn>
): (...args: TArgs) => Promise<TReturn | null> {
  return async (...args: TArgs): Promise<TReturn | null> => {
    try {
      return await fn(...args)
    } catch (error) {
      console.error(`[SessionRecovery] Error in wrapped function:`, error)
      
      return sessionRecovery.retry(sessionId, async () => {
        return await fn(...args)
      })
    }
  }
}
