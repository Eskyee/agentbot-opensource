#!/bin/bash
# Agentbot Deploy Script

echo "🚀 Agentbot Deploy"
echo "=================="

# 1. Update OpenClaw version
echo "1. Updating OpenClaw version to v2026.3.1..."
sed -i '' 's/openclaw:2026.2.26/openclaw:2026.3.1/g' agentbot-backend/src/index.ts
sed -i '' 's/OPENCLAW_RUNTIME_VERSION.*=.*/OPENCLAW_RUNTIME_VERSION = '"'"'2026.3.1'"'"'/g' agentbot-backend/src/index.ts
echo "   ✅ OpenClaw updated to v2026.3.1"

# 2. Fix web code (Next.js 16)
echo "2. Fixing web code..."

# Fix stripe.ts
sed -i '' "s/apiVersion: '2023-10-16'/apiVersion: '2026-02-25.clover'/g" web/app/lib/stripe.ts
sed -i '' 's/\.del(/.cancel(/g' web/app/lib/stripe.ts

# Fix privateMode.ts
sed -i '' 's/const headersList = headers()/const headersList = await headers()/g' web/app/lib/privateMode.ts

# Fix stripe webhook
sed -i '' 's/const sig = headers()\.get/const headersList = await headers(); const sig = headersList.get/g' web/app/api/webhooks/stripe/route.ts

echo "   ✅ Web code fixed"

# 3. Git add & commit
echo "3. Committing changes..."
git add -A
git commit -m "deploy: update OpenClaw to v2026.3.1 and fix Next.js 16 issues"

# 4. Push
echo "4. Pushing to GitHub..."
git push

echo ""
echo "✅ Deploy triggered! Check Vercel/Docker for build status."
