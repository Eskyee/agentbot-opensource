# Incident Response Plan

**Project:** Agentbot  
**Document Type:** Operational Runbook  
**Last Updated:** 2026-02-28

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `vercel list agentbot` | List deployments |
| `vercel rollback agentbot@<id>` | Rollback production |
| `vercel logs --follow` | Stream function logs |

---

## Overview

This document outlines the incident response procedures for the Agentbot production deployment on Vercel. It covers severity levels, escalation paths, rollback procedures, and communication templates.

---

## Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| **SEV1 - Critical** | Complete service outage | 15 minutes | Database down, deployment broken, payment failure |
| **SEV2 - High** | Major functionality impaired | 1 hour | Auth broken, Stripe issues, API timeouts |
| **SEV3 - Medium** | Partial impairment | 4 hours | Non-critical features slow, UI bugs, caching issues |
| **SEV4 - Low** | Minor issues | 24 hours | Typos, cosmetic issues, documentation |

---

## Escalation Path

```
SEV1: Developer → Tech Lead → CTO → External (if needed)
SEV2: Developer → Tech Lead → CTO
SEV3: Developer → Tech Lead
SEV4: Developer (next business day)
```

### Contact Template

| Role | Name | Phone | Email |
|------|------|-------|-------|
| On-Call Developer | `[TO BE ADDED]` | `[TO BE ADDED]` | `[TO BE ADDED]` |
| Tech Lead | `[TO BE ADDED]` | `[TO BE ADDED]` | `[TO BE ADDED]` |
| CTO | `[TO BE ADDED]` | `[TO BE ADDED]` | `[TO BE ADDED]` |

---

## Monitoring & Detection

### Vercel Dashboard
- **Deployments:** https://vercel.com/dashboard → Select project → Deployments
- **Function Logs:** https://vercel.com/dashboard → Select project → Functions
- **Analytics:** https://vercel.com/dashboard → Select project → Analytics
- **Speed Insights:** https://vercel.com/dashboard → Select project → Speed Insights

### External Monitoring
- **Uptime Robot:** https://uptimerobot.com (free tier: 5 monitors)
- **Better Stack:** https://betterstack.com (includes log management)
- **Datadog:** https://datadoghq.com (enterprise-grade)

### Recommended Alerts
1. Deployment failure notification (Vercel built-in)
2. Function error rate > 1%
3. Response time > 2 seconds
4. SSL certificate expiry (30 days)

---

## Rollback Procedures

### Option 1: Vercel CLI (Recommended)

```bash
# Install/upgrade Vercel CLI
npm i -g vercel@latest

# Login (first time only)
vercel login

# List recent deployments
vercel list agentbot

# Rollback to specific deployment
vercel rollback agentbot@<deployment-id>

# Alternative: rollback to last known good
vercel rollback agentbot

# Verify rollback
vercel ls agentbot
```

**Note:** Find deployment ID from `vercel list` output or Vercel Dashboard → Deployments → Copy ID button.

### Option 2: Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select **agentbot** project
3. Navigate to **Deployments** tab
4. Find a working deployment (green checkmark)
5. Click **⋮** menu → **Promote to Production**

### Option 3: Git Revert (Long-term Fix)

```bash
# Create revert commit
git revert HEAD

# Push to trigger new deployment
git push origin main
```

---

## Database Rollback (PostgreSQL/Neon)

### Option 1: Neon Point-in-Time Restore

1. Go to https://console.neon.tech
2. Select your project
3. Go to **Branches** → select branch
4. Click **Restore** → choose timestamp
5. Update `DATABASE_URL` in Vercel env vars

### Option 2: Manual Restore

```bash
# Download backup
curl -o backup.sql "<backup-url>"

# Restore (use with caution - drops current data)
psql $DATABASE_URL < backup.sql

# Or use pg_restore for larger dumps
pg_restore -d $DATABASE_URL backup.dump
```

---

## Common Incident Scenarios

