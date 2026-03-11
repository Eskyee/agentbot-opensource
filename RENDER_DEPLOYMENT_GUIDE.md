# Render Deployment Guide for AgentBot

**Date:** March 10, 2026  
**Status:** Ready for deployment  
**Services:** API, Worker, PostgreSQL, Redis

---

## 🚀 Render Overview

Render is a modern cloud platform perfect for deploying:
- ✅ Node.js backend services
- ✅ PostgreSQL databases
- ✅ Redis cache
- ✅ Background workers
- ✅ Scheduled jobs

**vs Vercel (Frontend):**
- Vercel: Static sites + serverless functions (frontend)
- Render: Full-stack services, databases, background jobs (backend)

---

## 📋 What We're Deploying

```
Your Architecture:

Frontend (Next.js)
    ↓ (deployed to Vercel)
    ↓
API Server (Node.js) ← Deploy to Render
    ↓
PostgreSQL ← Deploy to Render
    ↓
Redis ← Deploy to Render
    ↓
Worker Service ← Deploy to Render
```

---

## 🔧 Render Setup Steps

### Step 1: Create Render Account
1. Go to: https://render.com
2. Sign up with GitHub (recommended)
3. Authorize access to your repository

### Step 2: Create Services on Render

#### 2A: PostgreSQL Database
1. Dashboard → New → PostgreSQL
2. Name: `agentbot-postgres`
3. Database: `agentbot_db`
4. User: `agentbot`
5. Select region (closest to your users)
6. Create Database
7. **Save connection string** (you'll need this)

#### 2B: Redis Cache
1. Dashboard → New → Redis
2. Name: `agentbot-redis`
3. Select region (same as PostgreSQL)
4. Create Redis
5. **Save connection string** (you'll need this)

#### 2C: Web Service (API)
1. Dashboard → New → Web Service
2. Connect to GitHub repository
3. Select: `Eskyee/agentbot`
4. Name: `agentbot-api`
5. Environment: `Node`
6. Build Command: `npm ci && npm run build`
7. Start Command: `npm start`
8. Add environment variables:
   ```
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=[from PostgreSQL]
   REDIS_URL=[from Redis]
   # Add other env vars from your .env
   ```
9. Create Web Service

#### 2D: Background Worker
1. Dashboard → New → Web Service
2. Connect to GitHub repository
3. Select: `Eskyee/agentbot`
4. Name: `agentbot-worker`
5. Environment: `Node`
6. Build Command: `npm ci && npm run build`
7. Start Command: `npm run worker`
8. Add same environment variables as API
9. Add to `render.yaml` (see below)

---

## 📄 render.yaml Configuration

Create `render.yaml` in your project root:

```yaml
services:
  # PostgreSQL Database
  - type: pserv
    name: agentbot-postgres
    image: postgres:15
    region: oregon
    env:
      POSTGRES_USER: agentbot
      POSTGRES_PASSWORD: ${{ secrets.POSTGRES_PASSWORD }}
      POSTGRES_DB: agentbot_db
    storage:
      - path: /var/lib/postgresql/data
        size: 10gb

  # Redis Cache
  - type: redis
    name: agentbot-redis
    region: oregon
    plan: starter

  # API Server
  - type: web
    name: agentbot-api
    runtime: node
    plan: starter
    buildCommand: npm ci && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: DATABASE_URL
        fromService:
          type: pserv
          name: agentbot-postgres
          property: connectionString
      - key: REDIS_URL
        fromService:
          type: redis
          name: agentbot-redis
          property: connectionString
      - key: API_KEY
        sync: false

  # Background Worker
  - type: web
    name: agentbot-worker
    runtime: node
    plan: starter
    buildCommand: npm ci && npm run build
    startCommand: npm run worker
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromService:
          type: pserv
          name: agentbot-postgres
          property: connectionString
      - key: REDIS_URL
        fromService:
          type: redis
          name: agentbot-redis
          property: connectionString
```

---

## 🔐 Environment Variables on Render

### Required Variables

```
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgres://agentbot:PASSWORD@hostname:5432/agentbot_db

# Redis
REDIS_URL=redis://:PASSWORD@hostname:6379

# API Keys
API_KEY=your_api_key
STRIPE_SECRET=sk_live_...
OPENROUTER_API_KEY=your_key

# Auth
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=https://api.yourapp.com

# Webhooks
WEBHOOK_SECRET=your_secret
```

### How to Add Secrets on Render

1. Go to your service
2. Environment → Add Environment Variable
3. Set each variable
4. Deploy will use them automatically

---

## 🔄 Deployment Process

### Automatic Deployment (Recommended)

1. Push to GitHub:
```bash
git add .
git commit -m "ready for render deployment"
git push upstream main
```

2. Render watches your repo:
   - Detects changes
   - Pulls latest code
   - Runs build command
   - Restarts service
   - Deploys automatically

### Manual Deployment

1. Go to Render service
2. Click "Manual Deploy"
3. Select branch: `main`
4. Click "Deploy"

---

## 🧪 Testing Render Deployment

### Check Service Health

```bash
# API health
curl https://agentbot-api.onrender.com/health

# Expected response:
# {"status":"ok","timestamp":"..."}
```

### View Logs

1. Go to service on Render
2. Click "Logs"
3. See real-time output
4. Check for errors

### Test Database Connection

```bash
# In your API logs, should see:
# ✅ Connected to PostgreSQL
# ✅ Connected to Redis
```

---

## 🚨 Common Issues & Fixes

### Issue: "Build failed"
**Solution:**
- Check build logs
- Verify `npm run build` works locally
- Ensure all dependencies installed
- Check Node version compatibility

### Issue: "Database connection failed"
**Solution:**
- Verify DATABASE_URL is set
- Check PostgreSQL is running
- Verify username/password correct
- Check firewall allows connection

### Issue: "Redis connection failed"
**Solution:**
- Verify REDIS_URL is set
- Check Redis service is running
- Verify connection string format

### Issue: "Port already in use"
**Solution:**
- Use PORT environment variable
- Check no other service on port
- Render handles port routing automatically

---

## 📊 Monitoring Your Deployment

### Render Dashboard

1. Services → View Status
   - Green = Running
   - Yellow = Deploying
   - Red = Failed

2. Logs
   - Real-time output
   - Error tracking
   - Performance metrics

3. Metrics
   - CPU usage
   - Memory usage
   - Request count
   - Response time

---

## 🔗 Connecting Frontend to Backend

### Update Frontend API URL

In your frontend `.env` or code:

```
BACKEND_API_URL=https://agentbot-api.onrender.com
```

### CORS Configuration

In your backend `app.js` or `server.ts`:

```typescript
import cors from 'cors';

app.use(cors({
  origin: [
    'https://agentbot.vercel.app',    // Vercel frontend
    'http://localhost:3000'            // Local dev
  ],
  credentials: true
}));
```

---

## 📈 Scaling on Render

### When to Scale

- Traffic increases
- Response times slow
- Database hits limits
- Memory usage high

### How to Scale

1. **Upgrade Plan**: starter → professional → pro
2. **Add replicas**: Run multiple instances
3. **Upgrade database**: Increase storage/performance
4. **Optimize code**: Reduce resource usage
5. **Add caching**: Redis optimization

### Cost Optimization

- Use starter plans for development
- Upgrade only when needed
- Monitor resource usage
- Optimize queries
- Clean up unused services

---

## 🔄 CI/CD with Render

### GitHub Actions to Render

Add to `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Render

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Render
        uses: render-org/render-action@v0
        with:
          service-id: ${{ secrets.RENDER_SERVICE_ID }}
          api-token: ${{ secrets.RENDER_API_TOKEN }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

---

## 📋 Deployment Checklist

Before deploying to Render:

```
Code Quality:
  ☐ npm run lint passes
  ☐ npm run build succeeds
  ☐ npm test passes
  ☐ No console errors

Configuration:
  ☐ .env properly set
  ☐ DATABASE_URL correct
  ☐ REDIS_URL correct
  ☐ All secrets added to Render

Testing:
  ☐ Works locally: npm run dev
  ☐ Builds locally: npm run build
  ☐ Tests pass: npm test
  ☐ Health check passes: curl /health

Deployment:
  ☐ Code committed to main
  ☐ render.yaml updated
  ☐ Render services created
  ☐ Environment variables set
  ☐ Deployment triggered
  ☐ Logs checked for errors
  ☐ Health endpoint verified
```

---

## 🎯 Your Render URLs

Once deployed, you'll have:

```
API:
  https://agentbot-api.onrender.com
  https://agentbot-api.onrender.com/health

Worker:
  https://agentbot-worker.onrender.com

Database:
  postgres://agentbot:pass@...render.com:5432/agentbot_db

Redis:
  redis://:pass@...render.com:6379
```

---

## 🚀 Next Steps

1. **Create Render account** (5 minutes)
2. **Set up services** (10 minutes)
3. **Add environment variables** (5 minutes)
4. **Deploy** (5 minutes)
5. **Test** (5 minutes)
6. **Monitor** (ongoing)

---

## 📞 Quick Commands

```bash
# Check current status
git status

# Deploy to Render (automatic)
git add .
git commit -m "deploy to render"
git push upstream main

# View Render logs
# Go to: https://dashboard.render.com

# Test deployment
curl https://agentbot-api.onrender.com/health
```

---

## 🎓 Resources

- Render Docs: https://render.com/docs
- Render Database: https://render.com/docs/databases
- Render Environment: https://render.com/docs/environment-variables
- Render CLI: https://render.com/docs/cli

---

## ✅ Success Criteria

Deployment is successful when:

- ✅ Services show "Live" on Render dashboard
- ✅ API responds to health checks
- ✅ Database connections working
- ✅ Redis cache operational
- ✅ Worker processing jobs
- ✅ No errors in logs
- ✅ Frontend can reach backend

---

**You're ready to deploy to Render!** 🚀

