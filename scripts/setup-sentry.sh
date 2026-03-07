#!/bin/bash

# Automated Sentry Setup Script
# Creates Sentry projects and generates DSN keys
# Usage: ./setup-sentry.sh YOUR_SENTRY_AUTH_TOKEN YOUR_ORG_SLUG

set -e

SENTRY_TOKEN=${1:-}
ORG_SLUG=${2:-}
PROJECT_PREFIX="agentbot"

if [ -z "$SENTRY_TOKEN" ] || [ -z "$ORG_SLUG" ]; then
    echo "Usage: ./setup-sentry.sh YOUR_SENTRY_AUTH_TOKEN YOUR_ORG_SLUG"
    echo ""
    echo "Steps:"
    echo "1. Go to https://sentry.io/account/api/auth-tokens/"
    echo "2. Create new token with 'project:write' and 'org:read' scopes"
    echo "3. Copy the token"
    echo "4. Get your org slug from https://sentry.io/settings/ (URL path)"
    echo ""
    exit 1
fi

SENTRY_API="https://sentry.io/api/0"
HEADERS="-H 'Authorization: Bearer $SENTRY_TOKEN' -H 'Content-Type: application/json'"

echo "🔧 Setting up Sentry projects..."
echo "Organization: $ORG_SLUG"
echo ""

# Create Frontend Project
echo "📱 Creating Frontend project..."
FRONTEND_RESPONSE=$(curl -s -X POST "$SENTRY_API/organizations/$ORG_SLUG/projects/" \
  -H "Authorization: Bearer $SENTRY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "'$PROJECT_PREFIX'-frontend",
    "slug": "'$PROJECT_PREFIX'-frontend",
    "platform": "javascript-nextjs",
    "defaultTeam": true
  }')

FRONTEND_PROJECT_ID=$(echo "$FRONTEND_RESPONSE" | jq -r '.id // empty')
if [ -z "$FRONTEND_PROJECT_ID" ]; then
    echo "❌ Failed to create frontend project"
    echo "$FRONTEND_RESPONSE" | jq .
    exit 1
fi
echo "✅ Frontend project created: $FRONTEND_PROJECT_ID"

# Create Backend Project
echo "🔙 Creating Backend API project..."
BACKEND_RESPONSE=$(curl -s -X POST "$SENTRY_API/organizations/$ORG_SLUG/projects/" \
  -H "Authorization: Bearer $SENTRY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "'$PROJECT_PREFIX'-backend",
    "slug": "'$PROJECT_PREFIX'-backend",
    "platform": "node-express",
    "defaultTeam": true
  }')

BACKEND_PROJECT_ID=$(echo "$BACKEND_RESPONSE" | jq -r '.id // empty')
if [ -z "$BACKEND_PROJECT_ID" ]; then
    echo "❌ Failed to create backend project"
    echo "$BACKEND_RESPONSE" | jq .
    exit 1
fi
echo "✅ Backend project created: $BACKEND_PROJECT_ID"

# Create Worker Project
echo "⚙️ Creating Worker project..."
WORKER_RESPONSE=$(curl -s -X POST "$SENTRY_API/organizations/$ORG_SLUG/projects/" \
  -H "Authorization: Bearer $SENTRY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "'$PROJECT_PREFIX'-worker",
    "slug": "'$PROJECT_PREFIX'-worker",
    "platform": "node",
    "defaultTeam": true
  }')

WORKER_PROJECT_ID=$(echo "$WORKER_RESPONSE" | jq -r '.id // empty')
if [ -z "$WORKER_PROJECT_ID" ]; then
    echo "❌ Failed to create worker project"
    echo "$WORKER_RESPONSE" | jq .
    exit 1
fi
echo "✅ Worker project created: $WORKER_PROJECT_ID"

echo ""
echo "🔑 Retrieving DSN keys..."

# Get Frontend DSN
FRONTEND_DSN=$(curl -s "$SENTRY_API/organizations/$ORG_SLUG/projects/$FRONTEND_PROJECT_ID/" \
  -H "Authorization: Bearer $SENTRY_TOKEN" | jq -r '.keys[0].dsn.public')

# Get Backend DSN
BACKEND_DSN=$(curl -s "$SENTRY_API/organizations/$ORG_SLUG/projects/$BACKEND_PROJECT_ID/" \
  -H "Authorization: Bearer $SENTRY_TOKEN" | jq -r '.keys[0].dsn.secret')

# Get Worker DSN
WORKER_DSN=$(curl -s "$SENTRY_API/organizations/$ORG_SLUG/projects/$WORKER_PROJECT_ID/" \
  -H "Authorization: Bearer $SENTRY_TOKEN" | jq -r '.keys[0].dsn.secret')

echo ""
echo "✅ Setup Complete!"
echo ""
echo "📋 Add these to your .env.production:"
echo ""
echo "# Frontend"
echo "NEXT_PUBLIC_SENTRY_DSN=$FRONTEND_DSN"
echo ""
echo "# Backend"
echo "SENTRY_DSN=$BACKEND_DSN"
echo ""
echo "# Worker"
echo "SENTRY_WORKER_DSN=$WORKER_DSN"
echo ""
echo "🔗 Manage projects at: https://sentry.io/organizations/$ORG_SLUG/projects/"
echo ""

# Save to file
OUTPUT_FILE=".env.sentry.local"
cat > "$OUTPUT_FILE" << EOF
# Auto-generated Sentry DSN keys
# Generated: $(date)

NEXT_PUBLIC_SENTRY_DSN=$FRONTEND_DSN
SENTRY_DSN=$BACKEND_DSN
SENTRY_WORKER_DSN=$WORKER_DSN
EOF

echo "💾 Saved to $OUTPUT_FILE"
echo ""
echo "⚠️  Next steps:"
echo "1. Review .env.sentry.local"
echo "2. Copy DSN values to .env.production"
echo "3. Setup email alerts in Sentry: https://sentry.io/organizations/$ORG_SLUG/alerts/"
echo "4. Commit & deploy"
