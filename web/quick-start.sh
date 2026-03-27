#!/bin/bash
# 🦞 Agentbot Quick Start
echo "🦞 Starting Agentbot Local Stack..."

cd "$(dirname "$0")"

# Start Docker services
docker compose up -d

# Wait for services
echo "⏳ Waiting for services to be healthy..."
sleep 8

# Health check
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Stack Status:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

curl -s http://localhost:3001/health > /dev/null 2>&1 && echo "  🟢 Backend:  http://localhost:3001" || echo "  🔴 Backend:  starting..."
curl -s http://localhost:3000 > /dev/null 2>&1 && echo "  🟢 Web:      http://localhost:3000" || echo "  🔴 Web:      starting..."
docker ps --format "{{.Names}}" | grep postgres > /dev/null && echo "  🟢 Postgres: localhost:5432" || echo "  🔴 Postgres: down"
docker ps --format "{{.Names}}" | grep redis > /dev/null && echo "  🟢 Redis:    localhost:6379" || echo "  🔴 Redis:    down"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  📋 Commands:"
echo "     make logs       → tail all logs"
echo "     make health     → check health"
echo "     make test       → quick load test"
echo "     make down       → stop everything"
echo ""
echo "  🎧 Let's go."
