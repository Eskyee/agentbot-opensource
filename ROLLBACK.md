# Rollback Procedures

## Overview

This document provides comprehensive rollback procedures for the agentbot platform, covering frontend, backend, database, and external service rollbacks.

---

## Rollback Decision Matrix

| Severity | Impact | Rollback Type | Time to Rollback |
|----------|--------|---------------|------------------|
| Critical | Complete service outage | Immediate | < 5 minutes |
| High | Major feature broken | Immediate | < 10 minutes |
| Medium | Minor functionality issues | Scheduled | < 1 hour |
| Low | Cosmetic/UX issues | Scheduled | < 24 hours |

---

## Frontend Rollback (Vercel)

### Option 1: Vercel UI Rollback

**Steps:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to Project → Deployments
3. Find previous successful deployment
4. Click "..." → "Promote to Production"
5. Wait for promotion to complete (typically < 2 minutes)

**Verification:**
```bash
curl https://agentbot.raveculture.xyz/api/health
# Should return 200 with previous version
```

### Option 2: Vercel CLI Rollback

**Steps:**
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Rollback to previous deployment
npx vercel rollback

# Rollback to specific deployment
npx vercel rollback [deployment-url]
```

### Option 3: Git Revert Rollback

**Steps:**
```bash
# View deployment history
git log --oneline -10

# Revert last commit (while preserving history)
git revert HEAD

# Push revert to trigger redeploy
git push origin main

# Alternative: Force reset to previous commit
git reset --hard HEAD~1
git push origin main --force
```

**⚠️ WARNING:** Force reset erases history; only use if revert doesn't work.

---

## Backend Rollback (Render)

### Option 1: Render UI Rollback

**Steps:**
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Navigate to Services → agentbot-api
3. Go to Deployments tab
4. Find previous successful deployment
5. Click "..." → "Redeploy" or "Rollback"

**Verification:**
```bash
curl https://agentbot-api.onrender.com/health
# Should return 200 with previous version
```

### Option 2: Specific Version Rollback

**Steps:**
1. Create a git tag for last known good version:
   ```bash
   git tag v1.0.7-goods
   git push origin v1.0.7-goods
   ```

2. In Render Dashboard → Services → agentbot-api:
   - Click "New Deploy"
   - Select "branch or tag"
   - Choose tag: v1.0.7-goods
   - Click "Deploy"

### Option 3: Manual Image Rollback

**Steps:**
1. Pull previous Docker image locally:
   ```bash
   docker pull ghcr.io/openclaw/openclaw:2026.3.13
   ```

2. Tag and push fallback image:
   ```bash
   docker tag ghcr.io/openclaw/openclaw:2026.3.13 your-registry/fallback:v1
   docker push your-registry/fallback:v1
   ```

3. Update Docker image reference in Render and redeploy.

---

## Database Rollback

### Scenario 1: Schema Migration Failure

**Rollback Steps:**
```bash
cd web

# List migrations
npx prisma migrate status

# Mark failed migration as resolved
npx prisma migrate resolve --applied "migration_name"

# Verify schema
npx prisma migrate status
```

### Scenario 2: Data Corruption

**Option A: Restore from Backup (Render)**
1. Go to Render Dashboard → agentbot-db
2. Navigate to "Backups"
3. Select backup to restore
4. Click "Restore"
5. Wait for restore to complete (5-10 minutes)
6. Verify data integrity

**Option B: Point-in-Time Recovery (PITR)**
1. Go to Render Dashboard → agentbot-db
2. Navigate to "Backups" → "Point-in-Time Recovery"
3. Select timestamp to restore to
4. Click "Restore"
5. Monitor restore progress

**Option C: Manual SQL Rollback**
```bash
# Get database connection string from Render
export DATABASE_URL="postgresql://..."

# Restore from SQL backup
psql $DATABASE_URL < backup-2026-03-23.sql

# Verify tables
npx prisma db pull
npx prisma db push --skip-generate
```

### Scenario 3: Migration Rollback (Destructive)

**⚠️ DANGEROUS**: Only use for catastrophic failures

```bash
cd web

