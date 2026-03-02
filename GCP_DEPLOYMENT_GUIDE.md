# AgentBot Google Cloud VM Deployment Guide

## Recommended Configuration

### VM Specs (e2-standard-4)
- **Machine Type**: e2-standard-4
- **vCPU**: 4 cores
- **Memory**: 16 GB RAM
- **Boot Disk**: 50 GB SSD
- **Data Disk**: 100 GB SSD (persistent)
- **OS**: Ubuntu 22.04 LTS
- **Region**: Choose closest to your users
- **Estimated Cost**: $140-155/month

### Why e2-standard-4?
✓ Supports 20-30 concurrent agents  
✓ Comfortable headroom for growth  
✓ Cost-effective (~$150/month)  
✓ Easy to scale up if needed  
✓ Great for production workloads  

---

## Deployment Steps

### 1. Create VM on Google Cloud

```bash
gcloud compute instances create agentbot-prod \
  --machine-type=e2-standard-4 \
  --zone=us-central1-a \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=50GB \
  --boot-disk-type=pd-ssd \
  --enable-display-device=false
```

### 2. Create and Attach Data Disk

```bash
# Create persistent disk
gcloud compute disks create agentbot-data \
  --size=100GB \
  --type=pd-ssd \
  --zone=us-central1-a

# Attach to VM
gcloud compute instances attach-disk agentbot-prod \
  --disk=agentbot-data \
  --zone=us-central1-a
```

### 3. SSH into VM

```bash
gcloud compute ssh agentbot-prod --zone=us-central1-a
```

### 4. Format and Mount Data Disk

```bash
# List disks
lsblk

# Format the new disk (usually /dev/sdb)
sudo mkfs.ext4 -F /dev/sdb

# Create mount point
sudo mkdir -p /opt/agentbot/data

# Mount disk
sudo mount /dev/sdb /opt/agentbot/data

# Make permanent - add to /etc/fstab
echo "/dev/sdb /opt/agentbot/data ext4 defaults,nofail 0 0" | sudo tee -a /etc/fstab

# Verify mount
df -h
```

### 5. Install Docker & Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker --version
docker-compose --version
```

### 6. Clone Repository & Deploy

```bash
# Install git
sudo apt-get update
sudo apt-get install -y git

# Clone repo
cd /opt/agentbot
git clone https://github.com/yourusername/agentbot.git .

# Copy production env file
cp .env.production .env

# Update .env with production credentials
# Edit: OPENROUTER_API_KEY, GOOGLE_CLIENT_SECRET, etc.
nano .env
```

### 7. Start Services

```bash
# Build images (or pull from Docker Hub)
docker-compose build

# Or use pre-built images from Docker Hub
docker-compose pull

# Start all services
docker-compose up -d

# Verify services
docker-compose ps
```

### 8. Configure Firewall

```bash
# Allow HTTP
gcloud compute firewall-rules create allow-http \
  --allow=tcp:80 \
  --source-ranges=0.0.0.0/0

# Allow HTTPS
gcloud compute firewall-rules create allow-https \
  --allow=tcp:443 \
  --source-ranges=0.0.0.0/0

# Allow SSH (already open by default)
```

### 9. Reserve Static IP

```bash
gcloud compute addresses create agentbot-ip \
  --region=us-central1

# Get the IP
gcloud compute addresses describe agentbot-ip --region=us-central1
```

### 10. Configure SSL/TLS

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --standalone \
  -d agentbot.raveculture.xyz \
  --email your-email@example.com

# Auto-renew
sudo certbot renew --dry-run
```

### 11. Configure Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name agentbot.raveculture.xyz;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name agentbot.raveculture.xyz;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/agentbot.raveculture.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/agentbot.raveculture.xyz/privkey.pem;
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

---

## Monitoring & Maintenance

### Monitor Service Health

```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f frontend
docker-compose logs -f api
docker-compose logs -f worker

# Monitor resources
docker stats
```

### Backup Strategy

```bash
# Daily backup of data disk
sudo gcloud compute disks snapshot agentbot-data \
  --snapshot-names=agentbot-data-backup-$(date +%Y%m%d)

# Database backup
docker-compose exec postgres pg_dump -U agentbot agentbot_db > backup.sql
```

### Update Services

```bash
# Pull latest images
docker-compose pull

# Restart services
docker-compose up -d

# Verify
docker-compose ps
```

---

## Troubleshooting

### Port Already in Use

```bash
sudo lsof -i :3000
sudo lsof -i :3001
```

### Database Connection Issues

```bash
docker-compose logs postgres
docker-compose exec postgres psql -U agentbot -c "SELECT 1"
```

### Check VM Resources

```bash
# CPU
top

# Memory
free -h

# Disk
df -h

# Network
netstat -tuln
```

---

## Cost Optimization

1. **Use Committed Use Discounts** (save 25-30%)
2. **Enable auto-scaling** if expanding
3. **Use Cloud CDN** for static assets
4. **Implement rate limiting** to control traffic
5. **Monitor egress costs** (can be $1+ per GB)

---

## Security Checklist

- [ ] SSH key-only access (no passwords)
- [ ] Firewall rules restricted
- [ ] SSL/TLS enabled
- [ ] Environment variables not in code
- [ ] Database password strong
- [ ] Regular backups enabled
- [ ] Monitoring alerts configured
- [ ] Intrusion detection enabled

---

## Next Steps

1. Create Google Cloud account
2. Set up billing
3. Create VM (e2-standard-4)
4. Follow deployment steps above
5. Point DNS to static IP
6. Test all services
7. Set up monitoring

**Estimated setup time**: 30-45 minutes  
**Estimated monthly cost**: $140-155  
**Capacity**: 20-30 concurrent agents

