/**
 * openclaw-doctor.ts - Diagnostic and Repair Tool for OpenClaw
 * 
 * Inspired by `openclaw doctor --fix` from OpenClaw 2026.4.2
 * Auto-detects and fixes common configuration issues
 */

import { prisma } from './prisma'
import { getOrCreateUserGatewayToken, getSharedGatewayToken, isValidTokenFormat } from './token-manager'

export interface DoctorReport {
  healthy: boolean
  issues: DoctorIssue[]
  fixes: DoctorFix[]
  recommendations: string[]
}

export interface DoctorIssue {
  severity: 'critical' | 'warning' | 'info'
  code: string
  message: string
  details?: string
}

export interface DoctorFix {
  issueCode: string
  applied: boolean
  message: string
  error?: string
}

/**
 * Run OpenClaw diagnostics
 */
export async function runDiagnostics(userId?: string): Promise<DoctorReport> {
  const issues: DoctorIssue[] = []
  const fixes: DoctorFix[] = []
  const recommendations: string[] = []

  // Check 1: Gateway token exists and is valid
  const sharedToken = getSharedGatewayToken()
  if (!sharedToken) {
    issues.push({
      severity: 'critical',
      code: 'MISSING_GATEWAY_TOKEN',
      message: 'No shared gateway token configured',
      details: 'Set OPENCLAW_GATEWAY_TOKEN environment variable'
    })
  } else if (!isValidTokenFormat(sharedToken)) {
    issues.push({
      severity: 'warning',
      code: 'INVALID_TOKEN_FORMAT',
      message: 'Gateway token has invalid format',
      details: `Expected 64-character hex string, got ${sharedToken.length} characters`
    })
  }

  // Check 2: User-specific tokens (if userId provided)
  if (userId) {
    const registration = await prisma.$queryRaw<{ gateway_token: string | null }[]>`
      SELECT gateway_token FROM agent_registrations WHERE user_id = ${userId}
    `
    
    if (!registration[0]?.gateway_token) {
      issues.push({
        severity: 'warning',
        code: 'MISSING_USER_TOKEN',
        message: 'No user-specific gateway token found',
        details: 'User will rely on shared token (less secure)'
      })
      recommendations.push('Run heal-token to generate user-specific token')
    }
  }

  // Check 3: Environment configuration
  const requiredEnvVars = [
    'OPENCLAW_GATEWAY_URL',
    'DATABASE_URL',
    'NEXTAUTH_SECRET'
  ]

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      issues.push({
        severity: 'critical',
        code: `MISSING_${envVar}`,
        message: `Environment variable ${envVar} is not set`,
        details: 'Required for OpenClaw functionality'
      })
    }
  }

  // Check 4: Database connectivity
  try {
    await prisma.$queryRaw`SELECT 1`
  } catch (error) {
    issues.push({
      severity: 'critical',
      code: 'DATABASE_CONNECTION_FAILED',
      message: 'Cannot connect to database',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Determine overall health
  const criticalIssues = issues.filter(i => i.severity === 'critical')
  const healthy = criticalIssues.length === 0

  return {
    healthy,
    issues,
    fixes,
    recommendations
  }
}

/**
 * Auto-fix detected issues
 */
export async function runFixes(userId?: string): Promise<DoctorReport> {
  const diagnostics = await runDiagnostics(userId)
  const fixes: DoctorFix[] = []

  for (const issue of diagnostics.issues) {
    const fix = await applyFix(issue, userId)
    if (fix) fixes.push(fix)
  }

  return {
    ...diagnostics,
    fixes
  }
}

/**
 * Apply a specific fix
 */
async function applyFix(issue: DoctorIssue, userId?: string): Promise<DoctorFix | null> {
  switch (issue.code) {
    case 'MISSING_USER_TOKEN':
      if (userId) {
        try {
          const result = await getOrCreateUserGatewayToken(userId)
          return {
            issueCode: issue.code,
            applied: !!result,
            message: result ? 'Generated new user-specific token' : 'Failed to generate token'
          }
        } catch (error) {
          return {
            issueCode: issue.code,
            applied: false,
            message: 'Failed to generate token',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      }
      return null

    case 'INVALID_TOKEN_FORMAT':
      // Cannot auto-fix invalid format - requires manual intervention
      return {
        issueCode: issue.code,
        applied: false,
        message: 'Manual fix required: regenerate token with correct format'
      }

    default:
      return null
  }
}

/**
 * Generate health report for display
 */
export function formatReport(report: DoctorReport): string {
  const lines: string[] = []
  
  lines.push('🔍 OpenClaw Doctor Report')
  lines.push('=' .repeat(60))
  lines.push('')
  
  // Overall status
  if (report.healthy) {
    lines.push('✅ All checks passed!')
  } else {
    lines.push('❌ Issues detected')
  }
  lines.push('')
  
  // Issues
  if (report.issues.length > 0) {
    lines.push('Issues Found:')
    for (const issue of report.issues) {
      const icon = issue.severity === 'critical' ? '🔴' : 
                   issue.severity === 'warning' ? '🟡' : '🔵'
      lines.push(`  ${icon} [${issue.code}] ${issue.message}`)
      if (issue.details) {
        lines.push(`     ${issue.details}`)
      }
    }
    lines.push('')
  }
  
  // Fixes applied
  if (report.fixes.length > 0) {
    lines.push('Fixes Applied:')
    for (const fix of report.fixes) {
      const icon = fix.applied ? '✅' : '❌'
      lines.push(`  ${icon} [${fix.issueCode}] ${fix.message}`)
      if (fix.error) {
        lines.push(`     Error: ${fix.error}`)
      }
    }
    lines.push('')
  }
  
  // Recommendations
  if (report.recommendations.length > 0) {
    lines.push('Recommendations:')
    for (const rec of report.recommendations) {
      lines.push(`  💡 ${rec}`)
    }
  }
  
  return lines.join('\n')
}
