/**
 * Structured logger for agentbot-backend.
 * Replaces raw console.* calls with JSON-structured output.
 * Uses console under the hood (no pino dependency) but enforces structured format.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  level: LogLevel
  msg: string
  ts: string
  [key: string]: unknown
}

function write(level: LogLevel, msg: string, meta?: Record<string, unknown>) {
  const entry: LogEntry = {
    level,
    msg,
    ts: new Date().toISOString(),
    ...meta,
  }

  const line = JSON.stringify(entry)

  switch (level) {
    case 'error':
      console.error(line)
      break
    case 'warn':
      console.warn(line)
      break
    case 'debug':
      if (process.env.LOG_LEVEL === 'debug') console.log(line)
      break
    default:
      console.log(line)
  }
}

export const log = {
  info: (msg: string, meta?: Record<string, unknown>) => write('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => write('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => write('error', msg, meta),
  debug: (msg: string, meta?: Record<string, unknown>) => write('debug', msg, meta),

  /** Child logger with preset context fields */
  child: (ctx: Record<string, unknown>) => ({
    info: (msg: string, meta?: Record<string, unknown>) => write('info', msg, { ...ctx, ...meta }),
    warn: (msg: string, meta?: Record<string, unknown>) => write('warn', msg, { ...ctx, ...meta }),
    error: (msg: string, meta?: Record<string, unknown>) => write('error', msg, { ...ctx, ...meta }),
    debug: (msg: string, meta?: Record<string, unknown>) => write('debug', msg, { ...ctx, ...meta }),
  }),
}
