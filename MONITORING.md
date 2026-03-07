# Monitoring & Logging Setup

## Quick Start

### 1. Create Sentry Account (Free)

1. Go to https://sentry.io
2. Sign up (free tier)
3. Create new organization: "agentbot"
4. Create 3 projects:
   - **Frontend** (Next.js)
   - **Backend** (Node.js)
   - **Worker** (Node.js)
5. Copy DSN keys for each

### 2. Update .env.production

```bash
# Sentry (from https://sentry.io/settings/projects/)
NEXT_PUBLIC_SENTRY_DSN=https://YOUR_FRONTEND_DSN
SENTRY_DSN=https://YOUR_BACKEND_DSN
SENTRY_WORKER_DSN=https://YOUR_WORKER_DSN

# GCP Logging (auto-enabled if on GCP)
GOOGLE_CLOUD_PROJECT=raveculture-youtube-api
```

### 3. Install Sentry SDK

```bash
cd ~/agentbot/web
npm install @sentry/nextjs

cd ~/agentbot/agentbot-backend
npm install @sentry/node

cd ~/agentbot/agentbot-worker
npm install @sentry/node
```

### 4. Enable in Application Entry Points

**Frontend (web/pages/_app.tsx or app/layout.tsx):**
```typescript
import './sentry.client.config';
```

**Backend (agentbot-backend/src/index.ts):**
```typescript
import Sentry from './sentry.config';

app.use(Sentry.Handlers.requestHandler());
// ... routes ...
app.use(Sentry.Handlers.errorHandler());
```

**Worker (agentbot-worker/src/index.ts):**
```typescript
import Sentry from './sentry.config';
```

### 5. Setup Email Alerts in Sentry

1. Go to Sentry project settings
2. Alerts → Create Alert Rule
3. **When:** An issue occurs
4. **Notify:** Send email to your@email.com
5. Save

### 6. View Logs in GCP

```bash
# View all application logs
gcloud logging read "resource.type=cloud_run OR resource.type=gce_instance" \
  --limit 50 \
  --format json

# Filter by service
gcloud logging read "labels.service=agentbot-frontend" --limit 20
gcloud logging read "labels.service=agentbot-api" --limit 20

# View errors only
gcloud logging read "severity=ERROR" --limit 30
```

### 7. Dashboard

- **Sentry Dashboard:** https://sentry.io/organizations/agentbot/
- **GCP Logs:** https://console.cloud.google.com/logs

## What's Tracked

### Frontend (Sentry)
- ✅ JavaScript errors
- ✅ React component errors
- ✅ Network request errors
- ✅ Performance metrics
- ✅ Session replays (on errors)

### Backend (Sentry)
- ✅ API errors
- ✅ Database errors
- ✅ Stripe webhook errors
- ✅ Request/response timing
- ✅ Unhandled exceptions

### Infrastructure (GCP Logging)
- ✅ Container startup/shutdown
- ✅ Docker events
- ✅ System metrics
- ✅ Application logs (stdout/stderr)

## Alert Rules

### Recommended Alerts

1. **New Error Type**
   - When: New issue appears
   - Notify: Email
   - Frequency: Immediately

2. **Error Rate Spike**
   - When: Error rate > 10%
   - Notify: Email
   - Frequency: Immediately

3. **Deployment Issues**
   - When: Error rate > 5% in 1 hour
   - Notify: Email
   - Frequency: Once per hour

4. **Performance Degradation**
   - When: P95 response time > 2s
   - Notify: Email
   - Frequency: Once per hour

## Viewing Errors

### Sentry Web Interface
```
Projects → agentbot-frontend → Issues
- See all errors
- Click error to view stack trace
- See affected users
- View session replay
```

### Command Line
```bash
# Get recent errors
curl -H "Authorization: Bearer YOUR_SENTRY_TOKEN" \
  https://sentry.io/api/0/projects/YOUR_ORG/YOUR_PROJECT/issues/

# Get error details
curl -H "Authorization: Bearer YOUR_SENTRY_TOKEN" \
  https://sentry.io/api/0/projects/YOUR_ORG/YOUR_PROJECT/issues/ISSUE_ID/
```

## Free Tier Limits

- ✅ Unlimited projects
- ✅ 5,000 errors/month per project
- ✅ 1 user seat
- ✅ 24-hour error retention
- ⚠️ No session replay on free tier (optional)
- ⚠️ No custom alerts on free tier (but email works)

## Upgrade When Needed

- **Starter:** $29/month - 50k errors/month
- **Team:** $99/month - Unlimited + more features
- Or stay on free and manage volume

## Troubleshooting

**Errors not appearing in Sentry:**
```bash
# Check DSN is correct
echo $NEXT_PUBLIC_SENTRY_DSN
echo $SENTRY_DSN

# Test error capture
curl -X POST https://sentry.io/api/YOUR_PROJECT_ID/store/ \
  -H "Content-Type: application/json" \
  -d '{"message":"Test error"}'
```

**GCP Logs not showing:**
```bash
# Verify GCP project
gcloud config get-value project

# Check service has logging permission
gcloud projects get-iam-policy raveculture-youtube-api
```

**Email alerts not sending:**
1. Check email in Sentry user settings
2. Verify you can receive emails
3. Check Sentry project email settings
4. Create test alert rule

## Next Steps

1. Create Sentry account + projects
2. Add DSN to .env.production
3. Install @sentry/nextjs and @sentry/node
4. Deploy to production
5. Trigger test error to verify
6. Setup email alert rules
7. Monitor for 24 hours
8. Adjust alerts as needed
