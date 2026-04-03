/**
 * Hook Classify API — Called by Docker agent pre-tool-use hook
 *
 * POST /api/hooks/classify
 * Body: { toolName, toolInput, agentId, userId }
 * Returns: { allow, reason, requestId?, tier }
 *
 * This is the bridge between the Docker agent hook script and our
 * tiered permission system. Safe commands auto-approve, dangerous
 * commands queue for dashboard approval, destructive commands block.
 */

import { NextRequest, NextResponse } from 'next/server'
// Classify tool call using inline classifier (mirrors agentbot-backend/src/lib/permissions/tiered-classifier.ts)
// This avoids cross-package imports between web and backend

type PermissionTier = 'safe' | 'dangerous' | 'destructive'

const SAFE_COMMANDS = new Set([
  'cat', 'head', 'tail', 'less', 'more', 'ls', 'dir', 'tree', 'find', 'locate',
  'file', 'stat', 'wc', 'du', 'df', 'grep', 'egrep', 'fgrep', 'ag', 'rg',
  'sort', 'uniq', 'cut', 'awk', 'sed', 'tr', 'tee', 'xargs',
  'git status', 'git diff', 'git log', 'git show', 'git branch', 'git tag', 'git remote', 'git blame', 'git reflog',
  'echo', 'printf', 'pwd', 'whoami', 'id', 'date', 'uptime', 'uname', 'hostname',
  'env', 'printenv', 'which', 'whereis', 'curl', 'wget', 'ping', 'nslookup', 'dig',
  'npm list', 'npm view', 'npm outdated', 'pip list', 'pip show',
  'docker ps', 'docker images', 'docker logs', 'docker inspect', 'docker stats',
])

const DESTRUCTIVE_PATTERNS = [
  /^rm\s+(-rf?|--recursive)\s+[~\/]/, /^rm\s+(-rf?|--recursive)\s+\*/, /^sudo\s+rm\s+/,
  /^dd\s+if=/, /^mkfs/, /^fdisk/, /^diskutil\s+eraseDisk/,
  /^gh\s+repo\s+delete/, /DROP\s+(DATABASE|TABLE)/i, /TRUNCATE\s+/i, /DELETE\s+FROM.*WHERE/i,
  /^terraform\s+destroy/, /^railway\s+service\s+delete/, /^docker\s+system\s+prune/, /^docker\s+volume\s+rm/,
  /^sudo\s+/, /^chmod\s+777/, /^chown\s+/,
]

const DANGEROUS_PATTERNS = [
  /^python[23]?\s/, /^node\s/, /^npx\s/, /^npm\s+(run|install|publish)/, /^pip\s+install/,
  /^curl\s+.*(-X|--request)\s+(POST|PUT|DELETE|PATCH)/, /^curl\s+.*-d\s/,
  /^git\s+(push|commit|merge|rebase|reset|checkout)/,
  /^docker\s+(run|build|push|pull|exec|rm|rmi)/,
  /^ssh\s+/, /^scp\s+/, /^rsync\s+/,
  /^mv\s+\//, /^cp\s+.*\s+\//, /^brew\s+(install|uninstall|upgrade)/,
  /^railway\s+(up|deploy|env)/, /^vercel\s+(--prod|env|deploy)/,
]

function classifyToolCall(toolName: string, toolInput: Record<string, unknown>): { tier: PermissionTier; reason: string; autoApprove: boolean } {
  if (toolName === 'bash' || toolName === 'exec' || toolName === 'shell') {
    const command = ((toolInput.command as string) || (toolInput.input as string) || '').trim()
    for (const p of DESTRUCTIVE_PATTERNS) { if (p.test(command)) return { tier: 'destructive', reason: `Destructive: ${p.source}`, autoApprove: false } }
    for (const p of DANGEROUS_PATTERNS) { if (p.test(command)) return { tier: 'dangerous', reason: `Dangerous: ${p.source}`, autoApprove: false } }
    for (const safe of SAFE_COMMANDS) { if (command.toLowerCase().startsWith(safe.toLowerCase())) return { tier: 'safe', reason: `Safe: ${safe}`, autoApprove: true } }
    return { tier: 'dangerous', reason: 'Unknown command', autoApprove: false }
  }
  if (toolName === 'write' || toolName === 'file_write') {
    const path = (toolInput.path as string) || ''
    if (path.includes('.env') || path.includes('credentials') || path.includes('.ssh')) return { tier: 'dangerous', reason: 'Sensitive path', autoApprove: false }
    return { tier: 'safe', reason: 'File write', autoApprove: true }
  }
  if (toolName === 'read' || toolName === 'file_read') return { tier: 'safe', reason: 'File read', autoApprove: true }
  return { tier: 'dangerous', reason: 'Unknown tool', autoApprove: false }
}

// Reuse pending requests store (shared with /api/permissions)
const pendingRequests = new Map<string, {
  id: string
  agentId: string
  userId: string
  toolName: string
  toolInput: Record<string, unknown>
  tier: string
  reason: string
  timestamp: number
  status: 'pending' | 'approved' | 'rejected'
}>()

export async function POST(req: NextRequest) {
  // Auth check — must have valid internal API key
  const authHeader = req.headers.get('authorization')
  const expectedKey = process.env.INTERNAL_API_KEY
  if (!expectedKey || authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { toolName, toolInput, agentId, userId } = body

  if (!toolName) {
    return NextResponse.json({ allow: false, reason: 'Missing toolName' }, { status: 400 })
  }

  // Classify the tool call
  const classification = classifyToolCall(toolName, toolInput || {})

  // Safe → auto-approve
  if (classification.autoApprove) {
    return NextResponse.json({
      allow: true,
      tier: classification.tier,
      reason: classification.reason,
    })
  }

  // Destructive → block
  if (classification.tier === 'destructive') {
    return NextResponse.json({
      allow: false,
      tier: 'destructive',
      reason: `Blocked: ${classification.reason}`,
    })
  }

  // Dangerous → queue for dashboard approval
  const requestId = `hook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  pendingRequests.set(requestId, {
    id: requestId,
    agentId: agentId || 'unknown',
    userId: userId || 'unknown',
    toolName,
    toolInput: toolInput || {},
    tier: classification.tier,
    reason: classification.reason,
    timestamp: Date.now(),
    status: 'pending',
  })

  // Return pending — agent should wait for dashboard approval
  return NextResponse.json({
    allow: false,
    tier: 'dangerous',
    reason: `Queued for approval: ${classification.reason}`,
    requestId,
  })
}
