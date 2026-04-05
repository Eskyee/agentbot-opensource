---
name: background-agents
description: >
  Use this skill when you need to run multiple tasks in parallel using different agents.
  Background agents execute concurrently like a real dev team, keeping context lean
  and results ready when needed.
  
  Key triggers:
  - "do these tasks in parallel"
  - Multiple independent subtasks
  - Fan-out operations
  - Map-reduce patterns
  - Racing multiple approaches
---

# Background Agents — Parallel Execution

Run multiple agents in parallel like a real dev team. Each agent gets focused context, results are aggregated when ready.

## Why Background Agents?

**Sequential execution:**
- Slow for independent tasks
- Context grows with each step
- One failure blocks everything

**Parallel execution:**
- Independent tasks run simultaneously
- Context stays lean per agent
- Partial failures don't block others
- Like having multiple developers

## Basic Usage

### Execute Tasks in Parallel

```typescript
import { backgroundAgents } from '@/app/lib/background-agents'

const results = await backgroundAgents.execute([
  { task: 'Analyze API endpoints', agent: 'researcher' },
  { task: 'Design database schema', agent: 'planner' },
  { task: 'Create React components', agent: 'visual' }
])

// All tasks completed
results.forEach(r => {
  console.log(`${r.agent}: ${r.success ? '✓' : '✗'} ${r.latencyMs}ms`)
})
```

### With Options

```typescript
const results = await backgroundAgents.execute(
  [
    { task: 'Task 1', agent: 'implementer' },
    { task: 'Task 2', agent: 'implementer' },
    { task: 'Task 3', agent: 'implementer' }
  ],
  {
    maxConcurrency: 2,      // Only 2 at a time
    timeoutMs: 60000,       // 1 minute timeout
    continueOnError: true,  // Don't stop on failure
    onProgress: (done, total) => {
      console.log(`Progress: ${done}/${total}`)
    }
  }
)
```

## Execution Patterns

### Map-Reduce

```typescript
const files = ['auth.ts', 'user.ts', 'post.ts']

const results = await backgroundAgents.mapReduce(
  files,
  // Map: Generate types for each file
  (file) => ({
    task: `Generate TypeScript types for ${file}`,
    agent: 'implementer'
  }),
  // Reduce: Combine results
  (results) => {
    return results
      .filter(r => r.success)
      .map(r => r.output)
      .join('\n')
  }
)
```

### Fan-Out with Aggregation

```typescript
// Try multiple approaches, pick best
const variations = [
  'approach A: use callbacks',
  'approach B: use async/await',
  'approach C: use generators'
]

const results = await backgroundAgents.fanOut(
  'Implement data processing',
  variations,
  'implementer'
)

// Pick the best result
const best = results.reduce((prev, current) =>
  prev.latencyMs < current.latencyMs ? prev : current
)
```

### Pipeline Execution

```typescript
// Sequential stages with handoff
const results = await backgroundAgents.pipeline(
  [
    {
      name: 'analyze',
      agent: 'researcher',
      transform: (input) => `Analyze: ${input}`
    },
    {
      name: 'design',
      agent: 'planner',
      transform: (input) => `Design based on: ${input}`
    },
    {
      name: 'implement',
      agent: 'implementer',
      transform: (input) => `Implement: ${input}`
    }
  ],
  'Create authentication system'
)
```

### Race Agents

```typescript
import { raceAgents } from '@/app/lib/background-agents'

// Race multiple agents, return first success
const result = await raceAgents(
  'Find the bug in this code',
  ['debugger', 'researcher', 'orchestrator'],
  30000 // 30 second timeout
)

if (result.success) {
  console.log(`${result.agent} found it first!`)
}
```

## Complex Task Decomposition

```typescript
// Break down complex task into parallel subtasks
const results = await backgroundAgents.executeComplex(
  'Build new dashboard',
  [
    { agent: 'visual', priority: 'high' },
    { agent: 'implementer', priority: 'high' },
    { agent: 'reviewer', priority: 'medium' }
  ]
)
```

## Available Agents

