# Agentbot Infrastructure Setup

This guide walks through setting up the Agentbot infrastructure from scratch.

## Prerequisites

- GCP account with billing enabled (or $300 free credits)
- Domain name (agentbot.com or similar)
- Telegram bot token (from @BotFather)
- Basic familiarity with terminal

---

## Phase 1: VM Setup (~30 min)

### Step 1: Create GCP VM

```bash
# Using gcloud CLI
gcloud compute instances create agentbot-main \
  --zone=asia-south1-a \
  --machine-type=e2-medium \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=50GB \
  --tags=http-server,https-server

# Create firewall rules
gcloud compute firewall-rules create allow-http \
  --allow tcp:80 --target-tags http-server
gcloud compute firewall-rules create allow-https \
  --allow tcp:443 --target-tags https-server
```

Or via Console:
1. Go to Compute Engine → VM instances
2. Create instance
3. Name: `agentbot-main`
4. Region: `asia-south1` (Mumbai)
5. Machine type: `e2-medium` (4GB RAM, 2 vCPU)
6. Boot disk: Ubuntu 22.04 LTS, 50GB SSD
7. Firewall: Allow HTTP and HTTPS

**Cost:** ~$12/month (₹1,000)

### Step 2: Configure DNS

In your domain registrar (Cloudflare/GoDaddy/Namecheap):

```
A record: agentbot.com → [VM's external IP]
A record: *.agentbot.com → [VM's external IP]
```

The wildcard allows us to create `user123.agentbot.com` automatically.

### Step 3: SSH into VM

```bash
gcloud compute ssh agentbot-main --zone=asia-south1-a
```

### Step 4: Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Log out and back in for group changes
exit
# SSH back in

# Verify
docker --version
```

### Step 5: Install Caddy

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

### Step 6: Configure Caddy

```bash
sudo nano /etc/caddy/Caddyfile
```

Initial config:
```
agentbot.com {
    reverse_proxy localhost:3000
}

# User subdomains will be added dynamically
# Example:
# user123.agentbot.com {
#     reverse_proxy localhost:18001
# }
```

Reload:
```bash
sudo systemctl reload caddy
```

---

## Phase 2: Deploy Your First Agent (~15 min)

### Step 7: Create Agent Container

```bash
# Pull OpenClaw image (check https://github.com/openclaw/containers for latest tag)
docker pull ghcr.io/openclaw/openclaw:2026.2.25

# Create volume for persistence
docker volume create openclaw-agent1

# Run container
docker run -d \
  --name agentbot-agent1 \
  --restart unless-stopped \
  -v openclaw-agent1:/home/node/.openclaw \
  -p 18789:18789 \
  --memory="512m" \
  --cpus="0.5" \
  ghcr.io/openclaw/openclaw:2026.2.25

# Check it's running
docker ps
```

### Step 8: Run Onboarding

```bash
docker exec -it agentbot-agent1 openclaw onboard
```

Follow prompts:
1. Select AI provider (Groq for free, or Anthropic)
2. Enter API key
3. Select messaging platforms (Telegram, iMessage)
4. For Telegram: Create bot via @BotFather, paste token
5. Enter your Telegram user ID (get via @userinfobot)
6. Complete onboarding

### Step 9: Configure Secure Messaging

After onboarding, edit the config to use allowlist mode (more secure):

```bash
docker exec agentbot-agent1 cat /home/node/.openclaw/openclaw.json > /tmp/openclaw.json
nano /tmp/openclaw.json
```

Set these security settings:

```json
{
  "channels": {
    "telegram": {
      "enabled": true,
      "dmPolicy": "allowlist",
      "allowFrom": [],
      "groupPolicy": "allowlist"
    },
    "imessage": {
      "enabled": true,
      "dmPolicy": "allowlist",
      "allowFrom": [YOUR_PHONE_NUMBER],
      "groupPolicy": "allowlist"
    }
  }
}
```

**Important:** Do NOT add `actions` key - this causes errors.

Copy back to the gateway config:
```bash
docker cp /tmp/openclaw.json agentbot-agent1:/home/node/.openclaw/openclaw.json
docker restart agentbot-agent1
```

### Step 10: Add Caddy Route

```bash
sudo nano /etc/caddy/Caddyfile
```

Add:
```
agent1.agentbot.com {
    reverse_proxy localhost:18789
}
```

Reload:
```bash
sudo systemctl reload caddy
```

### Step 11: Test

1. Open https://agent1.agentbot.com
2. Message your bot on Telegram
3. Should respond!

---

## Phase 3: Backend API Setup

### Install Node.js dependencies

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Clone or copy agentbot repo
cd ~
git clone https://github.com/your-repo/agentbot.git
cd agentbot

# Install dependencies
cd web && npm install && cd ..
cd agentbot-backend && npm install && cd ..
```

### Configure Environment

```bash
# Copy example env files
cp web/.env.local.example web/.env.local
cp agentbot-backend/.env.example agentbot-backend/.env
```

Edit `agentbot-backend/.env`:
```
# Generate a secure random string
# openssl rand -hex 32

DATABASE_URL=postgresql://user:pass@localhost:5432/agentbot
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-generated-secret
OPENCLAW_API_TOKEN=your-openclaw-token
DOCKER_HOST=unix:///var/run/docker.sock
```

