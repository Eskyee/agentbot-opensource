# Skills, Memory & Files Not Deploying to OpenClaw - FIXED

## Problem
Users reported that **skills were not working in OpenClaw** even though they appeared as "installed" in the UI. The root cause was that skills (and memories, files) were only stored in the database but **never sent to the OpenClaw gateway**.

## Root Cause
When agents were provisioned or skills were installed:
1. Data was saved to PostgreSQL (Agent, InstalledSkill, AgentMemory, AgentFile tables)
2. **BUT** the data was never sent to the OpenClaw gateway
3. The gateway had no knowledge of installed skills, memories, or files
4. Agents ran with empty skill sets

## Solution

### 1. Created Agent Deployment Library (`app/lib/agent-deploy.ts`)
New comprehensive deployment utility that sends ALL agent data to the gateway:

```typescript
// Deploys: skills, memories, files, config
export async function deployAgentToGateway(payload: AgentDeployPayload) {
  // POST /api/agents/deploy
  // Sends complete agent state to OpenClaw
}

// Fetches all agent data with relations
export async function fetchAgentDataForDeployment(agentId: string) {
  // Includes: skills (with code), memories (key-value), files (metadata)
}

// Sync individual skill to agent
export async function deploySkillToAgent(agentId, skillId)

// Remove skill from agent  
export async function removeSkillFromAgent(agentId, skillId)
```

### 2. Updated Agent Provisioning (`app/api/agents/provision/route.ts`)
**Before:** Only sent basic config
```typescript
{ type: 'provision_agent', agentId, name, config: {...} }
```

**After:** Sends complete agent state
```typescript
{
  type: 'deploy_agent',
  agentId,
  userId,
  name,
  model,
  config: {...},
  skills: [...],      // ← NOW INCLUDED
  memories: [...],    // ← NOW INCLUDED
  files: [...]        // ← NOW INCLUDED
}
```

### 3. Updated Skill Installation (`app/api/skills/route.ts`)
**Before:** Only saved to database
```typescript
await prisma.installedSkill.create({...})
return { success: true }
```

**After:** Saves to DB **AND** deploys to gateway
```typescript
await prisma.installedSkill.create({...})
await deploySkillToAgent(agentId, skillId)  // ← NEW
return { success: true }
```

### 4. Skill Uninstall Sync
When skills are uninstalled, they're now also removed from the gateway:
```typescript
await removeSkillFromAgent(agentId, skillId)  // ← NEW
```

### 5. Manual Sync API (`app/api/agents/[id]/sync/route.ts`)
New endpoint for manual resync:
```bash
POST /api/agents/{agentId}/sync
```

Use this to:
- Retry failed deployments
- Sync after gateway outages
- Force refresh agent state

## What Gets Deployed Now

### Skills (InstalledSkill + Skill)
- Skill ID, name, description, category
- **Full code** (the actual skill implementation)
- Author, MCP config, MCP enabled status

### Memories (AgentMemory)
- Key-value pairs
- Creation timestamps
- Used for agent context/recall

### Files (AgentFile)
- File metadata (name, size, mime type)
- Storage path/URL
- Upload timestamps

### Configuration
- Agent name, model, plan
- Telegram/Discord tokens
- AI provider settings
- Owner IDs

## Gateway API Endpoints Expected

The OpenClaw gateway should implement:

```
POST /api/agents/deploy          # Full agent deployment
POST /api/agents/{id}/skills     # Install skill on agent
DELETE /api/agents/{id}/skills/{skillId}  # Remove skill
```

Request format for `/api/agents/deploy`:
```json
{
  "type": "deploy_agent",
  "agentId": "...",
  "userId": "...",
  "name": "My Agent",
  "model": "claude-opus-4-6",
  "config": {...},
  "skills": [
    {
      "id": "skill-123",
      "name": "DJ Streaming",
      "code": "...",
      "mcpEnabled": true,
      "mcpConfig": {...}
    }
  ],
  "memories": [
    {"key": "preference", "value": "house music"}
  ],
  "files": [
    {"filename": "set.mp3", "size": 1024000, "url": "..."}
  ]
}
```

## Deployment Response

Agents now return deployment details:
```json
{
  "success": true,
  "agent": {
    "id": "...",
    "name": "My Agent",
    "status": "running",
    "deployed": {
      "skills": 5,
      "memories": 12,
      "files": 3
    }
  }
}
```

## Files Changed

### New Files
- `app/lib/agent-deploy.ts` - Core deployment utilities
- `app/lib/skill-deploy.ts` - Skill-specific deployment (merged into agent-deploy)
- `app/api/agents/[id]/sync/route.ts` - Manual sync endpoint

### Modified Files
- `app/api/agents/provision/route.ts` - Full deployment with skills/memories/files
- `app/api/skills/route.ts` - Gateway sync on install/uninstall

## Testing

### Test Skill Deployment
```bash
# 1. Create an agent
curl -X POST /api/agents/provision \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Agent", "model": "claude-opus-4-6"}'

# 2. Install a skill
curl -X POST /api/skills \
  -H "Content-Type: application/json" \
  -d '{"skillId": "...", "agentId": "..."}'

# 3. Sync agent (manual retry)
curl -X POST /api/agents/{agentId}/sync
```

### Verify Gateway Received Data
Check OpenClaw gateway logs for:
```
[Gateway] Received agent deployment: agent-xxx
[Gateway] Deployed 5 skills, 12 memories, 3 files
```

## Error Handling

- **Gateway down:** Agent is still created in DB, marked with `pending_gateway_sync` status
- **Partial failure:** Each skill deploys independently, failures are logged but don't block others
- **Retry:** Use `/api/agents/{id}/sync` to retry failed deployments

## Next Steps

1. Ensure OpenClaw gateway implements `/api/agents/deploy` endpoint
2. Test with real skill installation
3. Monitor gateway logs for deployment confirmations
4. Add UI indicator showing "Syncing to gateway..." state

## Commit
Build passing with full agent deployment including skills, memories, and files! 🚀
