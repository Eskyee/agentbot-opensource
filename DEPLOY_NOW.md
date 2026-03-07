# Deploy to Production - Quick Steps

**Server:** startclaw-api-vm (raveculture-youtube-api)  
**Domain:** https://agentbot.raveculture.xyz

---

## Option 1: Automated Deployment (Recommended)

### Step 1: SSH into your Google Cloud VM

```bash
gcloud compute ssh startclaw-api-vm --zone=us-central1-a --project=raveculture-youtube-api
```

Or use SSH key directly:
```bash
ssh -i ~/.ssh/YOUR_KEY ubuntu@YOUR_SERVER_IP
```

### Step 2: Download and Run Deployment Script

```bash
cd ~
git clone https://github.com/Eskyee/agentbot.git
cd agentbot
chmod +x deploy-production.sh
./deploy-production.sh
```

The script will:
- ✅ Install Docker & Docker Compose
- ✅ Clone the latest code
- ✅ Create production .env with Stripe live keys
- ✅ Generate secure secrets
- ✅ Start all services (Frontend, Backend, PostgreSQL, Redis)
- ✅ Run database migrations
- ✅ Verify all services are running
- ✅ Test endpoints

### Step 3: Configure Stripe Webhook

After deployment completes, follow the instructions to:
1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://agentbot.raveculture.xyz/api/stripe/webhook`
3. Subscribe to: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*`
4. Copy webhook secret and update it in production

---

## Option 2: Manual Deployment

If you prefer to run commands manually:

```bash
# SSH into server
gcloud compute ssh startclaw-api-vm --zone=us-central1-a --project=raveculture-youtube-api

# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Clone repo
git clone https://github.com/Eskyee/agentbot.git
cd agentbot

# Create .env with Stripe live keys (copy from deploy script)
nano .env

# Start services
docker-compose up -d --build

# Wait for services
sleep 30

# Run migrations
docker exec agentbot-frontend sh -c "cd /app && npx prisma db push"

# Generate Prisma
docker exec agentbot-frontend sh -c "cd /app && npx prisma generate"

# Verify
docker ps
docker logs agentbot-frontend
```

---

## Post-Deployment Verification

### Check Services Running
```bash
docker ps
```

You should see:
- ✅ agentbot-frontend (port 3000)
- ✅ agentbot-api (port 3001)
- ✅ agentbot-postgres (port 5432)
- ✅ agentbot-redis (port 6379)
- ✅ agentbot-worker
- ✅ agentbot-nginx (port 80/443)

### Check Frontend
```bash
curl http://localhost:3000
```

### Check Backend
```bash
curl http://localhost:3001/health
```

### View Logs
```bash
docker logs -f agentbot-frontend
docker logs -f agentbot-api
```

---

## Test Live Payment

1. Visit: https://agentbot.raveculture.xyz/pricing
2. Click "Get Started" on any plan
3. Use test card (or real card - Stripe will charge):
   - Card: 4242 4242 4242 4242
   - Expiry: 12/26 (any future date)
   - CVC: 567 (any 3 digits)
4. Verify:
   - ✓ Success page displays
   - ✓ Database has user record
   - ✓ Webhook received in Stripe dashboard
   - ✓ Agent deployed

---

## Stripe Webhook Configuration

**Endpoint URL:**
```
https://agentbot.raveculture.xyz/api/stripe/webhook
```

**Events to subscribe to:**
```
- checkout.session.completed
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_succeeded
- invoice.payment_failed
```

**After setup:**
1. Copy the Signing Secret (whsec_...)
2. Update .env on server:
   ```bash
   docker exec agentbot-frontend sh -c 'sed -i "s|whsec_live_placeholder|YOUR_SECRET|" /app/.env'
   ```
3. Restart services:
   ```bash
   docker-compose restart
   ```

---

## Troubleshooting

### Container fails to start
```bash
docker logs CONTAINER_NAME
docker-compose logs
```

### Database connection error
```bash
# Check if postgres is running
docker exec agentbot-postgres psql -U agentbot -d agentbot_db -c "SELECT 1;"

# Check DATABASE_URL in .env
cat .env | grep DATABASE_URL
```

### Webhook not working
```bash
# Check webhook logs in Stripe dashboard
# Also check backend logs:
docker logs agentbot-api -f

# Test webhook manually:
curl -X POST http://localhost:3000/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -H "stripe-signature: test" \
  -d '{"type":"test"}'
```

### Services not starting
```bash
# Remove old volumes
docker-compose down -v

# Rebuild
docker-compose up -d --build

# Check logs
docker-compose logs -f
```

---

## Production Checklist

- [ ] Deployment script executed successfully
- [ ] All Docker services running (`docker ps`)
- [ ] Frontend accessible at https://agentbot.raveculture.xyz
- [ ] Backend health check passing
- [ ] Database migrations completed
- [ ] Prisma client generated
- [ ] Stripe live keys configured
- [ ] Webhook endpoint created in Stripe
- [ ] Webhook secret updated in .env
- [ ] Test payment processed successfully
- [ ] User created in database
- [ ] AI agent deployed
- [ ] Email receipt received (if provider configured)

---

## Support

**Issues?** Check:
1. Docker logs: `docker logs CONTAINER_NAME`
2. Service status: `docker ps`
3. Stripe dashboard for webhook logs
4. Browser console (F12) for frontend errors

**Need help?** Run deployment script again and check output carefully for error messages.

---

## Summary

**Time to Production:** ~15-20 minutes (automated script)

**Your system is now live with:**
- ✅ Stripe payment processing
- ✅ 5 subscription tiers
- ✅ Automatic agent deployment
- ✅ Payment notifications
- ✅ User dashboard

🎉 **AgentBot is LIVE!**
