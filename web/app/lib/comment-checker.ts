/**
 * comment-checker.ts — Comment Quality Enforcement
 *
 * Prevents "AI slop" in comments. Ensures code reads like a senior wrote it.
 * Inspired by Oh My OpenAgent's Comment Checker.
 *
 * Usage:
 *   import { commentChecker } from '@/app/lib/comment-checker'
 *
 *   const issues = commentChecker.checkFile('/path/to/file.ts')
 *   const fixed = commentChecker.fixComments(sourceCode)
 */

export interface CommentIssue {
  line: number
  type: 'slop' | 'redundant' | 'vague' | 'outdated' | 'missing'
  severity: 'low' | 'medium' | 'high'
  message: string
  original: string
  suggestion?: string
}

export interface CommentCheckResult {
  filePath: string
  issues: CommentIssue[]
  score: number // 0-100
  summary: string
}

// Patterns that indicate low-quality comments
const SLOP_PATTERNS = [
  {
    pattern: /\/\/\s*(this is|this function|this method|here we)/i,
    message: 'Redundant comment - code already shows what it does',
    type: 'redundant' as const
  },
  {
    pattern: /\/\/\s*(todo|fixme|hack|xxx)\s*:/i,
    message: 'Unresolved TODO/FIXME should be addressed',
    type: 'slop' as const
  },
  {
    pattern: /\/\*\*\s*\n\s*\*\s+(function|method|class)\s+\w+/i,
    message: 'JSDoc just repeats the function name',
    type: 'redundant' as const
  },
  {
    pattern: /\/\/\s*(get|set|create|delete|update|remove)\s+\w+/i,
    message: 'Comment just repeats the function name',
    type: 'redundant' as const
  },
  {
    pattern: /\/\/\s*(it|this|that)\s+(is|does|will|should)/i,
    message: 'Vague reference - unclear what "it" refers to',
    type: 'vague' as const
  },
  {
    pattern: /\/\/\s*\?\?\?|TODO|FIXME/i,
    message: 'Placeholder comment - needs real documentation',
    type: 'slop' as const
  },
  {
    pattern: /\/\/\s*(note|notice|important):?\s*$/i,
    message: 'Empty note marker - add actual content',
    type: 'slop' as const
  },
  {
    pattern: /\/\/\s*handle\s+(the|this)/i,
    message: 'Vague "handle" comment - be specific about what it does',
    type: 'vague' as const
  }
]

// Good comment patterns to encourage
const GOOD_COMMENT_PATTERNS = [
  /\/\/\s*(why|because|since|as)/i, // Explains why
  /\/\/\s*(warning|caution|note|important):/i, // Warnings
  /\/\*\*\s*\n\s*\*\s+[^@\n]+\n/i, // Descriptive JSDoc
  /\/\/\s*see:|@see/i, // References
  /\/\/\s*eg:|example:/i // Examples
]

/**
 * Comment Quality Checker
 */
export class CommentChecker {
  /**
   * Check a file for comment quality issues
   */
  checkFile(filePath: string, sourceCode: string): CommentCheckResult {
    const lines = sourceCode.split('\n')
    const issues: CommentIssue[] = []

    lines.forEach((line, index) => {
      const lineNumber = index + 1

      // Check for slop patterns
      for (const slop of SLOP_PATTERNS) {
        if (slop.pattern.test(line)) {
          issues.push({
            line: lineNumber,
            type: slop.type,
            severity: slop.type === 'slop' ? 'high' : 'medium',
            message: slop.message,
            original: line.trim(),
            suggestion: this.generateSuggestion(line, slop.type)
          })
        }
      }

      // Check for outdated comments (simple heuristic)
      if (this.looksLikeOutdatedComment(line, lines, index)) {
        issues.push({
          line: lineNumber,
          type: 'outdated',
          severity: 'medium',
          message: 'Comment may be outdated - verify it matches the code',
          original: line.trim()
        })
      }
    })

    // Check for missing JSDoc on exported functions
    const missingDocs = this.findMissingDocumentation(sourceCode)
    issues.push(...missingDocs)

    const score = this.calculateScore(lines, issues)

    return {
      filePath,
      issues,
      score,
      summary: this.generateSummary(issues, score)
    }
  }

