# Agentbot Infrastructure Setup

This guide walks through setting up the Agentbot infrastructure from scratch.

## Prerequisites

- GCP account with billing enabled (or $300 free credits)
- Domain name (agentbot.com or similar)
- Basic familiarity with terminal

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

## Phase 2: Test Your Own Instance (~15 min)

### Step 7: Create test container

```bash
# Pull OpenClaw image
docker pull ghcr.io/openclaw/openclaw:latest

# Create volume for persistence
docker volume create openclaw-test

# Run container
docker run -d \
  --name openclaw-test \
  --restart unless-stopped \
  -v openclaw-test:/home/node/.openclaw \
  -p 18789:18789 \
  --memory="512m" \
  --cpus="0.5" \
  ghcr.io/openclaw/openclaw:latest
```

### Step 8: Run onboarding

```bash
docker exec -it openclaw-test openclaw onboard
```

Follow prompts:
1. Select AI provider (Groq for free)
2. Enter API key
3. Select Telegram
4. Create bot via @BotFather
5. Paste token
6. Enter your Telegram user ID

### Step 9: Add Caddy route

```bash
sudo nano /etc/caddy/Caddyfile
```

Add:
```
test.agentbot.com {
    reverse_proxy localhost:18789
}
```

Reload:
```bash
sudo systemctl reload caddy
```

### Step 10: Test

1. Open https://test.agentbot.com
2. Message your bot on Telegram
3. Should respond!

---

## Phase 3: Backup Setup

### Step 11: Create GCS bucket

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

### Step 12: Setup backup script

```bash
sudo mkdir -p /opt/agentbot
sudo nano /opt/agentbot/backup.sh
```

See `infra/scripts/backup.sh` for the full script.

```bash
sudo chmod +x /opt/agentbot/backup.sh

# Add to cron (runs daily at 3 AM)
echo "0 3 * * * /opt/agentbot/backup.sh" | sudo crontab -
```

---

## Phase 4: Provisioning API

See `api/` directory for the backend that:
1. Creates new containers on signup
2. Manages Caddy routes
3. Handles billing webhooks
4. Runs health checks

---

## Monitoring

### Container health check

```bash
# Check all containers
docker ps

# View logs
docker logs openclaw-test --tail 100

# Check resource usage
docker stats
```

### Caddy status

```bash
sudo systemctl status caddy
sudo journalctl -u caddy -f
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

### Restore from backup
```bash
/opt/agentbot/restore.sh <user_id> [date]
```
