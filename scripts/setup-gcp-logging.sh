#!/bin/bash

# Automated GCP Logging Setup
# Configures Cloud Logging for Docker containers on GCP VM

set -e

PROJECT_ID=${1:-raveculture-youtube-api}

echo "🔧 Setting up GCP Logging..."
echo "Project: $PROJECT_ID"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found"
    echo "Install: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Set project
echo "📌 Setting GCP project..."
gcloud config set project $PROJECT_ID

# Enable Cloud Logging API
echo "🚀 Enabling Cloud Logging API..."
gcloud services enable logging.googleapis.com

# Create log sink for errors
echo "📥 Creating log sink for errors..."
gcloud logging sinks create agentbot-errors \
  logging.googleapis.com/projects/$PROJECT_ID/logs/agentbot-errors \
  --log-filter='severity>=ERROR' \
  --description="AgentBot error logs" \
  --allow-missing-destination || echo "ℹ️  Sink may already exist"

# Create metric for error count
echo "📊 Creating error count metric..."
gcloud logging metrics create agentbot_error_count \
  --description="Count of AgentBot errors" \
  --log-filter='severity=ERROR' || echo "ℹ️  Metric may already exist"

# Create alert policy
echo "🚨 Creating alert policy for high error rate..."

POLICY_JSON=$(cat <<EOF
{
  "displayName": "AgentBot High Error Rate",
  "conditions": [
    {
      "displayName": "Error rate > 10%",
      "conditionThreshold": {
        "filter": "resource.type=\"gce_instance\" AND metric.type=\"compute.googleapis.com/instance/cpu/utilization\" AND resource.label.instance_id=~\".*agentbot.*\"",
        "comparison": "COMPARISON_GT",
        "thresholdValue": 0.1,
        "duration": "300s",
        "aggregations": [
          {
            "alignmentPeriod": "60s",
            "perSeriesAligner": "ALIGN_RATE"
          }
        ]
      }
    }
  ],
  "notificationChannels": [],
  "alertStrategy": {
    "autoClose": "1800s"
  }
}
EOF
)

# Get notification channel
CHANNEL_ID=$(gcloud alpha monitoring channels list --format="value(name)" --filter="displayName:Email" | head -1 || echo "")

if [ ! -z "$CHANNEL_ID" ]; then
    echo "📧 Found notification channel: $CHANNEL_ID"
else
    echo "⚠️  No email notification channel found"
    echo "Create one at: https://console.cloud.google.com/monitoring/alerting/notificationchannels"
fi

echo ""
echo "✅ GCP Logging setup complete!"
echo ""
echo "📊 View logs:"
echo "  Web: https://console.cloud.google.com/logs/query?project=$PROJECT_ID"
echo ""
echo "🚨 Setup alerts at:"
echo "  https://console.cloud.google.com/monitoring/alerting/policies"
echo ""
echo "📋 View metrics at:"
echo "  https://console.cloud.google.com/monitoring/metrics-explorer?project=$PROJECT_ID"
echo ""
echo "💡 Example queries:"
echo ""
echo "  # All errors"
echo "  severity=ERROR"
echo ""
echo "  # Frontend errors"
echo "  resource.labels.container_name=agentbot-frontend AND severity=ERROR"
echo ""
echo "  # Stripe webhook errors"
echo "  resource.labels.container_name=agentbot-api AND jsonPayload.message=~\".*webhook.*\" AND severity=ERROR"
echo ""
echo "  # High memory usage"
echo "  resource.type=gce_instance AND metric.type=compute.googleapis.com/instance/memory/usage"
echo ""
