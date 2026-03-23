# Rollback Procedures

## Emergency Rollback Checklist

### 1. Frontend (Vercel) Rollback

**When to use**: UI broken, auth failing, critical bugs in frontend

**Steps**:
1. Go to https://vercel.com/dashboard
2. Select `agentbot` project
3. Click "Deployments" tab
4. Find last working deployment (green checkmark)
5. Click "..." menu → "Promote to Production"
6. Confirm promotion

**Time**: < 1 minute

### 2. Backend (Render) Rollback

**When to use**: API errors, database connection issues, worker failures

**Steps**:
1. Go to https://dashboard.render.com
2. Select `agentbot-api` service
3. Click "Events" tab
4. Find last successful deploy
5. Click "Redeploy" on that event

**Time**: 2-5 minutes (service restarts)

### 3. Database Rollback

**When to use**: Migration failed, data corruption, schema issues

**Steps**:
1. Go to https://console.neon.tech
2. Select your project
3. Go to "Branches" → find main branch
4. Click "Restore" → select restore point
5. Confirm restore

**Important**: This will lose data created after the restore point

### 4. Full System Rollback

**When to use**: Multiple services failing, cascading issues

**Order matters**:
1. Rollback database first (if needed)
2. Rollback backend (Render)
3. Rollback frontend (Vercel)
4. Verify health endpoints
5. Test critical flows

---

## Post-Rollback Verification

After any rollback, verify:

```bash
# 1. Health checks
curl -s https://agentbot.raveculture.xyz/api/health
curl -s https://agentbot-api.onrender.com/health

# 2. Database connectivity
curl -s https://agentbot.raveculture.xyz/api/metrics

# 3. AI functionality
curl -s -X POST https://agentbot.raveculture.xyz/api/demo/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}'
```

---

## Preventing Issues

### Before Deploying
1. Run `node scripts/pre-deployment-validation.js`
2. Test locally with `npm run build`
3. Check TypeScript compiles without errors
4. Verify environment variables are set

### Staged Rollout
1. Deploy to preview branch first
2. Test preview URL thoroughly
3. Promote to production only after verification

### Monitoring
- Watch Vercel deployment logs
- Watch Render deployment logs
- Check error rates in first 5 minutes
- Have rollback plan ready

---

## Contact & Escalation

If rollback doesn't work:
1. Check service status pages (Vercel, Render, Neon)
2. Review deployment logs for errors
3. Check if environment variables changed
4. Contact platform support if needed

---

*Last updated: 2026-03-23*
