export type SkillRiskLevel = 'low' | 'medium' | 'high' | 'blocked'
export type SkillTrustTier = 'trusted' | 'verified' | 'review' | 'blocked'

export interface SkillMarketplaceScanInput {
  name: string
  description?: string
  code?: string
  author?: string
  featured?: boolean
  sourceUrl?: string | null
}

export interface SkillMarketplaceScanResult {
  trustTier: SkillTrustTier
  riskLevel: SkillRiskLevel
  installAllowed: boolean
  reasons: string[]
  warnings: string[]
  requiresManualReview: boolean
}

const BLOCK_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\bcurl\b[\s\S]{0,60}\|\s*(bash|sh)\b/i, reason: 'Piped shell execution detected' },
  { pattern: /\bwget\b[\s\S]{0,60}\|\s*(bash|sh)\b/i, reason: 'Remote shell bootstrap detected' },
  { pattern: /\beval\s*\(/i, reason: 'Dynamic code execution via eval detected' },
  { pattern: /\bFunction\s*\(/i, reason: 'Dynamic code execution via Function constructor detected' },
  { pattern: /\bchild_process\b/i, reason: 'Process execution capability imported' },
  { pattern: /\b(exec|spawn|execFile|fork)\s*\(/i, reason: 'Process execution call detected' },
  { pattern: /\brm\s+-rf\b/i, reason: 'Destructive filesystem command detected' },
  { pattern: /\bprocess\.env\b/i, reason: 'Direct environment variable access detected' },
  { pattern: /https?:\/\/[0-9]{1,3}(\.[0-9]{1,3}){3}/i, reason: 'Direct IP-based remote endpoint detected' },
]

const WARN_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\bfs\b/i, reason: 'Filesystem access present' },
  { pattern: /\bfetch\s*\(/i, reason: 'Network access present' },
  { pattern: /\baxios\b/i, reason: 'Network library imported' },
  { pattern: /\bwebsocket\b|\bws\b/i, reason: 'Socket or realtime network access present' },
  { pattern: /\blocalStorage\b/i, reason: 'Local storage access present' },
  { pattern: /\bcrypto\b/i, reason: 'Cryptographic or wallet-related logic present' },
]

const VERIFIED_AUTHOR_ALLOWLIST = new Set(['Agentbot', 'OpenAI', 'OpenClaw', 'BaseFM'])

export function scanSkillMarketplaceInput(input: SkillMarketplaceScanInput): SkillMarketplaceScanResult {
  const code = input.code || ''
  const author = (input.author || '').trim()
  const reasons: string[] = []
  const warnings: string[] = []

  for (const entry of BLOCK_PATTERNS) {
    if (entry.pattern.test(code)) reasons.push(entry.reason)
  }

  for (const entry of WARN_PATTERNS) {
    if (entry.pattern.test(code)) warnings.push(entry.reason)
  }

  if (!input.description?.trim()) {
    warnings.push('Description missing or empty')
  }

  if (!input.sourceUrl?.trim()) {
    warnings.push('Source URL missing')
  }

  const trustedAuthor = VERIFIED_AUTHOR_ALLOWLIST.has(author)
  const featured = Boolean(input.featured)

  if (reasons.length > 0) {
    return {
      trustTier: 'blocked',
      riskLevel: 'blocked',
      installAllowed: false,
      reasons,
      warnings,
      requiresManualReview: true,
    }
  }

  const mediumRisk = warnings.length >= 3 || /wallet|seed|private key|mnemonic/i.test(`${input.name} ${input.description || ''}`)

  if (trustedAuthor || featured) {
    return {
      trustTier: 'trusted',
      riskLevel: mediumRisk ? 'medium' : 'low',
      installAllowed: true,
      reasons: [],
      warnings,
      requiresManualReview: mediumRisk,
    }
  }

  if (input.sourceUrl && warnings.length <= 1) {
    return {
      trustTier: 'verified',
      riskLevel: mediumRisk ? 'medium' : 'low',
      installAllowed: true,
      reasons: [],
      warnings,
      requiresManualReview: mediumRisk,
    }
  }

  return {
    trustTier: 'review',
    riskLevel: mediumRisk ? 'high' : 'medium',
    installAllowed: true,
    reasons: [],
    warnings,
    requiresManualReview: true,
  }
}