### 1. Deployment Fails

**Symptoms:** Red deployment in Vercel dashboard

**Steps:**
1. Check deployment logs in Vercel Dashboard
2. Common issues: missing env vars, build errors, type errors
3. Fix locally and push new commit
4. Or rollback to previous deployment

### 2. Function Timeout

**Symptoms:** 504 Gateway Timeout errors

**Steps:**
1. Check function logs: `vercel logs agentbot.vercel.app --follow`
2. Increase `maxDuration` in `vercel.json` or dashboard
3. Optimize function: add caching, reduce processing
4. Consider using edge functions for simple routes

### 3. Database Connection Issues

**Symptoms:** "Connection refused" or timeout errors

**Steps:**
1. Verify `DATABASE_URL` in Vercel Environment Variables
2. Check Neon dashboard for outages
3. Check connection pool limits (Neon free tier: 1 connection)
4. Implement connection pooling if needed

### 4. Rate Limiting / 429 Errors

**Symptoms:** Users seeing 429 Too Many Requests

**Steps:**
1. Check if legitimate traffic spike or attack
2. Review Vercel function logs for patterns
3. Implement rate limiting middleware
4. Consider upgrading to Pro for higher limits

### 5. SSL Certificate Issues

**Symptoms:** Users see SSL errors, "Your connection is not private"

**Steps:**
1. Check Vercel Dashboard → Domains → SSL
2. Force HTTPS in domain settings
3. Wait for propagation (can take up to 24 hours)
4. Contact Vercel support if issues persist

---

## Communication Templates

### Internal Alert (Slack/Discord)

```
🚨 **[SEV1] Incident: <brief description>**

Status: Investigating
Impact: <description of user impact>
Affected: <percentage/users affected>
Action: <what we're doing>
ETA: <if known>
Contact: @<who's handling it>

Thread for updates:
```

### Status Page Update

```
## Incident Report - <date>

**Summary:** <brief description>
**Status:** 🟢 Resolved / 🟡 Monitoring / 🔴 Identified / 🟠 Investigating
**Impact:** <e.g., "2% of users affected">
**Root Cause:** <brief explanation>
**Resolution:** <how it was fixed>
**Next Steps:** <any follow-up work>

We apologize for the inconvenience.
```

### User Communication

```
Hi <name>,

We're aware of an issue affecting <service>. Our team is investigating.

We'll update here once we have more information.

Thank you for your patience,
The Agentbot Team
```

---

## Post-Incident

1. **Document:** Create incident report in `docs/INCIDENTS/`
2. **Review:** Schedule post-mortem within 48 hours
3. **Fix:** Address root cause
4. **Prevent:** Add monitoring/alerts to prevent recurrence

### Incident Report Template

```markdown
# Incident Report - <title>

**Date:** <YYYY-MM-DD>
**Duration:** <e.g., 2 hours>
**Severity:** SEV<1-4>
**Author:** <name>

## Summary
<Brief description of what happened>

## Impact
- Users affected: <number/percentage>
- Duration: <time>

## Root Cause
<Technical explanation>

## Resolution
<How it was fixed>

## Lessons Learned
<What we learned>

## Action Items
- [ ] <action> - @<owner> - <date>
```

---

## Useful Links

| Resource | URL |
|----------|-----|
| Vercel Dashboard | https://vercel.com/dashboard |
| Vercel Docs | https://vercel.com/docs |
| Vercel Status | https://vercel.statuspage.io |
| Neon Console | https://console.neon.tech |
| Stripe Dashboard | https://dashboard.stripe.com |

---

## Emergency Commands

```bash
# Quick deployment rollback (last known good)
vercel rollback agentbot

# View real-time logs
vercel logs agentbot.vercel.app --follow --output raw

# Check current production URL
vercel ls agentbot | head -5

# Pull production environment locally
vercel env pull production

# List all environment variables (masked)
vercel env ls production
```

---

*This document should be reviewed and updated monthly or after any incident.*
