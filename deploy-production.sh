#!/bin/bash

# AgentBot Production Deployment Script
# Run this on your Google Cloud VM (startclaw-api-vm)
# Project: raveculture-youtube-api

set -e  # Exit on error

echo "=========================================="
echo "AgentBot Production Deployment"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: System Updates
echo -e "${YELLOW}Step 1: Updating system packages...${NC}"
sudo apt-get update
sudo apt-get upgrade -y

# Step 2: Install Docker (if not already installed)
echo -e "${YELLOW}Step 2: Checking Docker installation...${NC}"
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
fi

if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

echo -e "${GREEN}✓ Docker and Docker Compose ready${NC}"

# Step 3: Clone/Update Repository
echo -e "${YELLOW}Step 3: Cloning AgentBot repository...${NC}"
if [ -d "agentbot" ]; then
    cd agentbot
    git pull origin main
    cd ..
else
    git clone https://github.com/Eskyee/agentbot.git
fi

cd agentbot

# Step 4: Create Production Environment File
echo -e "${YELLOW}Step 4: Creating production environment file...${NC}"
cat > .env << 'EOF'
# Stripe Live Configuration
STRIPE_SECRET_KEY=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
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_51PKs3vDiHU0UF7aWN7hoWzcgczV6CHnY9FAffmfxroxEnJRaaMwNj2yu2jvpxX8UqPnHlyJo0Li4A8rOb5qePbXh00jZc8KEfB
STRIPE_WEBHOOK_SECRET=whsec_live_placeholder

# Stripe Price IDs - All 5 Plans
STRIPE_PRICE_STARTER=price_1T59bkDiHU0UF7aWOYKaifpc
STRIPE_PRICE_PRO=price_1T59hmDiHU0UF7aWnr74WQ6O
STRIPE_PRICE_SCALE=price_1T2RthDiHU0UF7aW9mobq19y
STRIPE_PRICE_ENTERPRISE=price_1T3SgXDiHU0UF7aW06D9eJEh
STRIPE_PRICE_WHITEGLOVE=price_1T3SiaDiHU0UF7aW9EehdNPj

# Frontend Configuration
NEXT_PUBLIC_APP_URL=https://agentbot.raveculture.xyz
NEXT_PUBLIC_API_URL=https://agentbot.raveculture.xyz

# Database (Docker PostgreSQL)
DATABASE_URL=postgresql://agentbot:agentbot123@postgres:5432/agentbot_db
POSTGRES_USER=agentbot
POSTGRES_PASSWORD=agentbot123
POSTGRES_DB=agentbot_db

# Redis (Docker)
REDIS_URL=redis://redis:6379

# Backend API
NODE_ENV=production
PORT=3001
BACKEND_API_URL=https://agentbot.raveculture.xyz
INTERNAL_API_KEY=generated_internal_key_abc123def456

# Google OAuth
GOOGLE_CLIENT_ID=Ov23liQlvehpNGMnLPy2
GOOGLE_CLIENT_SECRET=6852bb716e2aada5011122bfc13dec2251cc046f

# Authentication
NEXTAUTH_SECRET=generated_nextauth_secret_xyz789uvw123
NEXTAUTH_URL=https://agentbot.raveculture.xyz

# Email (Optional - Resend)
RESEND_API_KEY=re_YOUR_RESEND_KEY_HERE
RESEND_FROM=noreply@agentbot.raveculture.xyz

# Application Settings
PRIVATE_MODE=false
INVITE_REQUIRED=false
DATA_DIR=/opt/agentbot/data
EOF

echo -e "${GREEN}✓ .env file created${NC}"

# Step 5: Generate random secrets if needed
echo -e "${YELLOW}Step 5: Generating secure secrets...${NC}"
INTERNAL_API_KEY=$(openssl rand -hex 32)
NEXTAUTH_SECRET=$(openssl rand -hex 32)

# Update .env with generated secrets
sed -i "s/generated_internal_key_abc123def456/$INTERNAL_API_KEY/" .env
sed -i "s/generated_nextauth_secret_xyz789uvw123/$NEXTAUTH_SECRET/" .env

echo -e "${GREEN}✓ Secrets generated and configured${NC}"

# Step 6: Build and Start Docker Services
echo -e "${YELLOW}Step 6: Starting Docker services...${NC}"
docker-compose down 2>/dev/null || true
docker-compose up -d --build

echo -e "${GREEN}✓ Docker services started${NC}"

# Step 7: Wait for services to be ready
echo -e "${YELLOW}Step 7: Waiting for services to be ready...${NC}"
sleep 30

# Step 8: Run database migrations
echo -e "${YELLOW}Step 8: Running database migrations...${NC}"
docker exec agentbot-frontend sh -c "cd /app && npx prisma db push --skip-generate" || true

# Step 9: Generate Prisma client
echo -e "${YELLOW}Step 9: Generating Prisma client...${NC}"
docker exec agentbot-frontend sh -c "cd /app && npx prisma generate"

# Step 10: Verify services
echo -e "${YELLOW}Step 10: Verifying services...${NC}"
docker ps

# Step 11: Test endpoints
echo -e "${YELLOW}Step 11: Testing endpoints...${NC}"
sleep 5

echo -e "${YELLOW}Testing Frontend...${NC}"
curl -s http://localhost:3000 > /dev/null && echo -e "${GREEN}✓ Frontend responding${NC}" || echo -e "${RED}✗ Frontend not responding${NC}"

echo -e "${YELLOW}Testing Backend...${NC}"
curl -s http://localhost:3001/health > /dev/null && echo -e "${GREEN}✓ Backend responding${NC}" || echo -e "${RED}✗ Backend not responding${NC}"

# Step 12: Setup Webhook in Stripe
echo -e "${YELLOW}Step 12: Stripe Webhook Setup${NC}"
echo "You need to configure the webhook in Stripe:"
echo "1. Go to https://dashboard.stripe.com/webhooks"
echo "2. Click 'Add endpoint'"
echo "3. Endpoint URL: https://agentbot.raveculture.xyz/api/stripe/webhook"
echo "4. Select events: checkout.session.completed, customer.subscription.*, invoice.payment_*"
echo "5. Copy the signing secret and run:"
echo "   docker exec agentbot-frontend sh -c 'sed -i \"s|whsec_live_placeholder|YOUR_WEBHOOK_SECRET|\" /app/.env'"
echo "6. Restart: docker-compose restart"

echo ""
echo -e "${GREEN}=========================================="
echo "✓ AgentBot Deployment Complete!"
echo "==========================================${NC}"
echo ""
echo "Services running on:"
echo "  Frontend: http://localhost:3000"
echo "  Backend: http://localhost:3001"
echo "  Database: PostgreSQL on localhost:5432"
echo "  Redis: localhost:6379"
echo ""
echo "Production URL: https://agentbot.raveculture.xyz"
echo ""
echo "Next steps:"
echo "1. Update Stripe webhook endpoint (see Step 12 above)"
echo "2. Test payment flow at https://agentbot.raveculture.xyz/pricing"
echo "3. Monitor logs: docker logs -f agentbot-frontend"
echo ""
echo -e "${YELLOW}Generated Secrets:${NC}"
echo "INTERNAL_API_KEY: $INTERNAL_API_KEY"
echo "NEXTAUTH_SECRET: $NEXTAUTH_SECRET"
echo ""
echo "Save these in a secure location!"