  /**
   * Fix comments automatically where possible
   */
  fixComments(sourceCode: string): string {
    let fixed = sourceCode

    // Remove redundant comments
    fixed = fixed.replace(/\/\/\s*(this is|this function|this method|here we)\s+\w+/gi, '')

    // Fix vague references
    fixed = fixed.replace(/\/\/\s*it\s+(is|does)/gi, '// This function $1')

    // Clean up empty TODOs
    fixed = fixed.replace(/\/\/\s*TODO\s*$/gi, '// TODO: Add description')

    // Remove trailing whitespace from empty comments
    fixed = fixed.replace(/\/\/\s*$/gm, '')

    return fixed
  }

  /**
   * Generate suggestion for fixing an issue
   */
  private generateSuggestion(line: string, type: string): string | undefined {
    switch (type) {
      case 'redundant':
        return 'Remove this comment - the code is self-explanatory'
      
      case 'vague':
        return 'Replace "it/this" with the actual subject'
      
      case 'slop':
        return 'Write a descriptive comment explaining WHY, not WHAT'
      
      default:
        return undefined
    }
  }

  /**
   * Check if a comment looks outdated
   */
  private looksLikeOutdatedComment(line: string, lines: string[], index: number): boolean {
    // Check if comment mentions a function name that doesn't appear nearby
    const functionMatch = line.match(/\/\/\s*(?:function|method|class)\s+(\w+)/i)
    if (functionMatch) {
      const functionName = functionMatch[1]
      const nearbyLines = lines.slice(Math.max(0, index - 2), Math.min(lines.length, index + 5))
      const nearbyCode = nearbyLines.join('\n')
      
      if (!nearbyCode.includes(`function ${functionName}`) && 
          !nearbyCode.includes(`${functionName}(`)) {
        return true
      }
    }

    return false
  }

  /**
   * Find exported functions/classes missing documentation
   */
  private findMissingDocumentation(sourceCode: string): CommentIssue[] {
    const issues: CommentIssue[] = []
    const lines = sourceCode.split('\n')

    const exportPattern = /^(export\s+(?:async\s+)?(?:function|class|const|let|var)\s+(\w+))/gm
    let match

    while ((match = exportPattern.exec(sourceCode)) !== null) {
      const functionName = match[2]
      const position = match.index
      
      // Find line number
      const lineNumber = sourceCode.substring(0, position).split('\n').length

      // Check if preceded by JSDoc
      const precedingCode = sourceCode.substring(Math.max(0, position - 500), position)
      if (!precedingCode.includes('/**') || !precedingCode.includes('*/')) {
        issues.push({
          line: lineNumber,
          type: 'missing',
          severity: 'low',
          message: `Exported function "${functionName}" is missing JSDoc documentation`,
          original: match[1],
          suggestion: `Add JSDoc comment explaining what ${functionName} does`
        })
      }
    }

    return issues
  }

  /**
   * Calculate comment quality score
   */
  private calculateScore(lines: string[], issues: CommentIssue[]): number {
    const totalComments = lines.filter(l => 
      l.trim().startsWith('//') || l.trim().startsWith('/*')
    ).length

    if (totalComments === 0) return 100 // No comments = no issues

    const highSeverity = issues.filter(i => i.severity === 'high').length
    const mediumSeverity = issues.filter(i => i.severity === 'medium').length
    const lowSeverity = issues.filter(i => i.severity === 'low').length

    const deduction = (highSeverity * 15) + (mediumSeverity * 8) + (lowSeverity * 3)
    
    return Math.max(0, 100 - deduction)
  }

