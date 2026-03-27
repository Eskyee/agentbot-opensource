# Agentbot Deployment Runbook

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Deployment Process](#deployment-process)
3. [Post-Deployment Verification](#post-deployment-verification)
4. [Rollback Procedures](#rollback-procedures)
5. [Troubleshooting](#troubleshooting)
6. [Emergency Contacts](#emergency-contacts)

---

## Pre-Deployment Checklist

### Environment Verification

- [ ] **Vercel Dashboard**
  - [ ] All production secrets configured (see [SECRETS.md](./SECRETS.md))
  - [ ] `NEXTAUTH_SECRET` generated and set
  - [ ] `DATABASE_URL` configured from Render PostgreSQL
  - [ ] OAuth providers configured (Google, GitHub)
  - [ ] Stripe keys configured (Secret + Webhook Secret)
  - [ ] Custom domain verified: `agentbot.raveculture.xyz`

- [ ] **Render Dashboard**
  - [ ] Backend secrets configured:
    - [ ] `OPENROUTER_API_KEY`
    - [ ] `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
    - [ ] `JWT_SECRET` (auto-generated)
    - [ ] `INTERNAL_API_KEY` (auto-generated)
    - [ ] `WALLET_ENCRYPTION_KEY` (auto-generated)
    - [ ] Coinbase CDP keys (if using wallets)
    - [ ] Mux tokens, BANKR_API_KEY, RESEND_API_KEY
    - [ ] `ADMIN_EMAILS` configured
  - [ ] PostgreSQL database provisioned
  - [ ] Redis instance provisioned
  - [ ] Health check path verified: `/health`
  - [ ] Auto-deploy enabled for all services

### Code Quality Verification

- [ ] **Run Pre-Deployment Validation**
  ```bash
  node scripts/pre-deployment-validation.js
  ```
  All checks should pass (0 failures, warnings acceptable)

- [ ] **Test Coverage**
  - [ ] Backend tests pass: `cd agentbot-backend && npm test`
  - [ ] Frontend tests pass: `cd web && npm test`
  - [ ] E2E tests pass: `cd web && npx playwright test`

- [ ] **Git Status**
  - [ ] Working directory clean: `git status --porcelain` (should be empty)
  - [ ] No .env files committed
  - [ ] Branch is: `main`
  - [ ] Latest from origin: `git pull origin main`

### Database Verification

- [ ] **Migrations Ready**
  - [ ] All migrations present in `web/prisma/migrations/`
  - [ ] Schema file: `web/prisma/schema.prisma` is up to date
  - [ ] Seed files prepared (if needed)

- [ ] **Connection Test**
  ```bash
  cd web
  npx prisma db push
  npx prisma migrate deploy
  ```

---

## Deployment Process

### Step 1: Local Validation

```bash
# 1. Pull latest code
git fetch origin && git checkout main && git pull origin main

# 2. Run pre-deployment validation
node scripts/pre-deployment-validation.js

# 3. Run all tests
cd agentbot-backend && npm test
cd ../web && npm test && npx playwright test

# 4. Build both projects
cd agentbot-backend && npm run build
cd ../web && npm run build
```

### Step 2: Push to Main

```bash
# 1. Commit any final changes
git add .
git commit -m "chore: deployment preparation"

# 2. Push to main (triggers CI/CD)
git push origin main
```

### Step 3: Monitor CI/CD

- [ ] **GitHub Actions**: Monitor workflow at `.github/workflows/ci-cd.yml`
  - [ ] Backend build: ✅ Success
  - [ ] Frontend build: ✅ Success
  - [ ] Pre-deployment validation: ✅ Success
  - [ ] Deploy: ✅ Success

- [ ] **Render Deployment:**
  - [ ] Backend service: `agentbot-api` builds and deploys
  - [ ] Frontend service: `agentbot-web` builds and deploys
  - [ ] Worker service: `agentbot-worker` builds and deploys
  - [ ] Check render logs: Logs tab in Render dashboard

- [ ] **Vercel Deployment:**
  - [ ] Monitor Vercel dashboard for build logs
  - [ ] Verify deployment URL: `https://agentbot.raveculture.xyz`

### Step 4: Database Initialization (First Deployment Only)

```bash
# Via Render shell or local with DATABASE_URL
cd web
npx prisma migrate deploy
npx prisma db seed  # if needed
```

---

## Post-Deployment Verification

### Health Checks

```bash
# Test health endpoints
curl https://agentbot-api.onrender.com/health
curl https://api.agentbot.raveculture.xyz/health
curl https://agentbot.raveculture.xyz/api/health
```

Expected response:
```json
{
  "status": "ok",
  "health": "healthy",
  "timestamp": "2026-03-23T..."
}
```

### User Flow Testing

- [ ] **Frontend Access**
  - [ ] Homepage loads: https://agentbot.raveculture.xyz
  - [ ] Authentication works (Google/GitHub OAuth)
  - [ ] Dashboard accessible after login
  - [ ] Resources load (CSS, JS, images)

- [ ] **API Functionality**
  - [ ] Health endpoint: GET /health
  - [ ] Stats endpoint: GET /api/stats
  - [ ] Agent creation (with Bearer token)
  - [ ] Metrics API (with Bearer token)

- [ ] **Database Connectivity**
  - [ ] Users can sign up
  - [ ] Users can log in
  - [ ] Session persistence works
  - [ ] Database queries execute successfully

### Payment Integration

- [ ] **Stripe Webhooks**
  - [ ] Webhook endpoint accessible
  - [ ] Webhook signature validation works
  - [ ] Test checkout flow completes
  - [ ] Subscription status updates
  - [ ] Database subscription records created

### Monitoring Setup

- [ ] **Configure Alerts**
  - [ ] Render: Set up email/Slack alerts for crashes
  - [ ] Vercel: Set up deployment notifications
  - [ ] Redis: Monitor memory usage
  - [ ] Database: Monitor connection pool, slow queries

- [ ] **Log Aggregation**
  - [ ] Check Render logs for errors
  - [ ] Check Vercel logs for errors
  - [ ] Verify no secrets in logs

---

## Rollback Procedures

### Emergency Rollback (Critical Issues Only)

#### Vercel Rollback

1. **Immediate Rollback:**
   ```bash
   # Via Vercel CLI
   npx vercel rollback
   ```
   Or via UI: Vercel Dashboard → Deployments → Click previous deployment → Promote

2. **Git Rollback:**
   ```bash
   # Rollback to last known good version
   git log --oneline -10  # Identify last commit
   git revert HEAD       # Revert problematic commit
   git push origin main
   ```

#### Render Rollback

1. **Via Render UI:**
   - Dashboard → Services → Select service → Deployments
   - Click "Manual Deploy" → Select previous deployment

2. **Via Git Tag:**
   ```bash
   # Tag last known good version
   git tag v1.0.7-goods
   git push origin v1.0.7-goods

   # Use this tag in Render for manual deploy
   ```

### Database Rollback

**For schema changes:**
```bash
# Via Prisma
cd web
npx prisma migrate resolve --applied "migration_name"

# For catastrophic issues:
npx prisma migrate reset  # DESTRUCTIVE - only for emergencies
```

**For data corruption:**
```bash
# Use Render Point-in-Time Recovery (PITR)
# Render Dashboard → Postgres → Backups → Select backup → Restore
```

### Rollback Verification

- [ ] Verify health endpoints respond
- [ ] Test critical user flows
- [ ] Check logs for errors
- [ ] Monitor database connectivity

---

## Troubleshooting

### Common Issues

#### 1. Build Failures

**Next.js Build Errors:**
```bash
# Check environment variables
cd web
npm run build  # Check error messages

# Common fixes:
# - Missing NEXTAUTH_SECRET
# - Invalid DATABASE_URL
# - Missing dependencies
```

**Backend Build Errors:**
```bash
# Check TypeScript compilation
cd agentbot-backend
npm run build

# Common fixes:
# - Type errors in new code
# - Missing dependencies
# - Configuration errors
```

#### 2. Deployment Stalls

**Render Deploy Stuck:**
- Check Render logs for errors
- Verify Dockerfile exit code
- Ensure health check path matches
- Check resource limits (memory/CPU)

**Vercel Deploy Stuck:**
- Check Vercel build logs
- Verify all env vars are set
- Check for large assets exceeding limits
- Review vercel.json configuration

#### 3. Runtime Errors

**Database Connection Failed:**
```bash
# Verify DATABASE_URL
echo $DATABASE_URL

# Test connectivity
cd web && npx prisma db push --skip-generate
```

**Redis Connection Failed:**
```bash
# Verify redis is running in Render
# Check Redis log for connection errors
# Verify REDIS_URL format
```

**Webhook Failures:**
- Verify webhook secret matches Stripe
- Check webhook endpoint is accessible
- Test webhook signature locally
- Review Render/Vercel logs

#### 4. Performance Issues

**Slow API Response:**
- Check database slow query logs
- Review API rate limiting
- Monitor Docker container stats
- Check Redis connection pooling

**Frontend Load Time:**
- Run Lighthouse audit
- Check bundle size
- Review caching strategy
- Verify CDN distribution

---

## Emergency Contacts

### On-Call Rotation
- Primary: raveculture (YOUR_ADMIN_EMAIL_5)
- Secondary: [TBD]

### Service Providers
- **Vercel Support:** https://vercel.com/support
- **Render Support:** https://render.com/support
- **Stripe Support:** https://stripe.com/go/contact
- **Neon DB Support:** https://neon.tech/support

### Monitoring Dashboards
- **Render:** https://dashboard.render.com
- **Vercel:** https://vercel.com/dashboards
- **GitHub Actions:** https://github.com/raveculture/agentbot/actions

---

## Deployment Logs

### Keeping Deployment Records

After each deployment, document:
1. **Deployment Date:** YYYY-MM-DD HH:MM
2. **Deployed Version:** Git commit hash
3. **Changes Made:** Brief description
4. **Issues Encountered:** (if any)
5. **Resolution:** (if issues)
6. **Rollback Required:** Yes/No
7. **Approved By:** Deployment approver

---

## Maintenance Windows

### Scheduled Maintenance
- **Database Backups:** Daily (3 AM UTC via Render)
- **SSL Renewal:** Automatic (Let's Encrypt)
- **Dependency Updates:** Monthly (1st Monday)
- **Security Patches:** Immediate (critical)

### Downtime Notification
For planned downtime > 5 minutes:
1. Notify users 24 hours in advance
2. Update status page
3. Post announcement in dashboard
4. Send email to users

---

## Appendix

### Useful Commands

```bash
# Health check
curl https://agentbot.raveculture.xyz/api/health

# Check Vercel deployments
npx vercel deployments prod

# Check Render services
curl -H "Authorization: Bearer $RENDER_API_KEY" \
  https://api.render.com/v1/services

# Database migration
cd web && npx prisma migrate deploy

# Prisma studio
cd web && npx prisma studio

# Watch logs locally
tail -f logs/server.log

# Docker container stats
docker stats

# Database backup
pg_dump $DATABASE_URL > backup.sql

# Restore backup
psql $DATABASE_URL < backup.sql
```

### File Locations

- **Frontend:** `web/`
- **Backend:** `agentbot-backend/`
- **Dockerfiles:** `web/Dockerfile`, `agentbot-backend/Dockerfile`
- **Database:** `web/prisma/`
- **CI/CD:** `.github/workflows/`
- **Validation:** `scripts/pre-deployment-validation.js`
- **Tests:** `web/tests/e2e/`, `agentbot-backend/src/*.test.ts`

### Environment Variable References

See [SECRETS.md](./SECRETS.md) for complete list of required environment variables.