# Reset database (DELETES ALL DATA)
npx prisma migrate reset

# Re-run migrations
npx prisma migrate deploy

# Re-seed if needed
npx prisma db seed
```

**⚠️ WARNING:** This deletes all data. Only when absolutely necessary.

---

## Worker Rollback (Render - Background Jobs)

### Option 1: Render UI Rollback

Same as backend rollback:
1. Render Dashboard → Services → agentbot-worker
2. Deployments tab → Rollback to previous version

### Option 2: Manual Worker Status Check

```bash
# Via Render shell
# Connect to worker service shell

# Check worker process
pm2 list

# Check job queue
redis-cli -h redis-host -p 6379
# redis> KEYS "bull:*"
# redis> LLEN "bull:default:waiting"
```

---

## External Service Rollback

### Stripe Configuration Rollback

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Settings → Developers → Webhooks
3. Disable problematic webhook endpoints
4. Revert webhook version if needed
5. Verify API keys haven't changed

### OAuth Provider Rollback

**Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services → Credentials
3. Revert OAuth 2.0 settings
4. Verify redirect URIs are correct
5. Re-publish app if needed

**GitHub OAuth:**
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. OAuth Apps → Select Agentbot
3. Verify oAuth application settings
4. Check callback URLs

### OpenRouter Rollback

1. Go to [OpenRouter Dashboard](https://openrouter.ai/keys)
2. Verify API key hasn't expired
3. Check rate limits
4. Rollback to previous API model version if needed

---

## Complete System Rollback

### Procedure

1. **Access Control**
   - Enable maintenance mode (if available)
   - Notify users via status page

2. **Database Rollback** (if needed)
   - Restore from backup
   - Verify data integrity

3. **Backend Rollback**
   ```bash
   # Via Render UI or CLI
   # Rollback to v1.0.7-goods
   ```

4. **Frontend Rollback**
   ```bash
   # Via Vercel UI or CLI
   npx vercel rollback
   ```

5. **Worker Rollback**
   ```bash
   # Via Render UI
   # Rollback agentbot-worker
   ```

6. **Redis Flush** (if job queue corrupted)
   ```bash
   # Via Redis CLI
   redis-cli FLUSHDB
   ```

7. **Verification**
   ```bash
   # Health checks
   curl https://agentbot.raveculture.xyz/api/health
   curl https://agentbot-api.onrender.com/health

   # User flows test
   # - Login works
   # - Dashboard loads
   # - API calls succeed
   ```

8. **Monitoring**
   - Check logs for errors
   - Monitor metrics dashboard
   - Watch database connection pool

9. **Exit Maintenance Mode**
   - Disable maintenance mode
   - Update status page to "operational"

---

## Rollback Verification Checklist

After rollback is complete:

### Frontend
- [ ] Homepage loads: https://agentbot.raveculture.xyz
- [ ] Login page accessible
- [ ] Dashboard accessible
- [ ] No console errors
- [ ] Lighthouse score acceptable (>80)

### Backend
- [ ] Health endpoint responds 200: /health
- [ ] API endpoints respond correctly
- [ ] Docker containers running
- [ ] No errors in logs
- [ ] Redis connectivity confirmed

### Database
- [ ] All tables accessible
- [ ] Data integrity verified
- [ ] Connection pool healthy
- [ ] No slow queries
- [ ] Backup system operational

### External Services
- [ ] Stripe checkout works
- [ ] OAuth providers functional
- [ ] OpenRouter API responding
- [ ] Webhooks receiving events
- [ ] Email service (Resend) working

---

## Rollback Timeout Guidelines

| Component | Timeout | Action if Timeout Exceeded |
|-----------|---------|---------------------------|
| Frontend | 5 minutes | Full system rollback |
| Backend | 3 minutes | Restart container |
| Database | 10 minutes | Restore from backup |
| External Services | 5 minutes | Switch to fallback |

---

## Emergency Rollback Commands

### Quick Reference (Save to clipboard)

```bash
# Frontend rollback (Vercel)
npx vercel rollback

# Backend rollback (Render)
# Use Render UI → Services → Rollback

# Database status
cd web && npx prisma migrate status

