---
name: orchestration
description: >
  Use this skill when working with the multi-agent orchestration system.
  This covers routing tasks to appropriate agents, understanding agent roles,
  and using the IntentGate for task classification.
  
  Key triggers:
  - Working with multiple agents
  - Task routing and delegation
  - Understanding which agent to use
  - Complex multi-step workflows
---

# Multi-Agent Orchestration System

Agentbot now includes a sophisticated multi-agent orchestration system inspired by Oh My OpenAgent's Discipline Agents.

## Agent Roles

Each agent is specialized for a specific type of work:

### Sisyphus (Orchestrator)
- **Role**: Main router and coordinator
- **Model**: Kimi K2.5
- **Use when**: Complex tasks requiring multiple specialists
- **Capabilities**: Planning, delegation, coordination, synthesis

### Hephaestus (Researcher)
- **Role**: Deep research and autonomous execution
- **Model**: GPT-5.4
- **Use when**: Exploring codebases, researching patterns, finding root causes
- **Capabilities**: Codebase analysis, pattern research, root cause analysis

### Builder (Implementer)
- **Role**: Writing production code
- **Model**: Kimi K2.5
- **Use when**: Implementing features, writing new code
- **Capabilities**: Coding, refactoring, TypeScript, testing

### Oracle (Debugger)
- **Role**: Debugging and architecture analysis
- **Model**: GPT-5.4
- **Use when**: Fixing bugs, analyzing errors, tracing issues
- **Capabilities**: Debugging, log analysis, tracing

### Prometheus (Planner)
- **Role**: Strategic planning and requirements gathering
- **Model**: Claude Opus 4
- **Use when**: Starting complex projects, architecture decisions
- **Capabilities**: Planning, requirements gathering, estimation

### Librarian
- **Role**: Code and documentation search
- **Model**: Kimi K2.5
- **Use when**: Finding code, looking up docs, mapping dependencies
- **Capabilities**: Code search, documentation lookup

### Designer (Visual)
- **Role**: UI/UX implementation
- **Model**: Claude Opus 4
- **Use when**: Building components, styling, frontend work
- **Capabilities**: UI design, React, CSS, accessibility

### Reviewer
- **Role**: Code review and quality checks
- **Model**: Claude Opus 4
- **Use when**: Reviewing PRs, auditing code
- **Capabilities**: Code review, security audit, type checking

## Task Categories

Tasks are automatically routed based on category:

| Category | Primary Agent | Use Case |
|----------|---------------|----------|
| visual-engineering | Designer | Frontend, UI/UX |
| business-logic | Builder | Backend, APIs |
| debugging | Oracle | Bug fixes |
| planning | Prometheus | Architecture |
| research | Librarian | Investigation |
| review | Reviewer | Code review |
| quick | Builder | Single-file changes |
| ultrabrain | Sisyphus | Complex coordination |

## Usage

### Basic Task Routing

```typescript
import { routeTask, autoRoute } from '@/app/lib/orchestration'

// Route by category
const result = await routeTask('fix login bug', 'debugging')

// Auto-detect best agent
const result = await autoRoute('make the button blue').routeTask('make the button blue')
```

### Parallel Execution

```typescript
import { executeParallel } from '@/app/lib/orchestration'

const results = await executeParallel([
  { task: 'update API route', category: 'business-logic' },
  { task: 'fix CSS styles', category: 'visual-engineering' },
  { task: 'write tests', category: 'review' }
])
```

### Check if Planning Needed

```typescript
import { shouldUsePlanner } from '@/app/lib/orchestration'

if (shouldUsePlanner('redesign the entire auth system')) {
  // Route to Prometheus for planning phase
}
```

## Intent Analysis (IntentGate)

Before routing, tasks are analyzed for true intent:

```typescript
import { analyzeIntent, formatIntentAnalysis } from '@/app/lib/intent'

const analysis = analyzeIntent('make it faster')
console.log(formatIntentAnalysis(analysis))
// Intent: optimize: improve the performance
// Category: business-logic
// Complexity: simple
// Confidence: 75%
```

### Intent Analysis Output

```typescript
interface IntentAnalysis {
  originalInput: string       // What user said
  trueIntent: string          // What they actually want
  category: TaskCategory      // Routing category
  actionType: string          // create|modify|debug|etc
  complexity: string          // simple|medium|complex
  scope: string               // single-file|multi-file|architecture
  ambiguities: string[]       // Unclear aspects
  confidence: number          // 0-1 confidence score
  clarifyingQuestions: string[] // Questions to ask
  entities: {                  // Extracted info
    files?: string[]
    functions?: string[]
    technologies?: string[]
  }
  needsPlanning: boolean      // Use Prometheus?
  recommendedAgent: string    // Suggested agent role
}
```

