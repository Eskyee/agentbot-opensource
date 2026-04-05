---
name: mcp
description: >
  Use this skill when working with MCP (Model Context Protocol) servers embedded in skills.
  MCP allows skills to bring their own tools, resources, and prompts that spin up on-demand.
  
  Key triggers:
  - Working with skill-specific tools
  - Activating MCP for a skill
  - Calling MCP tools
  - Managing MCP lifecycle
---

# Skill-Embedded MCPs

MCP (Model Context Protocol) servers can be embedded in skills to provide specialized tools and capabilities. Unlike global MCPs that are always loaded, skill-embedded MCPs spin up on-demand and clean up when done, keeping the context window clean.

## Why Skill-Embedded MCPs?

**Traditional MCPs:**
- Always loaded in context
- Consumes tokens even when not used
- One-size-fits-all approach

**Skill-Embedded MCPs:**
- Spin up only when skill is used
- Scoped to specific tasks
- Clean up automatically when idle
- Skills bring exactly what they need

## Creating an MCP-Enabled Skill

```typescript
// When creating a skill, add MCP configuration
const mcpConfig = {
  enabled: true,
  name: 'venue-finder',
  version: '1.0.0',
  tools: [
    {
      name: 'search_venues',
      description: 'Search for music venues by city',
      parameters: {
        city: { type: 'string', required: true },
        capacity: { type: 'number' },
        genre: { type: 'string' }
      }
    },
    {
      name: 'get_venue_details',
      description: 'Get detailed info about a venue',
      parameters: {
        venueId: { type: 'string', required: true }
      }
    }
  ]
}

// Store in database
await prisma.skill.update({
  where: { id: skillId },
  data: {
    mcpConfig,
    mcpEnabled: true
  }
})
```

## Using MCP Tools

### Activate MCP

```typescript
import { mcpManager } from '@/app/lib/mcp'

// Activate MCP for a skill
const mcp = await mcpManager.activate('venue-finder')

// MCP is now ready to use
console.log(mcp.config.tools) // List available tools
```

### Call Tools

```typescript
// Call a tool
const result = await mcpManager.callTool(
  'venue-finder',
  'search_venues',
  {
    city: 'London',
    capacity: 500,
    genre: 'techno'
  }
)

if (result.success) {
  console.log(result.data)
} else {
  console.error(result.error)
}
```

### Deactivate When Done

```typescript
// Clean up MCP when finished
await mcpManager.deactivate('venue-finder')
```

## Built-in MCPs

Agentbot includes several built-in MCPs:

### Web Search
```typescript
import { BUILTIN_MCPS } from '@/app/lib/mcp'

const websearchMcp = BUILTIN_MCPS.websearch
// Tools: search, fetch_page
```

### Context7 (Documentation)
```typescript
const context7Mcp = BUILTIN_MCPS.context7
// Tools: get_docs
```

### Grep.app (Code Search)
```typescript
const grepMcp = BUILTIN_MCPS.grep_app
// Tools: search_code
```

## API Endpoints

### Activate MCP
```bash
POST /api/mcp/:skillId/activate
Response: { success: true, mcp: { name, version, tools } }
```

### Call Tool
```bash
POST /api/mcp/:skillId/call/:toolName
Body: { parameters: object }
Response: { success: true, data, latencyMs }
```

### Deactivate MCP
```bash
DELETE /api/mcp/:skillId/deactivate
Response: { success: true }
```

## MCP Lifecycle

1. **Activation** - MCP spins up when first used
2. **Usage** - Tools can be called multiple times
3. **Idle Detection** - Automatically deactivated after 5 minutes of inactivity
4. **Capacity Management** - Oldest MCP evicted when limit (10) reached

## Best Practices

### 1. Design Focused Tools

```typescript
// Good: Specific, focused tool
{
  name: 'search_venues_by_capacity',
  description: 'Find venues matching specific capacity requirements',
  parameters: {
    minCapacity: { type: 'number' },
    maxCapacity: { type: 'number' },
    city: { type: 'string', required: true }
  }
}

// Bad: Too broad
{
  name: 'search',
  description: 'Search for stuff',
  parameters: { query: { type: 'string' } }
}
```

### 2. Clear Parameter Descriptions

```typescript
{
  name: 'book_venue',
  parameters: {
    venueId: {
      type: 'string',
      required: true,
      description: 'The unique venue identifier from search_venues'
    },
    date: {
      type: 'string',
      required: true,
      description: 'ISO 8601 date (YYYY-MM-DD)'
    }
  }
}
```

### 3. Handle Errors Gracefully

```typescript
const result = await mcpManager.callTool('my-skill', 'my-tool', params)

if (!result.success) {
  // Handle error - maybe retry or use fallback
  console.error(`Tool failed: ${result.error}`)
}
```

### 4. Clean Up After Use

```typescript
try {
  await mcpManager.activate('my-skill')
  // ... use tools ...
} finally {
  await mcpManager.deactivate('my-skill')
}
```

## Testing MCPs

```typescript
// Test your MCP configuration
import { mcpManager, createSkillMcp } from '@/app/lib/mcp'

// Create test MCP
const testMcp = createSkillMcp('test-skill', [
  {
    name: 'echo',
    description: 'Echo back input',
    parameters: { message: { type: 'string' } }
  }
])

// Store and test
await prisma.skill.create({
  data: {
    name: 'test-skill',
    description: 'Test skill',
    category: 'test',
    code: '',
    author: 'test',
    mcpConfig: testMcp,
    mcpEnabled: true
  }
})

// Activate and use
const mcp = await mcpManager.activate('test-skill')
console.log(mcp.config.tools)
```

## Debugging MCPs

```typescript
// Check active MCPs
const active = mcpManager.getActiveMcps()
console.log('Active:', active.map(m => m.config.name))

// Get stats
const stats = mcpManager.getStats()
console.log('Stats:', stats)

// Check if specific MCP is active
if (mcpManager.isActive('my-skill')) {
  console.log('MCP is active')
}
```

## See Also

- `/web/app/lib/mcp/index.ts` - MCP implementation
- `/web/app/api/mcp/[skillId]/route.ts` - API routes
- Oh My OpenAgent docs on skill-embedded MCPs
