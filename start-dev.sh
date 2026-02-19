#!/bin/bash
# StartClaw Development Environment Setup

echo "🦞 Starting StartClaw development environment..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if .env exists, if not copy from .env.local
if [ ! -f .env ]; then
    echo "📝 Creating .env from .env.local..."
    cp .env.local .env
fi

# Start services
echo "🚀 Starting all services..."
docker compose up -d

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo ""
echo "🔍 Checking service health..."

if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ API is healthy (http://localhost:3001)"
else
    echo "⚠️  API not responding yet"
fi

if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is healthy (http://localhost:3000)"
else
    echo "⚠️  Frontend not responding yet"
fi

echo ""
echo "🎉 StartClaw is starting up!"
echo ""
echo "📍 Services:"
echo "   Frontend:   http://localhost:3000"
echo "   API:        http://localhost:3001"
echo "   Health:     http://localhost:3001/health"
echo ""
echo "Note: Nginx routing requires /etc/hosts configuration:"
echo "   Add: 127.0.0.1 startclaw.localhost"
echo "   Then visit: http://startclaw.localhost"
echo ""
echo "📝 View logs: docker compose logs -f"
echo "🛑 Stop:      docker compose down"
echo ""
echo "📖 See ARCHITECTURE.md for more information"
