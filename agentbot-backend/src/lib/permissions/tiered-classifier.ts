/**
 * Tiered Permission Classifier — Runtime Command Classification
 *
 * Classifies commands into three tiers:
 * - SAFE: Auto-approve (read-only, filesystem browse)
 * - DANGEROUS: Route to dashboard for user approval
 * - DESTRUCTIVE: Block by default, user must explicitly enable
 *
 * Based on Claude Code's bash classifier pattern.
 */

export type PermissionTier = 'safe' | 'dangerous' | 'destructive'

export interface ClassificationResult {
  tier: PermissionTier
  command: string
  reason: string
  confidence: 'high' | 'medium' | 'low'
  autoApprove: boolean
}

// Safe commands — auto-approve
const SAFE_COMMANDS = new Set([
  // Filesystem read
  'cat', 'head', 'tail', 'less', 'more',
  'ls', 'dir', 'tree', 'find', 'locate',
  'file', 'stat', 'wc', 'du', 'df',
  
  // Text processing
  'grep', 'egrep', 'fgrep', 'ag', 'rg',
  'sort', 'uniq', 'cut', 'awk', 'sed',
  'tr', 'tee', 'xargs',
  
  // Git read-only
  'git status', 'git diff', 'git log', 'git show',
  'git branch', 'git tag', 'git remote',
  'git blame', 'git reflog',
  
  // System info
  'echo', 'printf', 'pwd', 'whoami', 'id',
  'date', 'uptime', 'uname', 'hostname',
  'env', 'printenv', 'which', 'whereis',
  
  // Network read-only
  'curl', 'wget', 'ping', 'nslookup', 'dig',
  'host', 'traceroute',
  
  // Package info
  'npm list', 'npm view', 'npm outdated',
  'pip list', 'pip show',
  
  // Docker read-only
  'docker ps', 'docker images', 'docker logs',
  'docker inspect', 'docker stats',
])

// Destructive commands — block by default
const DESTRUCTIVE_COMMANDS = [
  // Filesystem destruction
  /^rm\s+(-rf?|--recursive)\s+[~\/]/,
  /^rm\s+(-rf?|--recursive)\s+\*/,
  /^sudo\s+rm\s+/,
  /^dd\s+if=/,
  /^mkfs/,
  /^fdisk/,
  /^diskutil\s+eraseDisk/,
  
  // Repository destruction
  /^gh\s+repo\s+delete/,
  /^gh\s+repo\s+edit\s+.*--visibility\s+public/,
  
  // Database destruction
  /DROP\s+(DATABASE|TABLE)/i,
  /TRUNCATE\s+/i,
  /DELETE\s+FROM.*WHERE/i,
  
  // Infrastructure destruction
  /^terraform\s+destroy/,
  /^railway\s+service\s+delete/,
  /^docker\s+system\s+prune/,
  /^docker\s+volume\s+rm/,
  
  // System modification
  /^sudo\s+/,
  /^chmod\s+777/,
  /^chown\s+/,
]

// Dangerous commands — route to dashboard
const DANGEROUS_COMMANDS = [
  // Code execution
  /^python[23]?\s/,
  /^node\s/,
  /^npx\s/,
  /^npm\s+(run|install|publish)/,
  /^pip\s+install/,
  
  // Network writes
  /^curl\s+.*(-X|--request)\s+(POST|PUT|DELETE|PATCH)/,
  /^curl\s+.*-d\s/,
  /^wget\s+.*--post/,
  
  // Git writes
  /^git\s+(push|commit|merge|rebase|reset|checkout)/,
  
  // Container writes
  /^docker\s+(run|build|push|pull|exec|rm|rmi)/,
  
  // Remote execution
  /^ssh\s+/,
  /^scp\s+/,
  /^rsync\s+/,
  
  // File writes
  />\s*\//,
  /^mv\s+\//,
  /^cp\s+.*\s+\//,
  
  // Package management
  /^brew\s+(install|uninstall|upgrade)/,
  /^apt-get\s+(install|remove)/,
  
  // Agentbot-specific
  /^railway\s+(up|deploy|env)/,
  /^vercel\s+(--prod|env|deploy)/,
]

/**
 * Classify a command into a permission tier
 */
export function classifyCommand(command: string): ClassificationResult {
  const trimmed = command.trim()
  const baseCommand = trimmed.split(/\s+/)[0]
  
  // Check destructive first (highest priority)
  for (const pattern of DESTRUCTIVE_COMMANDS) {
    if (pattern.test(trimmed)) {
      return {
        tier: 'destructive',
        command: trimmed,
        reason: `Destructive command: ${pattern.source}`,
        confidence: 'high',
        autoApprove: false,
      }
    }
  }
  
  // Check dangerous
  for (const pattern of DANGEROUS_COMMANDS) {
    if (pattern.test(trimmed)) {
      return {
        tier: 'dangerous',
        command: trimmed,
        reason: `Dangerous command: ${pattern.source}`,
        confidence: 'high',
        autoApprove: false,
      }
    }
  }
  
  // Check safe (including subcommands like "git status")
  const fullCommand = trimmed.toLowerCase()
  for (const safe of SAFE_COMMANDS) {
    if (fullCommand.startsWith(safe.toLowerCase())) {
      return {
        tier: 'safe',
        command: trimmed,
        reason: `Safe command: ${safe}`,
        confidence: 'high',
        autoApprove: true,
      }
    }
  }
  
  // Unknown commands default to dangerous
  return {
    tier: 'dangerous',
    command: trimmed,
    reason: 'Unknown command — defaulting to dangerous',
    confidence: 'low',
    autoApprove: false,
  }
}

/**
 * Classify a tool call (for Docker agent hook integration)
 */
export function classifyToolCall(toolName: string, toolInput: Record<string, unknown>): ClassificationResult {
  if (toolName === 'bash' || toolName === 'exec' || toolName === 'shell') {
    const command = (toolInput.command as string) || (toolInput.input as string) || ''
    return classifyCommand(command)
  }
  
  if (toolName === 'write' || toolName === 'file_write') {
    const path = (toolInput.path as string) || (toolInput.file_path as string) || ''
    if (path.includes('.env') || path.includes('credentials') || path.includes('.ssh')) {
      return {
        tier: 'dangerous',
        command: `write ${path}`,
        reason: 'Writing to sensitive path',
        confidence: 'high',
        autoApprove: false,
      }
    }
    return {
      tier: 'safe',
      command: `write ${path}`,
      reason: 'File write to non-sensitive path',
      confidence: 'medium',
      autoApprove: true,
    }
  }
  
  if (toolName === 'read' || toolName === 'file_read') {
    return {
      tier: 'safe',
      command: `read ${toolInput.path || toolInput.file_path || ''}`,
      reason: 'File read is always safe',
      confidence: 'high',
      autoApprove: true,
    }
  }
  
  // Unknown tools default to dangerous
  return {
    tier: 'dangerous',
    command: `tool:${toolName}`,
    reason: 'Unknown tool — defaulting to dangerous',
    confidence: 'low',
    autoApprove: false,
  }
}