  /**
   * Generate summary of issues
   */
  private generateSummary(issues: CommentIssue[], score: number): string {
    if (issues.length === 0) {
      return 'No comment quality issues found. Great job!'
    }

    const high = issues.filter(i => i.severity === 'high').length
    const medium = issues.filter(i => i.severity === 'medium').length
    const low = issues.filter(i => i.severity === 'low').length

    let summary = `Score: ${score}/100. Found ${issues.length} issues`
    if (high > 0) summary += ` (${high} high priority)`
    if (medium > 0) summary += ` (${medium} medium priority)`
    if (low > 0) summary += ` (${low} low priority)`

    return summary
  }

  /**
   * Check if a comment is high quality
   */
  isGoodComment(comment: string): boolean {
    // Check against slop patterns
    for (const slop of SLOP_PATTERNS) {
      if (slop.pattern.test(comment)) {
        return false
      }
    }

    // Check for good patterns
    for (const good of GOOD_COMMENT_PATTERNS) {
      if (good.test(comment)) {
        return true
      }
    }

    // Neutral - not explicitly good or bad
    return true
  }

  /**
   * Generate improved comment
   */
  improveComment(original: string, code: string): string {
    // If it's just repeating the code, explain the "why"
    if (/\/\/\s*(get|set|create|delete)/i.test(original)) {
      return '// Purpose: ' + this.extractPurpose(code)
    }

    // If it's vague, make it specific
    if (/\/\/\s*handle/i.test(original)) {
      return '// Processes and validates ' + this.extractSubject(code)
    }

    // If it's a TODO, make it actionable
    if (/\/\/\s*TODO/i.test(original)) {
      return '// TODO: Implement error handling for edge cases'
    }

    return original
  }

  /**
   * Extract purpose from code
   */
  private extractPurpose(code: string): string {
    const functionMatch = code.match(/function\s+(\w+)/)
    if (functionMatch) {
      const name = functionMatch[1]
      return name.replace(/([A-Z])/g, ' $1').toLowerCase()
    }
    return 'this operation'
  }

  /**
   * Extract subject from code
   */
  private extractSubject(code: string): string {
    const paramMatch = code.match(/\(([^)]*)\)/)
    if (paramMatch) {
      const params = paramMatch[1].split(',').map(p => p.trim().split(':')[0])
      return params[0] || 'input'
    }
    return 'data'
  }

  /**
   * Batch check multiple files
   */
  checkFiles(files: Array<{ path: string; content: string }>): CommentCheckResult[] {
    return files.map(f => this.checkFile(f.path, f.content))
  }

  /**
   * Get statistics for a codebase
   */
  getStats(results: CommentCheckResult[]): {
    totalFiles: number
    averageScore: number
    totalIssues: number
    byType: Record<string, number>
  } {
    const totalFiles = results.length
    const averageScore = results.reduce((sum, r) => sum + r.score, 0) / totalFiles
    const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0)

    const byType: Record<string, number> = {}
    for (const result of results) {
      for (const issue of result.issues) {
        byType[issue.type] = (byType[issue.type] || 0) + 1
      }
    }

    return {
      totalFiles,
      averageScore: Math.round(averageScore),
      totalIssues,
      byType
    }
  }
}

// Singleton instance
export const commentChecker = new CommentChecker()

/**
 * ESLint-compatible rule for comment checking
 */
export const commentQualityRule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce high-quality comments',
      category: 'Best Practices',
      recommended: true
    },
    fixable: 'code',
    schema: []
  },
  create(context: any) {
    return {
      Program(node: any) {
        const sourceCode = context.getSourceCode().getText()
        const result = commentChecker.checkFile(context.getFilename(), sourceCode)

        for (const issue of result.issues) {
          context.report({
            node,
            message: issue.message,
            loc: { line: issue.line, column: 0 },
            fix: issue.suggestion ? (fixer: any) => {
              // Simple fix - in production would be more sophisticated
              return fixer.replaceTextRange([0, 0], `// ${issue.suggestion}\n`)
            } : undefined
          })
        }
      }
    }
  }
}
