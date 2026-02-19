# StartClaw Deployment Guide

This guide covers deploying StartClaw in production.

## Architecture Overview

StartClaw consists of:
- **Frontend**: Next.js app (deployed on Vercel)
- **Backend API**: Express.js service (Docker)
- **Worker**: Bull queue processor (Docker)
- **Database**: PostgreSQL (managed service)
- **Cache**: Redis (managed service)
- **Proxy**: Nginx/Caddy (on your server)

## Prerequisites

- Domain name (e.g., startclaw.com)
- Server with Docker installed (2GB+ RAM)
- GitHub account
- Vercel account
- PostgreSQL database (AWS RDS, DigitalOcean, etc.)
- Redis instance (AWS ElastiCache, Redis Cloud, etc.)

## Step 1: Database Setup

### PostgreSQL

1. **Create database** on your preferred provider
2. **Run init script**:
```sql
-- Execute init-db.sql
-- This creates tables for users, agents, deployments, etc.
```
3. **Note connection string**:
```
postgres://user:password@host:5432/startclaw_db
```

### Redis

1. **Create Redis instance** on your preferred provider
2. **Note connection string**:
```
redis://host:6379
```

## Step 2: Backend & Worker Deployment

### Option A: Docker Compose (Single Server)

1. **SSH to your server**
```bash
ssh user@your-server.com
```

2. **Clone repository**
```bash
git clone https://github.com/Eskyee/startclaw.git
cd startclaw
```

3. **Create production environment file**
```bash
cp .env.production .env
nano .env
```

4. **Update environment variables**
```env
NEXT_PUBLIC_API_URL=https://api.startclaw.com
DATABASE_URL=postgres://user:pass@your-db-host:5432/startclaw_db
REDIS_URL=redis://your-redis-host:6379
INTERNAL_API_KEY=your-secure-random-key-here
ALLOWED_ORIGINS=https://startclaw.com,https://www.startclaw.com
```

5. **Start services**
```bash
docker compose -f docker-compose.yml up -d api worker
```

6. **Verify services**
```bash
docker compose ps
docker compose logs api
docker compose logs worker
curl http://localhost:3001/health
```

### Option B: Separate Containers

**Backend API:**
```bash
docker build -t startclaw-api ./agentbot-backend
docker run -d \
  --name startclaw-api \
  -p 3001:3001 \
  --env-file .env \
  --restart unless-stopped \
  startclaw-api
```

**Worker:**
```bash
docker build -t startclaw-worker ./agentbot-worker
docker run -d \
  --name startclaw-worker \
  --env-file .env \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --restart unless-stopped \
  startclaw-worker
```

## Step 3: Reverse Proxy Setup

### Option A: Caddy (Recommended - Auto SSL)

1. **Install Caddy**
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

2. **Create Caddyfile**
```bash
sudo nano /etc/caddy/Caddyfile
```

```
# API domain
api.startclaw.com {
    reverse_proxy localhost:3001
}

# Wildcard for agents
*.agents.startclaw.com {
    reverse_proxy localhost:18789
}
```

3. **Reload Caddy**
```bash
sudo systemctl reload caddy
```

### Option B: Nginx with Certbot