# Database rollback
cd web && npx prisma migrate resolve --applied "migration_name"

# Health checks
curl https://agentbot.raveculture.xyz/api/health
curl https://agentbot-api.onrender.com/health

# View logs
# Vercel: npx vercel logs
# Render: Dashboard → Service → Logs

# Restart services
# Backend: Render UI → Services → Manual Deploy
# Frontend: npx vercel --prod
```

---

## Rollback Communication

### Internal Team

**When to Communicate:**
- Critical rollback: Immediately (call + Slack)
- High rollback: Within 5 minutes (Slack)
- Medium rollback: Within 30 minutes (email/Slack)
- Low rollback: At next team meeting

**Communication Template:**
```
🚨 ROLLBACK ALERT

Time: YYYY-MM-DD HH:MM UTC
Component: [Frontend/Backend/Database/All]
Severity: [Critical/High/Medium/Low]
Reason: [Brief description]
Action: [Rollback procedure executed]
Status: [In Progress/Complete]
Estimated Recovery: [XX minutes]
Estimated Impact: [Brief impact description]
Next Update: [Time of next update]
```

### External Communication

**When to Communicate:**
- Critical: Within 15 minutes (status page + email)
- High: Within 30 minutes (status page)
- Medium/Low: In next maintenance window

**Communication Channels:**
- Status page: Update with estimated recovery
- Email: Subscribers (if critical)
- Dashboard: Banner message
- Social media: Only for critical outages

---

## Rollback Metrics

Track these metrics for continuous improvement:

| Metric | Target | Current | Notes |
|--------|--------|---------|-------|
| Rollback Time | < 5 minutes | TBD | |
| Data Loss | 0 | TBD | |
| User Impact | < 10% users | TBD | |
| Post-Rollback Issues | 0 | TBD | |
| Rollback Frequency | < 1/month | TBD | |

---

## Post-Rollback Analysis

### Root Cause Investigation

1. **Identify root cause**
   - Review logs
   - Check deployment artifacts
   - Trace failure sequence

2. **Document findings**
   - Create incident report
   - Update knowledge base
   - Update runbook

3. **Prevention measures**
   - Add automated tests
   - Update validation scripts
   - Improve monitoring

### Recovery Time Breakdown

| Phase | Time Spent | Target | Improvement Actions |
|-------|------------|--------|---------------------|
| Detection | TBD | < 2 minutes | Better monitoring |
| Decision | TBD | < 5 minutes | Clear criteria |
| Execution | TBD | < 10 minutes | Practice drills |
| Verification | TBD | < 5 minutes | Automated checks |

---

## Escalation Procedures

### Escalation Levels

**Level 1: On-Call Engineer**
- Time to respond: < 5 minutes
- Can execute standard rollbacks
- Can communicate to users

**Level 2: Technical Lead**
- Time to respond: < 15 minutes
- Handles complex rollbacks
- Coordinates team response

**Level 3: CTO/VP Engineering**
- Time to respond: < 30 minutes
- Critical incidents only
- Business impact decisions

### Escalation Triggers

- **Immediate escalation:** Complete service outage
- **Level 2 escalation:** Multiple systems affected
- **Level 3 escalation:** Regulatory or compliance issue

---

## References

### Related Documentation
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment runbook
- [SECRETS.md](./SECRETS.md) - Secrets configuration
- [AGENTS.md](./AGENTS.md) - Developer guide

### Service Documentation
- [Vercel Rollback](https://vercel.com/docs/deployments/rollbacks)
- [Render Rollback](https://render.com/docs/deploys)
- [Stripe Rollback](https://stripe.com/docs/http/rate-limits)
- [Prisma Rollback](https://www.prisma.io/docs/guides/migrations/rollback)

### Training Resources
- Run rollback drills monthly
- Document lessons learned
- Update procedures based on findings

---

## Maintenance

**Document Version:** 1.0
**Last Updated:** 2026-03-23
**Next Review:** 2026-06-23

**Changelog:**
- v1.0 (2026-03-23): Initial version

---

**Important:** Test rollback procedures quarterly. Keep contact information current. Update when architecture changes.