| Agent | Best For | Model |
|-------|----------|-------|
| orchestrator | Coordination | Kimi K2.5 |
| researcher | Deep research | GPT-5.4 |
| implementer | Writing code | Kimi K2.5 |
| debugger | Bug fixes | GPT-5.4 |
| planner | Architecture | Claude Opus 4 |
| librarian | Code search | Kimi K2.5 |
| visual | UI/UX | Claude Opus 4 |
| reviewer | Code review | Claude Opus 4 |

## Task Structure

```typescript
interface BackgroundTask {
  id: string        // Auto-generated
  task: string      // What to do
  agent: AgentRole  // Which agent
  priority?: 'low' | 'medium' | 'high' | 'critical'
  context?: Record<string, unknown>  // Extra context
  timeoutMs?: number
}
```

## Result Structure

```typescript
interface BackgroundResult {
  taskId: string
  success: boolean
  agent: AgentRole
  output: string
  error?: string
  startedAt: Date
  completedAt: Date
  latencyMs: number
}
```

## Best Practices

### 1. Match Agent to Task

```typescript
// Good: Right agent for the job
[
  { task: 'Design UI mockups', agent: 'visual' },
  { task: 'Optimize database queries', agent: 'debugger' }
]

// Bad: Wrong agent
[
  { task: 'Design UI mockups', agent: 'debugger' },
  { task: 'Optimize database queries', agent: 'visual' }
]
```

### 2. Handle Failures Gracefully

```typescript
const results = await backgroundAgents.execute(tasks, {
  continueOnError: true  // Don't let one failure stop others
})

// Check individual results
results.forEach((result, idx) => {
  if (!result.success) {
    console.error(`Task ${idx} failed: ${result.error}`)
    // Retry or use fallback
  }
})
```

### 3. Set Appropriate Timeouts

```typescript
// Quick tasks: 30 seconds
{ task: 'Fix typo', agent: 'implementer', timeoutMs: 30000 }

// Complex tasks: 5 minutes
{ task: 'Refactor module', agent: 'implementer', timeoutMs: 300000 }

// Research tasks: 10 minutes
{ task: 'Analyze codebase', agent: 'researcher', timeoutMs: 600000 }
```

### 4. Use Progress Callbacks

```typescript
await backgroundAgents.execute(tasks, {
  onProgress: (completed, total) => {
    const percent = Math.round((completed / total) * 100)
    console.log(`Progress: ${percent}%`)
  }
})
```

### 5. Limit Concurrency for Rate Limits

```typescript
// If API has rate limits, limit concurrency
await backgroundAgents.execute(tasks, {
  maxConcurrency: 2  // Only 2 concurrent API calls
})
```

## Common Patterns

### Parallel File Processing

```typescript
const files = await getFilesToProcess()

const results = await backgroundAgents.execute(
  files.map(file => ({
    task: `Process ${file.name}`,
    agent: 'implementer',
    context: { filePath: file.path }
  }))
)
```

### A/B Testing Approaches

```typescript
const approaches = [
  'use Redux for state management',
  'use React Context for state management',
  'use Zustand for state management'
]

const results = await backgroundAgents.fanOut(
  'Implement state management',
  approaches,
  'implementer'
)

// Compare results and pick best
```

### Multi-Stage Review

```typescript
const code = getCodeToReview()

const reviews = await backgroundAgents.execute([
  { task: `Review for bugs: ${code}`, agent: 'debugger' },
  { task: `Review for performance: ${code}`, agent: 'debugger' },
  { task: `Review for style: ${code}`, agent: 'reviewer' }
])

// Aggregate all feedback
const allIssues = reviews.flatMap(r => parseIssues(r.output))
```

## Performance Tips

1. **Group similar tasks** - Same agent can batch process
2. **Set timeouts** - Prevent hanging tasks
3. **Use continueOnError** - Don't let one failure block all
4. **Monitor concurrency** - Match to API rate limits
5. **Cache results** - Save expensive computations

## Debugging

```typescript
// Check execution stats
const stats = backgroundAgents.getStats()
console.log('Active:', stats.activeExecutions)
console.log('Max concurrency:', stats.maxConcurrency)

// Results include timing
results.forEach(r => {
  console.log(`${r.agent}: ${r.latencyMs}ms`)
})
```

## See Also

- `/web/app/lib/background-agents.ts` - Implementation
- `/web/app/lib/orchestration/index.ts` - Agent definitions
- Oh My OpenAgent docs on background agents
