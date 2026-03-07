# Production Deployment - Server Access Details Needed

**Domain:** ✅ https://agentbot.raveculture.xyz

---

## Still Need These Details

### 1. SSH Access to Production Server

```
SSH User:              ubuntu / root / other?
                       _________________________________

SSH Key Path:          (on your local machine)
                       _________________________________
                       Example: ~/.ssh/agentbot-key.pem

Server IP Address:     (if not using domain)
                       _________________________________
```

### 2. Database Configuration

**PostgreSQL (if already set up):**
```
Host:                  localhost / IP address?
                       _________________________________
Port:                  5432
User:                  agentbot
Password:              _________________________________
Database:              agentbot_db
```

**Or should I set up PostgreSQL in Docker?**
```
[ ] Yes, use Docker PostgreSQL
[ ] No, use existing server
```

### 3. Redis Configuration

**Redis (if already set up):**
```
Host:                  localhost / IP address?
                       _________________________________
Port:                  6379
```

**Or should I set up Redis in Docker?**
```
[ ] Yes, use Docker Redis
[ ] No, use existing server
```

### 4. Email Configuration (Optional)

```
Provider:              [ ] Resend  [ ] SendGrid  [ ] SMTP  [ ] Skip

API Key/Credentials:   _________________________________
```

---

## How to Get SSH Access

If you have a Google Cloud VM:

1. **Get SSH Key:**
   ```bash
   gcloud compute ssh agentbot-server --zone=YOUR_ZONE -- "whoami"
   ```

2. **Or use SSH file directly:**
   ```bash
   ls ~/.ssh/
   # Look for agentbot-key, google_compute_engine, etc.
   ```

3. **Get Server IP:**
   ```bash
   gcloud compute instances list
   # Copy the EXTERNAL_IP
   ```

---

## Quick Template

Just fill in the blanks:

```
SSH User: ubuntu
SSH Key Path: ~/.ssh/agentbot-key.pem
Server IP: 1.2.3.4

PostgreSQL: Use Docker
Redis: Use Docker
Email: Resend - re_YOUR_API_KEY_HERE
```

---

**Once you provide these details, I'll deploy everything in ~30 minutes!** 🚀