## Task Enforcement (Todo Enforcer)

Track tasks and ensure completion:

```typescript
import { todoEnforcer } from '@/app/lib/todo-enforcer'

// Create session
const session = todoEnforcer.createSession('my-task')

// Add tasks
todoEnforcer.addTask(session.id, 'Implement auth API', {
  priority: 'high',
  estimatedMinutes: 30
})

todoEnforcer.addTask(session.id, 'Write tests', {
  priority: 'medium',
  estimatedMinutes: 15,
  dependencies: [firstTaskId]
})

// Start work
todoEnforcer.startTask(session.id, taskId, 'Builder')

// Complete
todoEnforcer.completeTask(session.id, taskId, 'All tests passing')

// Check progress
const progress = todoEnforcer.getProgress(session.id)
console.log(`${progress.percentComplete}% complete`)
```

### Idle Detection

The enforcer automatically detects when agents go idle:

```typescript
if (todoEnforcer.isIdle(sessionId)) {
  const nextTask = todoEnforcer.getNextTask(sessionId)
  console.warn(`Agent idle! Next task waiting: ${nextTask.description}`)
}
```

## Best Practices

### 1. Use Intent Analysis Before Routing

```typescript
const analysis = analyzeIntent(userInput)

if (analysis.confidence < 0.6) {
  // Ask clarifying questions
  return analysis.clarifyingQuestions
}

if (analysis.needsPlanning) {
  // Route to Prometheus for planning
  return await routeToPrometheus(analysis)
}

// Route to appropriate agent
return await routeTask(analysis.trueIntent, analysis.category)
```

### 2. Track Complex Tasks

```typescript
const session = todoEnforcer.createSession()

// Break down complex task
const subtasks = [
  'Analyze current implementation',
  'Design new architecture',
  'Implement changes',
  'Write tests',
  'Update documentation'
]

subtasks.forEach(desc => todoEnforcer.addTask(session.id, desc))

// Process each task
while (true) {
  const task = todoEnforcer.getNextTask(session.id)
  if (!task) break
  
  todoEnforcer.startTask(session.id, task.id)
  // ... do work ...
  todoEnforcer.completeTask(session.id, task.id)
}
```

### 3. Handle Ambiguity

```typescript
const analysis = analyzeIntent('fix it')

if (analysis.ambiguities.length > 0) {
  // Return questions instead of acting
  return {
    type: 'clarification',
    questions: analysis.clarifyingQuestions
  }
}
```

## Integration Example

Complete workflow combining all systems:

```typescript
import { analyzeIntent, needsPlanning } from '@/app/lib/intent'
import { routeTask, autoRoute } from '@/app/lib/orchestration'
import { todoEnforcer } from '@/app/lib/todo-enforcer'

async function handleUserRequest(input: string) {
  // 1. Analyze intent
  const intent = analyzeIntent(input)
  
  // 2. Check if clarification needed
  if (intent.confidence < 0.6) {
    return {
      type: 'clarify',
      questions: intent.clarifyingQuestions
    }
  }
  
  // 3. Check if planning needed
  if (intent.needsPlanning) {
    // Enter Prometheus mode
    return await enterPlanningMode(intent)
  }
  
  // 4. Create task tracking
  const session = todoEnforcer.createSession()
  const task = todoEnforcer.addTask(session.id, intent.trueIntent, {
    priority: intent.complexity === 'complex' ? 'high' : 'medium'
  })
  
  // 5. Route to appropriate agent
  todoEnforcer.startTask(session.id, task.id, intent.recommendedAgent)
  const result = await routeTask(intent.trueIntent, intent.category)
  
  // 6. Complete tracking
  todoEnforcer.completeTask(session.id, task.id)
  
  return result
}
```

## API Endpoints

### Intent Analysis
```
POST /api/intent/analyze
Body: { input: string }
Response: IntentAnalysis
```

### Task Routing
```
POST /api/orchestration/route
Body: { task: string, category?: string }
Response: { agent: string, model: string }
```

### Todo Management
```
POST /api/todos/session          # Create session
POST /api/todos/task             # Add task
PATCH /api/todos/task/:id/start  # Start task
PATCH /api/todos/task/:id/complete # Complete task
GET /api/todos/session/:id       # Get progress
```

## See Also

- `/web/app/lib/orchestration/index.ts` — Agent routing
- `/web/app/lib/intent.ts` — Intent analysis
- `/web/app/lib/todo-enforcer.ts` — Task tracking
