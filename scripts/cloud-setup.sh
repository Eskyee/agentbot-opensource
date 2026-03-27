#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Setting up Agentbot development environment..."

# Install root dependencies if any
if [ -f "package.json" ]; then
  npm ci --silent || true
fi

# Install web dependencies
echo "📦 Installing web dependencies..."
cd web
npm ci --silent
npx prisma generate
cd ..

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd agentbot-backend
npm ci --silent
cd ..

# Verify installations
echo "✅ Verifying installations..."
cd web && npm run lint --silent || true

echo "🎉 Agentbot setup complete!"