1. **Install Nginx and Certbot**
```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

2. **Configure Nginx**
```bash
sudo nano /etc/nginx/sites-available/startclaw
```

```nginx
# API
server {
    listen 80;
    server_name api.startclaw.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Wildcard for agents
server {
    listen 80;
    server_name *.agents.startclaw.com;

    location / {
        proxy_pass http://localhost:18789;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

3. **Enable site and get SSL**
```bash
sudo ln -s /etc/nginx/sites-available/startclaw /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d api.startclaw.com
```

## Step 4: DNS Configuration

Configure DNS records for your domain:

### A Records
```
api.startclaw.com         A     YOUR_SERVER_IP
*.agents.startclaw.com    A     YOUR_SERVER_IP
```

### CNAME Record (for Vercel)
```
startclaw.com            CNAME  cname.vercel-dns.com
www.startclaw.com        CNAME  cname.vercel-dns.com
```

**Wait 5-10 minutes** for DNS propagation.

## Step 5: Frontend Deployment (Vercel)

1. **Push code to GitHub**
```bash
git push origin main
```

2. **Import to Vercel**
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - Select the `web` directory as root

3. **Configure Environment Variables**
```
NEXT_PUBLIC_API_URL=https://api.startclaw.com
NEXT_PUBLIC_AGENTS_DOMAIN=agents.startclaw.com
INTERNAL_API_KEY=your-secure-random-key-here
```

4. **Deploy**
   - Vercel will auto-deploy
   - Add custom domain: startclaw.com

5. **Verify Deployment**
   - Visit https://startclaw.com
   - Should see homepage
   - API calls should work

## Step 6: Verification

Test all services:

```bash
# Frontend
curl https://startclaw.com

# API health
curl https://api.startclaw.com/health

# API agents endpoint
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://api.startclaw.com/api/agents

# Check Docker services
docker ps
docker logs startclaw-api
docker logs startclaw-worker
```

## Step 7: Monitoring

### Health Checks

Set up monitoring for:
- https://api.startclaw.com/health
- https://startclaw.com/api/health

### Logs

```bash
# API logs
docker logs -f startclaw-api

# Worker logs
docker logs -f startclaw-worker

# Nginx/Caddy logs
sudo journalctl -u caddy -f
sudo journalctl -u nginx -f
```

### Resource Monitoring

```bash
# Container stats
docker stats

# Server resources
htop
df -h
free -m
```

## Maintenance

### Updating Services

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker compose build api worker
docker compose up -d api worker
```

### Database Backups

```bash
# Backup PostgreSQL
docker compose exec postgres pg_dump -U startclaw startclaw_db | gzip > backup-$(date +%Y%m%d).sql.gz

# Restore
gunzip < backup.sql.gz | docker compose exec -T postgres psql -U startclaw startclaw_db
```

### Logs Rotation

Configure logrotate for Docker logs:

```bash
sudo nano /etc/logrotate.d/docker-containers
```

```
/var/lib/docker/containers/*/*.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
    copytruncate
}
```

## Scaling

### Horizontal Scaling

Run multiple API instances behind a load balancer:

```bash
docker compose up -d --scale api=3
```

### Database Scaling

Use read replicas for PostgreSQL:
- Master for writes
- Replicas for reads

### Worker Scaling

Add more worker instances:

```bash
docker compose up -d --scale worker=3
```

## Troubleshooting

### API not responding
```bash
docker logs startclaw-api
docker restart startclaw-api
curl http://localhost:3001/health
```

### Worker not processing jobs
```bash
docker logs startclaw-worker
docker restart startclaw-worker
# Check Redis connection
redis-cli -h your-redis-host ping
```

### Database connection errors
```bash
# Test connection
psql "postgres://user:pass@host:5432/startclaw_db"
# Check firewall rules
# Verify DATABASE_URL in .env
```

### SSL certificate issues
```bash
# Renew certificate
sudo certbot renew
sudo systemctl reload caddy
```

## Security Checklist

- [ ] Change default API keys in .env.production
- [ ] Use strong database passwords
- [ ] Enable database SSL connections
- [ ] Configure firewall (allow 80, 443, 22 only)
- [ ] Set up fail2ban for SSH
- [ ] Enable automatic security updates
- [ ] Regular backups (daily minimum)
- [ ] Monitor logs for suspicious activity
- [ ] Use secrets management (AWS Secrets Manager, etc.)
- [ ] Implement rate limiting on API

## Cost Estimates

**Monthly Costs:**
- Vercel (Frontend): Free - $20
- Digital Ocean Droplet (4GB): $24
- Managed PostgreSQL: $15 - $50
- Redis Cloud: Free - $10
- Domain: $12/year
- **Total**: ~$50-100/month

## Support

- Documentation: [ARCHITECTURE.md](ARCHITECTURE.md)
- Quick Reference: [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
- Issues: https://github.com/Eskyee/startclaw/issues
