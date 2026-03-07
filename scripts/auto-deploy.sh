#!/bin/bash
# Auto-deploy script for GCP VM

echo "🚀 Auto-deploying Agentbot..."

cd ~/agentbot

# Pull latest
echo "1. Pulling latest..."
git fetch origin
git pull --rebase

# Check if there were changes
if [ $? -eq 0 ]; then
    echo "✅ Pulled latest"
else
    echo "❌ Pull failed"
    exit 1
fi

# Rebuild Docker containers if needed
echo "2. Rebuilding containers..."
docker-compose down
docker-compose up -d --build

echo "✅ Deploy complete!"
docker ps --format "table {{.Names}}\t{{.Status}}"
