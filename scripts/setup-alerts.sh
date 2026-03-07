#!/bin/bash

# Automated Email Alert Setup
# Creates email notification channels and alert rules in Sentry

set -e

SENTRY_TOKEN=${1:-}
ORG_SLUG=${2:-}
EMAIL=${3:-}

if [ -z "$SENTRY_TOKEN" ] || [ -z "$ORG_SLUG" ] || [ -z "$EMAIL" ]; then
    echo "Usage: ./setup-alerts.sh YOUR_SENTRY_TOKEN YOUR_ORG_SLUG YOUR_EMAIL"
    echo ""
    exit 1
fi

SENTRY_API="https://sentry.io/api/0"

echo "📧 Setting up email alerts in Sentry..."
echo "Organization: $ORG_SLUG"
echo "Email: $EMAIL"
echo ""

# Get all projects
echo "🔍 Finding projects..."
PROJECTS=$(curl -s "$SENTRY_API/organizations/$ORG_SLUG/projects/" \
  -H "Authorization: Bearer $SENTRY_TOKEN" | jq -r '.[] | select(.name | contains("agentbot")) | .id')

if [ -z "$PROJECTS" ]; then
    echo "❌ No agentbot projects found"
    exit 1
fi

echo "Found projects:"
echo "$PROJECTS"
echo ""

# Create alert rule for each project
for PROJECT_ID in $PROJECTS; do
    echo "⚙️  Setting up alerts for project: $PROJECT_ID"
    
    # Alert: New error type
    curl -s -X POST "$SENTRY_API/organizations/$ORG_SLUG/rules/" \
      -H "Authorization: Bearer $SENTRY_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "name": "New Error - Notify Email",
        "conditions": [
          {
            "id": "sentry.rules.conditions.first_seen_event"
          }
        ],
        "actions": [
          {
            "id": "sentry.mail.actions.NotifyEmailAction",
            "email": "'$EMAIL'"
          }
        ],
        "actionMatch": "any",
        "frequency": 30,
        "projects": ["'$PROJECT_ID'"]
      }' > /dev/null && echo "✅ Alert 1: New error created"
    
    # Alert: Error rate spike
    curl -s -X POST "$SENTRY_API/organizations/$ORG_SLUG/rules/" \
      -H "Authorization: Bearer $SENTRY_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "name": "Error Rate Spike - Notify Email",
        "conditions": [
          {
            "id": "sentry.rules.conditions.event_frequency",
            "value": 100,
            "match": "gt",
            "interval": "1h"
          }
        ],
        "actions": [
          {
            "id": "sentry.mail.actions.NotifyEmailAction",
            "email": "'$EMAIL'"
          }
        ],
        "actionMatch": "any",
        "frequency": 300,
        "projects": ["'$PROJECT_ID'"]
      }' > /dev/null && echo "✅ Alert 2: Error rate spike created"
    
    # Alert: Regression
    curl -s -X POST "$SENTRY_API/organizations/$ORG_SLUG/rules/" \
      -H "Authorization: Bearer $SENTRY_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "name": "Issue Regression - Notify Email",
        "conditions": [
          {
            "id": "sentry.rules.conditions.regression_event"
          }
        ],
        "actions": [
          {
            "id": "sentry.mail.actions.NotifyEmailAction",
            "email": "'$EMAIL'"
          }
        ],
        "actionMatch": "any",
        "frequency": 30,
        "projects": ["'$PROJECT_ID'"]
      }' > /dev/null && echo "✅ Alert 3: Regression created"
    
    echo ""
done

echo "✅ Email alerts setup complete!"
echo ""
echo "🔗 Manage alerts at:"
echo "   https://sentry.io/organizations/$ORG_SLUG/alerts/rules/"
echo ""
echo "📧 You will receive emails for:"
echo "   • New error types"
echo "   • Error rate spikes"
echo "   • Issue regressions"
echo ""
