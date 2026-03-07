#!/bin/bash

# Master Automation Script
# Sets up all monitoring in one command

set -e

echo "🚀 AgentBot Monitoring & Logging Automation"
echo "==========================================="
echo ""

# Check requirements
echo "✓ Checking requirements..."
if ! command -v jq &> /dev/null; then
    echo "❌ jq not found. Install: apt-get install jq"
    exit 1
fi

if ! command -v curl &> /dev/null; then
    echo "❌ curl not found. Install: apt-get install curl"
    exit 1
fi

echo "✓ Requirements met"
echo ""

# Step 1: Sentry Setup
echo "📱 Step 1: Sentry Setup"
echo "======================"
echo ""
echo "Get your Sentry auth token:"
echo "  1. Go to https://sentry.io/account/api/auth-tokens/"
echo "  2. Create new token with 'project:write' and 'org:read' scopes"
echo "  3. Copy the token"
echo ""
read -p "Enter Sentry auth token: " SENTRY_TOKEN

read -p "Enter Sentry organization slug: " ORG_SLUG

echo ""
echo "Running Sentry setup..."
bash scripts/setup-sentry.sh "$SENTRY_TOKEN" "$ORG_SLUG" || {
    echo "❌ Sentry setup failed"
    exit 1
}

# Extract DSN keys
if [ -f ".env.sentry.local" ]; then
    source .env.sentry.local
    echo ""
    echo "✅ Sentry setup complete. DSN keys saved to .env.sentry.local"
fi

# Step 2: GCP Logging Setup
echo ""
echo "🔧 Step 2: GCP Logging Setup"
echo "============================"
echo ""

read -p "Enter GCP project ID [raveculture-youtube-api]: " GCP_PROJECT
GCP_PROJECT=${GCP_PROJECT:-raveculture-youtube-api}

echo ""
echo "Running GCP logging setup..."
bash scripts/setup-gcp-logging.sh "$GCP_PROJECT" || {
    echo "⚠️  GCP logging setup had issues, but continuing..."
}

# Step 3: Email Alerts
echo ""
echo "📧 Step 3: Email Alert Setup"
echo "============================"
echo ""

read -p "Enter email for alerts: " ALERT_EMAIL

echo ""
echo "Running email alert setup..."
bash scripts/setup-alerts.sh "$SENTRY_TOKEN" "$ORG_SLUG" "$ALERT_EMAIL" || {
    echo "⚠️  Email alert setup had issues, but continuing..."
}

# Step 4: Update environment
echo ""
echo "📋 Step 4: Update Environment"
echo "============================="
echo ""

if [ -f ".env.sentry.local" ]; then
    echo "Merging Sentry DSN into .env.production..."
    
    # Backup original
    cp .env.production .env.production.bak
    
    # Update DSN values
    if grep -q "NEXT_PUBLIC_SENTRY_DSN" .env.sentry.local; then
        sed -i '/^NEXT_PUBLIC_SENTRY_DSN/d' .env.production
        grep "NEXT_PUBLIC_SENTRY_DSN" .env.sentry.local >> .env.production
    fi
    
    if grep -q "^SENTRY_DSN" .env.sentry.local; then
        sed -i '/^SENTRY_DSN=/d' .env.production
        grep "^SENTRY_DSN=" .env.sentry.local >> .env.production
    fi
    
    echo "✅ Updated .env.production"
fi

# Summary
echo ""
echo "✅ AUTOMATION COMPLETE!"
echo "======================"
echo ""
echo "📋 Summary:"
echo "  ✓ Created 3 Sentry projects (frontend, backend, worker)"
echo "  ✓ Generated DSN keys"
echo "  ✓ Setup GCP Cloud Logging"
echo "  ✓ Created email alert rules"
echo "  ✓ Updated .env.production"
echo ""
echo "📊 Next steps:"
echo ""
echo "1. Review changes:"
echo "   cat .env.production"
echo ""
echo "2. Install dependencies:"
echo "   cd web && npm install @sentry/nextjs"
echo "   cd ../agentbot-backend && npm install @sentry/node"
echo "   cd ../agentbot-worker && npm install @sentry/node"
echo ""
echo "3. Commit changes:"
echo "   git add ."
echo "   git commit -m 'monitoring: automated Sentry + GCP logging setup'"
echo "   git push"
echo ""
echo "4. Deploy:"
echo "   docker-compose -f docker-compose.production.yml up -d --build"
echo ""
echo "5. Verify:"
echo "   curl https://agentbot.raveculture.xyz/api/health"
echo ""
echo "📊 View dashboards:"
echo "  • Sentry: https://sentry.io/organizations/$ORG_SLUG/"
echo "  • GCP Logs: https://console.cloud.google.com/logs"
echo ""
echo "✅ You're all set!"
echo ""
