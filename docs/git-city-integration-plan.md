# Git City Integration Plan for Agentbot

## Overview
Integrate Eskyee/git-city (3D city + jobs board) into Agentbot platform for dev users.

## Option 1: Linked Experience (Recommended - Low Effort, Fast)

Deploy git-city standalone, link from Agentbot.

### Steps:
1. Fork/clone git-city to `agentbot-git-city`
2. Deploy to Vercel
3. Configure Supabase (existing DB or new project)
4. Add link in Agentbot dashboard: "Visit Git City"

### Pros:
- Fastest to ship
- No database changes
- Works immediately

### Cons:
- Separate auth (GitHub OAuth via git-city)
- Not deeply integrated

---

## Option 2: Jobs Board Integration (Medium Effort)

Add job board feature directly to Agentbot using git-city schema.

### Steps:
1. Extract job migrations (054-078) from git-city
2. Add to Agentbot's existing Neon database
3. Create API routes in Agentbot:
   - `GET /api/jobs` - list jobs
   - `GET /api/jobs/[id]` - job details
   - `POST /api/jobs` - create job (companies)
   - `POST /api/jobs/[id]/apply` - apply
4. Build UI pages:
   - `/jobs` - job board
   - `/jobs/[slug]` - job details
   - `/dashboard/companies` - company management
   - `/dashboard/career` - career profile

### Schema to Add (to Agentbot Prisma):

```prisma
// Job Companies
model JobCompany {
  id            String   @id @default(cuid())
  advertiserId  String
  name          String
  slug          String   @unique
  logoUrl       String?
  website       String
  description   String?
  githubOrg     String?
  hiredCount    Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  jobs          JobListing[]
}

// Job Listings
model JobListing {
  id              String   @id @default(cuid())
  companyId       String
  title           String
  description     String
  salaryMin       Int
  salaryMax       Int
  salaryCurrency  String   @default("USD")
  roleType        String   // frontend, backend, fullstack, devops, mobile, data, design, other
  techStack       String[]
  seniority       String   // junior, mid, senior, staff, lead
  contractType    String   // clt, pj, contract
  webType         String   // web2, web3, both
  applyUrl        String
  language        String   @default("en")
  status          String   @default("draft") // draft, pending_review, active, paused, filled, expired, rejected
  tier            String   @default("standard") // standard, featured, premium
  viewCount       Int      @default(0)
  applyCount      Int      @default(0)
  publishedAt     DateTime?
  expiresAt       DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  company         JobCompany @relation(fields: [companyId], references: [id])
}

// Career Profile (for devs)
model CareerProfile {
  id              String   @id @default(cuid())
  userId          String   @unique
  skills          String[]
  seniority       String
  yearsExperience Int?
  bio             String
  webType         String   @default("both")
  contractTypes   String[]
  salaryMin       Int?
  salaryMax       Int?
  salaryCurrency  String   @default("USD")
  salaryVisible   Boolean  @default(false)
  languages       String[]
  timezone        String?
  linkPortfolio   String?
  linkLinkedin    String?
  linkWebsite     String?
  openToWork      Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// Job Applications
model JobApplication {
  id          String   @id @default(cuid())
  listingId   String
  userId      String
  hasProfile  Boolean  @default(false)
  createdAt   DateTime @default(now())
  
  @@unique([listingId, userId])
}
```

### API Routes to Create:

```typescript
// GET /api/jobs - list active jobs
// GET /api/jobs/[id] - job details
// POST /api/jobs - create job (company required)
// PUT /api/jobs/[id] - update job
// POST /api/jobs/[id]/apply - apply to job
// GET /api/jobs/companies - list companies
// POST /api/jobs/companies - create company
// GET /api/jobs/career - get career profile
// PUT /api/jobs/career - update career profile
// POST /api/jobs/notify - sign up for alerts
```

---

## Option 3: Full Integration (High Effort)

Run git-city as microservice, share Supabase, embed in Agentbot.

### Architecture:
```
┌─────────────────────────────────────────┐
│           Agentbot (Vercel)             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
│  │  Web UI │  │  API    │  │ 3D City │ │
│  └─────────┘  └─────────┘  │ (iframe)│ │
│                           └─────────┘ │
└─────────────────────────────────────────┘
              ↓ shared
        ┌─────────────┐
        │  Supabase   │
        │ (shared DB) │
        └─────────────┘
```

### Steps:
1. Deploy git-city to Vercel (git-city.agentbot.raveculture.xyz)
2. Configure shared Supabase (add git-city tables to Agentbot's DB)
3. Iframe git-city into Agentbot dashboard
4. Link auth between platforms

---

## Recommended Path

### Phase 1: Quick Win (This Week)
- Deploy git-city standalone
- Add link in Agentbot nav: "Git City"

### Phase 2: Jobs Feature (Next Sprint)
- Add job tables to Agentbot DB
- Build jobs API + UI
- Company management for paid users

### Phase 3: Deep Integration (Later)
- Shared auth
- Iframe 3D city
- Sync achievements/stats

---

## Environment Variables Needed

For git-city standalone:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GITHUB_TOKEN=...
```

For Agentbot + jobs:
- Already has DATABASE_URL (Neon)
- Add job-specific fields to .env if needed

---

## Files to Modify

1. `web/prisma/schema.prisma` - add job models
2. `web/app/api/jobs/route.ts` - job CRUD
3. `web/app/jobs/page.tsx` - job board UI
4. `web/components/jobs/` - job components
5. `web/app/dashboard/jobs/` - company management

---

## Migration Scripts

Extract from git-city:
- `054_jobs.sql` - core job tables
- `055_job_achievements.sql` - achievements
- `056_job_counter_rpcs.sql` - counters
- `057_portfolio.sql` - portfolio feature
- `064_admin_company_management.sql` - company mgmt
- `066_application_status.sql` - application tracking
- `067_job_email_notifications.sql` - email alerts
- `070_public_job_alerts.sql` - public alerts
- `071_pg_cron_cleanup_and_ads.sql` - background jobs