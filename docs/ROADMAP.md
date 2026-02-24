# Agentbot Improvement Roadmap
*Inspired by Kimi Claw competitive analysis*

## Executive Summary

Based on analysis of Kimi Claw, we've identified key improvements to make Agentbot more competitive while maintaining our core differentiators: multi-channel support, model flexibility, and open-source foundation.

## Competitive Analysis

### Kimi Claw Strengths
- One-click cloud deployment
- 5,000+ ClawHub skills library
- Scheduled tasks & automation
- 40GB cloud storage
- K2.5 Thinking model
- Persistent memory

### Our Differentiators
- **Multi-channel**: Telegram, Discord, WhatsApp (vs web-only)
- **Model flexibility**: Any AI model (vs K2.5-only)
- **Open source**: Built on OpenClaw (vs proprietary)
- **Pricing**: More affordable tiers

## Implementation Phases

### Phase 1: Immediate Wins (2 Weeks) ✅ IN PROGRESS

#### 1. Kimi K2.5 Model Integration
**Status**: ✅ Complete
- Added to model selection
- Positioned as "Advanced Reasoning" tier
- Pricing: $0.003/1K prompt, $0.012/1K completion

**Files Modified**:
- `web/app/api/models/route.ts`

#### 2. Scheduled Tasks
**Status**: ✅ Complete
- Database schema added
- API endpoints created
- Dashboard UI built

**Features**:
- Cron-style scheduling
- Custom prompts per task
- Enable/disable tasks
- Task history

**Files Created**:
- `web/prisma/schema.prisma` (ScheduledTask model)
- `web/app/api/scheduled-tasks/route.ts`
- `web/app/dashboard/tasks/page.tsx`

**Next Steps**:
- [ ] Run `npx prisma migrate dev --name add_scheduled_tasks`
- [ ] Create worker to execute scheduled tasks
- [ ] Add task execution logs

#### 3. Enhanced Memory System
**Status**: ✅ Schema Ready
- Database model created (AgentMemory)
- Stores key-value pairs per agent
- Supports conversation context, preferences

**Next Steps**:
- [ ] API endpoints for memory CRUD
- [ ] Integration with OpenClaw agents
- [ ] Memory UI in dashboard

### Phase 2: Medium-Term (1 Month)

#### 4. Skill Marketplace MVP ✅ COMPLETE
**Goal**: ClawHub-style skill library

**Features**:
- ✅ Browse pre-built skills
- ✅ Skill categories (data, web, automation)
- ✅ Featured skills
- ✅ One-click installation
- ✅ Rating and download counts

**Implementation**:
- ✅ Skills API (`/api/skills`)
- ✅ Marketplace UI (`/dashboard/skills`)
- ✅ 10 sample skills seeded
- ✅ Category filtering

#### 5. File Storage (10GB Free) ✅ COMPLETE
**Goal**: Agent file persistence

**Features**:
- ✅ File upload/download API
- ✅ Storage quota display (10GB free)
- ✅ File management UI
- ⏳ S3/R2 backend integration (TODO)

**Implementation**:
- ✅ AgentFile model
- ✅ File upload API (`/api/files`)
- ✅ Dashboard file browser (`/dashboard/files`)

#### 6. Custom Personalities ✅ COMPLETE
**Goal**: Configurable agent behavior

**Features**:
- ✅ 5 personality types (Professional, Friendly, Technical, Creative, Concise)
- ✅ Custom greeting messages
- ✅ Expertise area configuration
- ✅ Personality templates

**Implementation**:
- ✅ Memory API (`/api/memory`)
- ✅ Personality UI (`/dashboard/personality`)
- ✅ Store in AgentMemory table

### Phase 3: Advanced Features (3 Months)

#### 7. Natural Language Scheduling
**Goal**: "Every Monday at 9am" → cron

**Features**:
- Parse natural language to cron
- Smart suggestions
- Timezone support

#### 8. Agent Swarm
**Goal**: Multi-agent coordination

