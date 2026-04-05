#!/usr/bin/env node
/**
 * Intent Analysis Demo
 * 
 * Shows how the IntentGate system analyzes user requests
 */

// Copy of analyzeIntent function for demo
function analyzeIntent(input) {
  const inputLower = input.toLowerCase()
  
  // Determine category
  let category = 'business-logic'
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
  let actionType = 'unknown'
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
  let complexity = 'simple'
  const words = input.split(/\s+/).length
  if (words > 50 || /\b(architecture|redesign|migration|integrate|complex)\b/.test(inputLower)) {
    complexity = 'complex'
  } else if (words > 20 || /\b(refactor|multiple|several)\b/.test(inputLower)) {
    complexity = 'medium'
  }

  // Determine scope
  let scope = 'unknown'
  if (/\b(all|everything|entire|whole|project)\b/.test(inputLower)) {
    scope = 'architecture'
  } else if (/\b(multiple|several|files|components)\b/.test(inputLower)) {
    scope = 'multi-file'
  } else if (/\b(file|function|component|line)\b/.test(inputLower)) {
    scope = 'single-file'
  }

  // Extract ambiguities
  const ambiguities = []
  if (/\b(it|this|that|thing)\b/.test(inputLower)) {
    ambiguities.push("Vague reference - unclear what is being referred to")
  }
  if (words < 5) {
    ambiguities.push("Very short request - may be missing details")
  }
  if (!/[\w\-\/]+\.(ts|tsx|js|jsx)/.test(input) && /(?:fix|update|change|in)/.test(inputLower)) {
    ambiguities.push("No specific file path mentioned")
  }

  // Generate questions
  const clarifyingQuestions = []
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
  const agentMap = {
    'visual-engineering': 'Designer',
    'business-logic': 'Builder',
    'debugging': 'Oracle',
    'planning': 'Prometheus',
    'research': 'Librarian',
    'review': 'Reviewer',
    'quick': 'Builder',
    'ultrabrain': 'Sisyphus'
  }

  // Extract entities
  const entities = {}
  const fileMatches = input.match(/[\w\-\/]+\.(ts|tsx|js|jsx|json|md)/g)
  if (fileMatches) entities.files = [...new Set(fileMatches)]
  
  const techs = ['react', 'next', 'typescript', 'prisma', 'stripe']
  const foundTechs = techs.filter(t => input.toLowerCase().includes(t))
  if (foundTechs.length) entities.technologies = foundTechs

  return {
    originalInput: input,
    trueIntent: `${actionType}: ${input}`,
    category,
    actionType,
    complexity,
    scope,
    ambiguities,
    confidence,
    clarifyingQuestions,
    entities,
    needsPlanning: complexity === 'complex' || category === 'planning' || confidence < 0.6,
    recommendedAgent: agentMap[category] || 'Sisyphus'
  }
}

// Test cases
const testCases = [
  {
    input: 'fix it',
    context: 'Vague request - classic IntentGate example'
  },
  {
    input: 'make the button blue',
    context: 'UI task - should route to Designer agent'
  },
  {
    input: 'create a new API endpoint for user authentication in web/app/api/auth/route.ts',
    context: 'Specific request with file path'
  },
  {
    input: 'refactor the entire database layer to use Prisma instead of raw SQL with proper relations and migrations',
    context: 'Complex architecture task - needs planning phase'
  },
  {
    input: 'debug why the login is failing when users enter correct credentials',
    context: 'Debugging task - route to Oracle'
  },
  {
    input: 'explain how the billing system works with Stripe webhooks',
    context: 'Research/information request'
  },
  {
    input: 'optimize the dashboard loading speed',
    context: 'Performance optimization'
  },
  {
    input: 'review the code in web/app/api/users/route.ts',
    context: 'Code review request'
  },
  {
    input: 'plan a new feature for agent marketplace with search, filtering, and payment integration',
    context: 'Complex planning task'
  },
  {
    input: 'update',
    context: 'Very short/ambiguous request'
  }
]

console.log('\n🧠 INTENT ANALYSIS DEMO\n')
console.log('='.repeat(70))
console.log('Analyzing user requests to determine true intent...\n')

testCases.forEach((testCase, idx) => {
  const { input, context } = testCase
  const analysis = analyzeIntent(input)
  
  console.log(`\n${idx + 1}. 💬 USER INPUT: "${input}"`)
  console.log('   '.padEnd(70, '─'))
  console.log(`   📝 Context: ${context}`)
  console.log('')
  
  console.log(`   🎯 True Intent: ${analysis.trueIntent}`)
  console.log(`   📂 Category: ${analysis.category}`)
  console.log(`   ⚡ Action: ${analysis.actionType}`)
  console.log(`   📊 Complexity: ${analysis.complexity}`)
  console.log(`   🔭 Scope: ${analysis.scope}`)
  
  // Confidence bar
  const confidencePercent = Math.round(analysis.confidence * 100)
  const barLength = 20
  const filledLength = Math.round((analysis.confidence * barLength))
  const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength)
  console.log(`   🎚️  Confidence: [${bar}] ${confidencePercent}%`)
  
  console.log(`   🤖 Recommended Agent: ${analysis.recommendedAgent}`)
  
  if (analysis.needsPlanning) {
    console.log(`   ⚠️  NEEDS PLANNING: Yes - Will route to Prometheus`)
  }
  
  if (analysis.ambiguities.length > 0) {
    console.log(`\n   ⚠️  AMBIGUITIES DETECTED:`)
    analysis.ambiguities.forEach(a => console.log(`      • ${a}`))
  }
  
  if (analysis.clarifyingQuestions.length > 0) {
    console.log(`\n   ❓ CLARIFYING QUESTIONS:`)
    analysis.clarifyingQuestions.forEach(q => console.log(`      → ${q}`))
  }
  
  if (Object.keys(analysis.entities).length > 0) {
    console.log(`\n   📎 EXTRACTED ENTITIES:`)
    if (analysis.entities.files) {
      console.log(`      Files: ${analysis.entities.files.join(', ')}`)
    }
    if (analysis.entities.technologies) {
      console.log(`      Technologies: ${analysis.entities.technologies.join(', ')}`)
    }
  }
  
  // Routing decision
  console.log(`\n   🚀 ROUTING DECISION:`)
  if (analysis.confidence < 0.6) {
    console.log(`      • LOW CONFIDENCE - Ask clarifying questions before proceeding`)
  } else if (analysis.needsPlanning) {
    console.log(`      • COMPLEX TASK - Route to Prometheus for planning phase`)
    console.log(`      • Then delegate to ${analysis.recommendedAgent} for implementation`)
  } else {
    console.log(`      • CLEAR INTENT - Route directly to ${analysis.recommendedAgent}`)
    console.log(`      • Category: ${analysis.category}`)
  }
})

console.log('\n' + '='.repeat(70))
console.log('✨ Demo Complete!\n')

// Summary
console.log('📊 SUMMARY:')
console.log('   ──────────────────────────────────────────────────────────────────')
console.log('   IntentGate prevents misinterpretations by:')
console.log('   • Detecting vague references ("it", "this", "thing")')
console.log('   • Identifying missing context (file paths, specifics)')
console.log('   • Estimating complexity (simple/medium/complex)')
console.log('   • Routing to the right specialist agent')
console.log('   • Triggering planning phase for complex tasks')
console.log('   • Generating clarifying questions when needed')
console.log('')
console.log('   This saves time by catching ambiguity BEFORE work begins!')
console.log('')
