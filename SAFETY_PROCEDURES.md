# Agentbot Safety & Recovery Procedures

## Emergency Contacts
- **Primary:** Configure via `ADMIN_EMAILS` env var
- **Render Dashboard:** https://dashboard.render.com
- **GitHub:** https://github.com/Eskyee/agentbot-opensource/issues

## Emergency Procedures

### 1. Platform Goes Down
```
Step 1: Check Render dashboard → service status
Step 2: Check build logs → find error
Step 3: If bad deploy → rollback:
        git revert HEAD
        git push origin main
Step 4: If database issue → check Postgres service in Render
Step 5: If costs spike → set KILL_SWITCH=true in Render env vars
```

### 2. Costs Spike
```
Step 1: Set KILL_SWITCH=true in Render env vars
Step 2: Check Render billing → find source
Step 3: Delete unexpected services
Step 4: Review billing alerts
Step 5: Contact Render support if needed
```

### 3. Data Breach
```
Step 1: Set KILL_SWITCH=true immediately
Step 2: Rotate all API keys:
        - JWT_SECRET
        - INTERNAL_API_KEY
        - WALLET_ENCRYPTION_KEY
        - BANKR_API_KEY
        - OPENROUTER_API_KEY
Step 3: Check RLS policies in database
Step 4: Review access logs
Step 5: Notify affected users
```

### 4. Database Failure
```
Step 1: Check Postgres service status in Render dashboard
Step 2: If corrupted → restore from backup:
        render db restore <backup-id>
Step 3: If unrecoverable → rebuild from migrations:
        npx prisma migrate deploy
```

## Rollback Procedure

### Quick Rollback (5 minutes)
```bash
git log --oneline -5  # Find last good commit
git revert <commit-hash>
git push origin main
# Render auto-deploys the rollback
```

### Full Rollback (15 minutes)
```bash
# 1. Suspend services
render services list  # Get service IDs
render service suspend <service-id>

# 2. Rollback code
git revert <commit-hash>
git push origin main

# 3. Restore database if needed
render db restore <backup-id>

# 4. Resume services
render service resume <service-id>
```

## Monitoring

### Health Checks
```bash
curl https://agentbot-api.onrender.com/health
curl https://agentbot.raveculture.xyz/api/health
```

### Cost Monitoring
- Alert threshold: $35 unbilled
- Kill switch: set `KILL_SWITCH=true` in Render env vars

### Performance Targets
- API response time: < 500ms
- Web load time: < 3s
- Database queries: < 100ms

## Backup Schedule

### Automatic (Render paid tier)
- Daily backups at 2 AM UTC
- 7-day retention
- Point-in-time recovery available

### Manual Backup
```bash
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

## Recovery Testing

### Monthly Test
1. Create test backup
2. Restore to test database
3. Verify data integrity
4. Document results

### Quarterly Test
1. Full disaster recovery simulation
2. Test rollback procedure
3. Test backup restoration
4. Update procedures if needed

## Incident Response

### Severity Levels
- **P1 (Critical):** Platform down, data loss
- **P2 (High):** Feature broken, users affected
- **P3 (Medium):** Performance issue, minor bug
- **P4 (Low):** Cosmetic issue, documentation

### Response Times
- **P1:** Immediate (within 15 minutes)
- **P2:** Within 1 hour
- **P3:** Within 24 hours
- **P4:** Next sprint

## Communication

### During Incident
1. Update status page
2. Notify affected users
3. Post updates every 30 minutes
4. Document timeline

### After Incident
1. Root cause analysis
2. Update procedures
3. Post-mortem document
4. Prevent recurrence

## Contacts

### Support
- Render: https://render.com/support
- GitHub: https://github.com/Eskyee/agentbot-opensource/issues
- Stripe: https://stripe.com/go/contact
