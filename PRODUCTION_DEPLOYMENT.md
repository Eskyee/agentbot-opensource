# Production Deployment with Secure Secrets

## Prerequisites
- GCP VM with Docker installed
- Repository cloned to ~/agentbot
- All secrets prepared

## Step 1: Create Secrets Directory

```bash
cd ~/agentbot
mkdir -p secrets
```

## Step 2: Add Secrets (One Secret Per File)

```bash
# Database password
echo "your_secure_db_password_32_chars_min" > secrets/db_password.txt

# Stripe keys (from Stripe dashboard)
echo "sk_live_YOUR_ACTUAL_SECRET_KEY" > secrets/stripe_secret_key.txt
echo "pk_live_YOUR_ACTUAL_PUBLIC_KEY" > secrets/stripe_public_key.txt

# Internal API key (generate random)
openssl rand -base64 32 > secrets/internal_api_key.txt

# NextAuth secret (generate random)
openssl rand -base64 32 > secrets/nextauth_secret.txt

# Verify files created
ls -la secrets/
chmod 600 secrets/*.txt
```

## Step 3: Update .env.production

```bash
# Edit with actual values (non-secret only)
nano .env.production

# Required changes:
# - RESEND_API_KEY=re_YOUR_KEY
# - STRIPE_WEBHOOK_SECRET=whsec_YOUR_KEY
# - POSTGRES_PASSWORD stays empty (loaded from secret)
```

## Step 4: Deploy Production

```bash
cd ~/agentbot

# Pull latest code
git pull

# Deploy with production compose and secrets
docker-compose -f docker-compose.production.yml up -d --build

# Wait for build (~3 minutes)
sleep 180

# Verify all services running
docker ps

# Check health
curl https://agentbot.raveculture.xyz/api/health
```

## Step 5: Verify Secrets

```bash
# Test database connection
docker exec agentbot-postgres psql -U agentbot -d agentbot_db -c "SELECT 1;"

# Check frontend can access config
docker exec agentbot-frontend env | head -20

# View logs
docker logs agentbot-frontend --tail 50
```

## Security Checklist

- [ ] Secrets created with proper permissions (600)
- [ ] No secrets in git history
- [ ] .env.production doesn't contain sensitive values
- [ ] docker-compose.production.yml uses secrets mounts
- [ ] All containers passing health checks
- [ ] Stripe webhook endpoint registered
- [ ] Database password strong (32+ chars, mixed)
- [ ] API keys rotated regularly

## Monitoring

```bash
# Real-time logs
docker logs -f agentbot-frontend

# Health status
docker ps --format "table {{.Names}}\t{{.Status}}"

# Database size
docker exec agentbot-postgres psql -U agentbot -d agentbot_db -c "SELECT pg_database_size('agentbot_db');"

# Redis usage
docker exec agentbot-redis redis-cli INFO memory
```

## Updating Secrets

To update a secret without downtime:

```bash
# Edit the secret file
nano secrets/db_password.txt

# Restart affected service
docker-compose -f docker-compose.production.yml restart postgres frontend api worker
```

## Backup

```bash
# Backup database
docker exec agentbot-postgres pg_dump -U agentbot agentbot_db > backup-$(date +%Y%m%d).sql

# Backup secrets (store in secure location, NOT in git)
tar -czf secrets-backup-$(date +%Y%m%d).tar.gz secrets/
```

## Troubleshooting

**Cannot connect to database:**
```bash
docker exec agentbot-postgres pg_isready -U agentbot
```

**Secret not loading:**
```bash
docker logs agentbot-frontend | grep -i secret
```

**Build fails:**
```bash
docker system prune -a --volumes -f
docker-compose -f docker-compose.production.yml up -d --build
```
