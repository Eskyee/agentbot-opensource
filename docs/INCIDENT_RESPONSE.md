# Incident Response Plan

**Project:** Agentbot  
**Document Type:** Operational Runbook  
**Last Updated:** 2026-02-28

---

## Overview

This document outlines the incident response procedures for the Agentbot production deployment on Vercel. It covers escalation paths, rollback procedures, and communication templates.

---

## Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| **SEV1 - Critical** | Complete service outage | 15 minutes | Database down, deployment broken |
| **SEV2 - High** | Major functionality impaired | 1 hour | Payment processing failing, auth issues |
| **SEV3 - Medium** | Partial impairment | 4 hours | Non-critical features slow, UI bugs |
| **SEV4 - Low** | Minor issues | 24 hours | Typos, cosmetic issues, documentation |

---

## Escalation Path

### Primary On-Call
1. **First Contact:** Developer on duty
2. **Contact:** Email/Slack: `[TO BE ADDED]`

### Escalation Chain
```
SEV1: Developer → Tech Lead → CTO → External (if needed)
SEV2: Developer → Tech Lead → CTO
SEV3: Developer → Tech Lead
SEV4: Developer (next business day)
```

---

## Rollback Procedures

### Vercel CLI Rollback

**Prerequisites:**
```bash
npm i -g vercel
vercel login
```

**Steps:**
1. List recent deployments:
```bash
vercel list agentbot
```

2. Rollback to a specific deployment:
```bash
vercel rollback agentbot@<deployment-id>
```

3. Verify rollback succeeded:
```bash
vercel ls agentbot
```

**Alternative - Dashboard Rollback:**
1. Go to https://vercel.com/dashboard
2. Select project → Deployments
3. Find previous working deployment
4. Click "..." → "Promote to Production"

### Database Rollback

If a migration caused issues:

```bash
# Restore from backup
psql $DATABASE_URL < backups/pre-migration.sql

# Or use Neon point-in-time restore
# Go to Neon Dashboard → Select Project → Branching → Restore
```

---

## Emergency Contacts

| Role | Name | Phone | Email |
|------|------|-------|-------|
| Tech Lead | `[TO BE ADDED]` | `[TO BE ADDED]` | `[TO BE ADDED]` |
| Backend Lead | `[TO BE ADDED]` | `[TO BE ADDED]` | `[TO BE ADDED]` |
| Frontend Lead | `[TO BE ADDED]` | `[TO BE ADDED]` | `[TO BE ADDED]` |

---

## Communication Templates

### Internal Alert (Slack)

```
🚨 **[SEV1/SEV2] Incident: <brief description>**

Status: Investigating
Impact: <description of user impact>
Affected: <percentage/users affected>
Action: <what we're doing>
ETA: <if known>
Contact: <who's handling it>
```

### Status Page Update

```
## Incident Report - <date>

**Summary:** <brief description>
**Status:** Investigating / Identified / Monitoring / Resolved
**Impact:** <description>
**Resolution:** <how it was fixed>
```

---

## Post-Incident

1. **Document:** Create incident report in `docs/INCIDENTS/`
2. **Review:** Schedule post-mortem within 48 hours
3. **Fix:** Address root cause
4. **Prevent:** Add monitoring/alerts to prevent recurrence

---

## Useful Commands

```bash
# View deployment status
vercel ls agentbot

# View function logs
vercel logs agentbot.vercel.app --follow

# Rollback (requires Vercel CLI)
vercel rollback agentbot@<deployment-id>

# Check environment variables
vercel env pull production
```

---

*This document should be reviewed and updated monthly or after any incident.*