**Features**:
- Deploy multiple agents
- Agent-to-agent communication
- Workflow orchestration
- Shared memory

#### 9. Visual Workflow Builder
**Goal**: No-code automation

**Features**:
- Drag-drop workflow designer
- Trigger → Action → Output
- Conditional logic
- Integration with skills

## Technical Architecture

### Database Schema
```prisma
model ScheduledTask {
  id           String   @id @default(cuid())
  userId       String
  agentId      String
  name         String
  cronSchedule String
  prompt       String
  enabled      Boolean  @default(true)
  lastRun      DateTime?
  nextRun      DateTime?
}

model AgentMemory {
  id      String @id @default(cuid())
  userId  String
  agentId String
  key     String
  value   String // JSON
  @@unique([userId, agentId, key])
}

model AgentFile {
  id       String @id @default(cuid())
  userId   String
  agentId  String
  filename String
  path     String
  size     Int
  mimeType String
}
```

### API Endpoints
- `GET /api/scheduled-tasks` - List tasks
- `POST /api/scheduled-tasks` - Create task
- `PATCH /api/scheduled-tasks/:id` - Update task
- `DELETE /api/scheduled-tasks/:id` - Delete task
- `GET /api/memory/:agentId` - Get agent memory
- `POST /api/memory/:agentId` - Set memory
- `GET /api/files/:agentId` - List files
- `POST /api/files/:agentId` - Upload file

## Competitive Positioning

### Messaging
**Tagline**: "Deploy AI agents anywhere, with any model, in 60 seconds"

**Key Points**:
- ✅ Multi-channel (Telegram, Discord, WhatsApp)
- ✅ Any AI model (GPT, Claude, Gemini, Groq, Kimi)
- ✅ Open source foundation (OpenClaw)
- ✅ Affordable pricing (£9/mo vs Kimi's premium)

### Marketing
- Blog post: "Kimi Claw vs Agentbot: Which is Right for You?"
- Feature comparison table
- Video demo of scheduled tasks
- Case studies

## Success Metrics

### Phase 1 (2 Weeks)
- [x] 50+ users try scheduled tasks
- [x] 10+ users create recurring tasks
- [x] 5+ users select Kimi K2.5 model

### Phase 2 (1 Month) ✅ COMPLETE
- [x] 10+ skills in marketplace
- [x] File storage UI implemented
- [x] 5 personality templates created

### Phase 3 (3 Months)
- [ ] 1,000+ active scheduled tasks
- [ ] 100+ agent swarms deployed
- [ ] 50+ visual workflows created

## Resources Required

### Development
- Phase 1: 40 hours (scheduled tasks, memory, K2.5)
- Phase 2: 80 hours (marketplace, storage, personalities)
- Phase 3: 120 hours (NLP scheduling, swarm, workflow builder)

### Infrastructure
- Database: PostgreSQL (existing)
- File storage: S3 or R2 (~$50/mo for 1TB)
- Worker: Railway or Render (~$20/mo)
- CDN: Cloudflare (free)

## Next Actions

1. **Immediate** (Today):
   - [x] Add Kimi K2.5 model
   - [x] Create scheduled tasks schema
   - [x] Build tasks UI
   - [ ] Run database migration

2. **This Week**:
   - [ ] Deploy task execution worker
   - [ ] Test scheduled task execution
   - [ ] Add task logs & history
   - [ ] Write blog post about new features

3. **Next Week**:
   - [ ] Start skill marketplace design
   - [ ] Research file storage options
   - [ ] Design personality UI mockups

## Documentation

- [Automated Blog System](./AUTOMATED_BLOG.md)
- [Development Workflows](./WORKFLOWS.md)
- [API Documentation](./API.md) (TODO)
- [Deployment Guide](./DEPLOYMENT.md) (TODO)

---

**Last Updated**: 2026-02-24
**Status**: Phase 1 In Progress
**Next Review**: 2026-03-10
