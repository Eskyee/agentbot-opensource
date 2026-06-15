/**
 * intent.ts — Intent Analysis System (IntentGate)
 *
 * Analyzes user intent before acting to prevent misinterpretations.
 */

import { TaskCategory } from '@/app/lib/orchestration'

export interface IntentAnalysis {
  originalInput: string
  trueIntent: string
  category: TaskCategory
  actionType: 'create' | 'modify' | 'delete' | 'query' | 'debug' | 'explain' | 'optimize' | 'refactor' | 'review' | 'plan' | 'unknown'
  complexity: 'simple' | 'medium' | 'complex'
  scope: 'single-file' | 'multi-file' | 'architecture' | 'unknown'
  ambiguities: string[]
  confidence: number
  clarifyingQuestions: string[]
  entities: {
    files?: string[]
    functions?: string[]
    technologies?: string[]
  }
  needsPlanning: boolean
  recommendedAgent: string
}

/**
 * Quick intent analysis without AI call
 */
export function analyzeIntent(input: string): IntentAnalysis {
  const inputLower = input.toLowerCase()
  
  // Determine category
  let category: TaskCategory = 'business-logic'
  if (/\b(ui|css|style|design|component|page|layout|visual|frontend)\b/.test(inputLower)) {
    category = 'visual-engineering'
  } else if (/\b(debug|fix|error|bug|crash|broken|not working)\b/.test(inputLower)) {
    category = 'debugging'
  } else if (/\b(plan|design|architecture|strategy)\b/.test(inputLower)) {
    category = 'planning'
  } else if (/\b(find|search|where|explain|how|what)\b/.test(inputLower)) {
    category = 'research'
  } else if (/\b(review|audit|check|look at)\b/.test(inputLower)) {
    category = 'review'
  }

  // Determine action type
  let actionType: IntentAnalysis['actionType'] = 'unknown'
  if (/\b(create|make|add|build|new)\b/.test(inputLower)) actionType = 'create'
  else if (/\b(update|change|modify|edit)\b/.test(inputLower)) actionType = 'modify'
  else if (/\b(delete|remove)\b/.test(inputLower)) actionType = 'delete'
  else if (/\b(debug|fix|solve)\b/.test(inputLower)) actionType = 'debug'
  else if (/\b(explain|describe|what|how)\b/.test(inputLower)) actionType = 'explain'
  else if (/\b(optimize|improve|speed|faster|performance)\b/.test(inputLower)) actionType = 'optimize'
  else if (/\b(refactor|rewrite|cleanup|clean up)\b/.test(inputLower)) actionType = 'refactor'
  else if (/\b(review|audit|check)\b/.test(inputLower)) actionType = 'review'
  else if (/\b(plan|design|strategy)\b/.test(inputLower)) actionType = 'plan'

  // Determine complexity
  let complexity: IntentAnalysis['complexity'] = 'simple'
  const words = input.split(/\s+/).length
  if (words > 50 || /\b(architecture|redesign|migration|integrate|complex)\b/.test(inputLower)) {
    complexity = 'complex'
  } else if (words > 20 || /\b(refactor|multiple|several)\b/.test(inputLower)) {
    complexity = 'medium'
  }

  // Determine scope
  let scope: IntentAnalysis['scope'] = 'unknown'
  if (/\b(all|everything|entire|whole|project)\b/.test(inputLower)) {
    scope = 'architecture'
  } else if (/\b(multiple|several|files|components)\b/.test(inputLower)) {
    scope = 'multi-file'
  } else if (/\b(file|function|component|line)\b/.test(inputLower)) {
    scope = 'single-file'
  }

  // Extract ambiguities
  const ambiguities: string[] = []
  if (/\b(it|this|that|thing)\b/.test(inputLower)) {
    ambiguities.push("Vague reference - unclear what is being referred to")
  }
  if (words < 5) {
    ambiguities.push("Very short request - may be missing details")
  }

  // Generate questions
  const clarifyingQuestions: string[] = []
  if (ambiguities.length > 0) {
    clarifyingQuestions.push("Could you be more specific about what needs to be changed?")
  }
  if (complexity === 'complex') {
    clarifyingQuestions.push("What is the desired outcome?")
  }

  // Calculate confidence
  let confidence = 0.5
  if (category !== 'business-logic') confidence += 0.2
  if (actionType !== 'unknown') confidence += 0.2
  if (scope !== 'unknown') confidence += 0.1
  if (ambiguities.length === 0) confidence += 0.1
  confidence = Math.min(confidence, 0.95)

  // Map category to agent
  const agentMap: Record<TaskCategory, string> = {
    'visual-engineering': 'visual',
    'business-logic': 'implementer',
    'debugging': 'debugger',
    'planning': 'planner',
    'research': 'librarian',
    'review': 'reviewer',
    'quick': 'implementer',
    'ultrabrain': 'orchestrator'
  }

  return {
    originalInput: input,
    trueIntent: inferTrueIntent(input, actionType),
    category,
    actionType,
    complexity,
    scope,
    ambiguities,
    confidence,
    clarifyingQuestions,
    entities: extractEntities(input),
    needsPlanning: complexity === 'complex' || category === 'planning',
    recommendedAgent: agentMap[category] || 'orchestrator'
  }
}