### Set up PostgreSQL

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres psql
CREATE DATABASE agentbot;
CREATE USER agentbot WITH PASSWORD 'secure-password';
GRANT ALL PRIVILEGES ON DATABASE agentbot TO agentbot;
\q
```

### Set up Redis

```bash
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### Configure Docker Socket Access

```bash
# Add your user to docker group
sudo usermod -aG docker $USER

# Or for API access, enable TCP
sudo nano /etc/docker/daemon.json
# Add: {"hosts": ["unix:///var/run/docker.sock", "tcp://127.0.0.1:2375"]}
sudo systemctl restart docker
```

### Start Backend

```bash
cd agentbot-backend
npm run dev
```

### Start Frontend

```bash
cd web
npm run dev
```

---

## Phase 4: Backup Setup

### Create GCS bucket

```bash
# Install gsutil
sudo apt install -y google-cloud-cli

# Authenticate
gcloud auth login

# Create bucket
gsutil mb -l asia-south1 gs://agentbot-backups

# Set lifecycle (delete after 30 days)
cat > /tmp/lifecycle.json << 'EOF'
{
  "rule": [{
    "action": {"type": "Delete"},
    "condition": {"age": 30}
  }]
}
EOF
gsutil lifecycle set /tmp/lifecycle.json gs://agentbot-backups
```

### Setup backup script

```bash
sudo mkdir -p /opt/agentbot
sudo nano /opt/agentbot/backup.sh
```

Backup script example:
```bash
#!/bin/bash
DATE=$(date +%Y-%m-%d)
CONTAINERS=$(docker ps --format '{{.Names}}')

for container in $CONTAINERS; do
    docker exec $container tar czf - /home/node/.openclaw > /tmp/${container}-${DATE}.tar.gz
    gsutil cp /tmp/${container}-${DATE}.tar.gz gs://agentbot-backups/
    rm /tmp/${container}-${DATE}.tar.gz
done
```

```bash
sudo chmod +x /opt/agentbot/backup.sh

# Add to cron (runs daily at 3 AM)
echo "0 3 * * * /opt/agentbot/backup.sh" | sudo crontab -
```

---

## Phase 5: Production Checklist

Before going live:

- [ ] SSL certificates working (test with https://)
- [ ] Telegram bot responding to messages
- [ ] iMessage working (if configured)
- [ ] Backend API running and accessible
- [ ] Frontend dashboard at /dashboard
- [ ] Container stats showing in dashboard
- [ ] Health checks configured
- [ ] Backups running
- [ ] Logs being collected
- [ ] Domain pointing to correct IP

---

## Monitoring

### Container health check

```bash
# Check all containers
docker ps

# View logs
docker logs agentbot-agent1 --tail 100

# Check resource usage
docker stats
```

### Caddy status

```bash
sudo systemctl status caddy
sudo journalctl -u caddy -f
```

### Restore from backup

```bash
# List available backups
gsutil ls gs://agentbot-backups/

# Restore specific container
docker stop agentbot-agent1
gsutil cp gs://agentbot-backups/agentbot-agent1-2026-02-26.tar.gz /tmp/
docker cp /tmp/agentbot-agent1-2026-02-26.tar.gz agentbot-agent1:/home/node/.openclaw/
docker start agentbot-agent1
```

---

## Troubleshooting

### Container won't start
```bash
docker logs <container-name>
```

### SSL certificate issues
```bash
sudo journalctl -u caddy | grep -i error
```

### OpenClaw gateway errors
If you see "invalid key: actions" in logs, remove the `actions` key from gateway config. The gateway config does NOT support an `actions` key.

### Docker stats not working
Ensure Docker socket is mounted or Docker API is accessible:
```bash
docker version
curl -s http://localhost:2375/version
```

### Telegram bot not responding
1. Check bot token is correct
2. Ensure you've started a chat with the bot
3. Check allowlist includes your user ID
4. View logs: `docker logs agentbot-agent1 | grep -i telegram`

---

## Quick Reference

### Useful Docker Commands

```bash
# Start/Stop/Restart agent
docker start agentbot-agent1
docker stop agentbot-agent1
docker restart agentbot-agent1

# View logs
docker logs -f agentbot-agent1

# Access container shell
docker exec -it agentbot-agent1 sh

# Check resource usage
docker stats agentbot-agent1

# Update OpenClaw
docker pull ghcr.io/openclaw/openclaw:latest
docker stop agentbot-agent1
docker rm agentbot-agent1
# Run with new image (data persists in volume)
```

### Port Allocation

| Agent | Port | Domain |
|-------|------|--------|
| agent1 | 18789 | agent1.agentbot.com |
| agent2 | 18790 | agent2.agentbot.com |
| agent3 | 18791 | agent3.agentbot.com |
| ... | ... | ... |

### Security Settings

Always use `dmPolicy: "allowlist"`:
- **allowlist**: Only approved users can DM the agent
- **pairing**: Anyone can message, must opt-in (less secure)

### API Endpoints

- Dashboard: `http://localhost:3000/dashboard`
- Create agent: `POST /api/agents`
- Delete agent: `DELETE /api/agents/:id`
- Get stats: `GET /api/agents/:id/stats`
