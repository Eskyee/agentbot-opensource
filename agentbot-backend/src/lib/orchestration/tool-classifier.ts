/**
 * Tool Concurrency Classifier
 *
 * Classifies tools as read-only (parallelizable) or mutating (must serialize).
 * Based on Claude Code's concurrent tool orchestration pattern:
 * "Read-only tools parallelize. Write tools serialize."
 */

export type ConcurrencyClass = 'readonly' | 'mutating'

export interface ToolClassification {
  class: ConcurrencyClass
  toolName: string
  reason: string
  parallelizable: boolean
}

// Read-only tools — safe to run in parallel
const READONLY_TOOLS = new Set([
  // File reads
  'read',
  'file_read',
  'file_read_tool',

  // Search
  'grep',
  'search',
  'find',
  'glob',

  // System info
  'bash_status',
  'docker_ps',
  'docker_logs',
  'docker_inspect',

  // Web
  'web_fetch',
  'web_search',
  'http_get',

  // Memory (read)
  'memory_search',
  'memory_get',
])

// Mutating tools — must serialize
const MUTATING_TOOLS = new Set([
  // File writes
  'write',
  'file_write',
  'file_write_tool',
  'edit',
  'file_edit',
  'file_edit_tool',

  // Shell execution (may have side effects)
  'bash',
  'exec',
  'shell',
  'terminal',

  // Git writes
  'git_commit',
  'git_push',
  'git_merge',

  // Docker writes
  'docker_run',
  'docker_build',
  'docker_exec',

  // API calls (POST/PUT/DELETE)
  'http_post',
  'http_put',
  'http_delete',
  'api_call',

  // System modification
  'install',
  'uninstall',
  'deploy',

  // Agentbot specific
  'provision',
  'configure',
  'restart',
])

/**
 * Classify a tool as read-only or mutating.
 *
 * Unknown tools default to mutating (safe default).
 */
export function classifyTool(toolName: string, toolInput?: Record<string, unknown>): ToolClassification {
  const normalized = toolName.toLowerCase().replace(/-/g, '_')

  // Check read-only first
  if (READONLY_TOOLS.has(normalized)) {
    return {
      class: 'readonly',
      toolName: normalized,
      reason: `${toolName} is read-only`,
      parallelizable: true,
    }
  }

  // Bash/exec: check if the command itself is read-only (before mutating set)
  if (normalized === 'bash' || normalized === 'exec' || normalized === 'shell') {
    const command = (toolInput?.command as string) || (toolInput?.input as string) || ''
    if (isReadonlyCommand(command)) {
      return {
        class: 'readonly',
        toolName: normalized,
        reason: `Shell command is read-only: ${command}`,
        parallelizable: true,
      }
    }
    return {
      class: 'mutating',
      toolName: normalized,
      reason: `Shell command may mutate: ${command}`,
      parallelizable: false,
    }
  }

  // Check mutating
  if (MUTATING_TOOLS.has(normalized)) {
    return {
      class: 'mutating',
      toolName: normalized,
      reason: `${toolName} is mutating`,
      parallelizable: false,
    }
  }

  // Unknown tools default to mutating (safe)
  return {
    class: 'mutating',
    toolName: normalized,
    reason: `Unknown tool — defaulting to mutating`,
    parallelizable: false,
  }
}

// Read-only shell commands (subset of safe commands that have no side effects)
const READONLY_SHELL_COMMANDS = new Set([
  'cat', 'head', 'tail', 'less', 'more',
  'ls', 'dir', 'tree', 'find', 'locate',
  'file', 'stat', 'wc', 'du', 'df',
  'grep', 'egrep', 'fgrep', 'ag', 'rg',
  'sort', 'uniq', 'cut', 'awk',
  'echo', 'printf', 'pwd', 'whoami', 'id',
  'date', 'uptime', 'uname', 'hostname',
  'env', 'printenv', 'which', 'whereis',
  'git status', 'git diff', 'git log', 'git show',
  'git branch', 'git tag', 'git remote',
  'git blame', 'git reflog',
  'npm list', 'npm view', 'npm outdated',
  'pip list', 'pip show',
  'docker ps', 'docker images', 'docker logs',
  'docker inspect', 'docker stats',
])

function isReadonlyCommand(command: string): boolean {
  const trimmed = command.trim().toLowerCase()
  for (const readonly of READONLY_SHELL_COMMANDS) {
    if (trimmed.startsWith(readonly)) {
      return true
    }
  }
  // curl GET requests are read-only
  if (trimmed.startsWith('curl') && !trimmed.includes('-X') && !trimmed.includes('--request') && !trimmed.includes('-d ')) {
    return true
  }
  return false
}