function inferTrueIntent(input: string, actionType: string): string {
  // Clean up common ambiguous phrases
  let intent = input
    .replace(/\bmake it\b/gi, 'improve the')
    .replace(/\bfix it\b/gi, 'debug and fix the issue in')
    .replace(/\bupdate it\b/gi, 'modify the')
  
  return `${actionType}: ${intent}`
}

function extractEntities(input: string): IntentAnalysis['entities'] {
  const entities: IntentAnalysis['entities'] = {}
  
  // Extract file paths
  const fileMatches = input.match(/[\w\-\/]+\.(ts|tsx|js|jsx|json|md)/g)
  if (fileMatches) entities.files = [...new Set(fileMatches)]
  
  // Extract function names
  const funcMatches = input.match(/(?:function|method)\s+(\w+)/gi)
  if (funcMatches) {
    entities.functions = funcMatches.map(m => m.split(/\s+/)[1])
  }
  
  // Extract technologies
  const techs = ['react', 'next', 'typescript', 'prisma', 'stripe']
  const foundTechs = techs.filter(t => input.toLowerCase().includes(t))
  if (foundTechs.length) entities.technologies = foundTechs
  
  return entities
}

/**
 * Check if input should trigger Prometheus planning mode
 */
export function needsPlanning(input: string): boolean {
  const analysis = analyzeIntent(input)
  return analysis.needsPlanning || analysis.confidence < 0.6
}

/**
 * Format intent analysis for display
 */
export function formatIntentAnalysis(analysis: IntentAnalysis): string {
  const lines = [
    `Intent Analysis`,
    `================`,
    ``,
    `True Intent: ${analysis.trueIntent}`,
    `Category: ${analysis.category}`,
    `Action: ${analysis.actionType}`,
    `Complexity: ${analysis.complexity}`,
    `Scope: ${analysis.scope}`,
    `Confidence: ${Math.round(analysis.confidence * 100)}%`,
    `Recommended Agent: ${analysis.recommendedAgent}`,
    `Needs Planning: ${analysis.needsPlanning ? 'Yes' : 'No'}`,
    ``
  ]
  
  if (analysis.ambiguities.length > 0) {
    lines.push('Ambiguities:')
    analysis.ambiguities.forEach(a => lines.push(`  - ${a}`))
    lines.push('')
  }
  
  if (analysis.clarifyingQuestions.length > 0) {
    lines.push('Clarifying Questions:')
    analysis.clarifyingQuestions.forEach(q => lines.push(`  - ${q}`))
    lines.push('')
  }
  
  if (Object.keys(analysis.entities).length > 0) {
    lines.push('Entities Found:')
    if (analysis.entities.files) lines.push(`  Files: ${analysis.entities.files.join(', ')}`)
    if (analysis.entities.functions) lines.push(`  Functions: ${analysis.entities.functions.join(', ')}`)
    if (analysis.entities.technologies) lines.push(`  Technologies: ${analysis.entities.technologies.join(', ')}`)
  }
  
  return lines.join('\n')
}
