# Agentbot Architecture

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CADDY (Reverse Proxy)                      │
│  - Auto SSL/TLS                                                 │
│  - Routes *.agentbot.com → containers                          │
│  - Load balancing (future)                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ OpenClaw        │ │ OpenClaw        │ │ OpenClaw        │
│ Container       │ │ Container       │ │ Container       │
│ (user1)         │ │ (user2)         │ │ (user3)         │
│                 │ │                 │ │                 │
│ ┌─────────────┐ │ │ ┌─────────────┐ │ │ ┌─────────────┐ │
│ │ Volume      │ │ │ │ Volume      │ │ │ │ Volume      │ │
│ │ (persistent)│ │ │ │ (persistent)│ │ │ │ (persistent)│ │
│ └─────────────┘ │ │ └─────────────┘ │ │ └─────────────┘ │
└─────────────────┘ └─────────────────┘ └─────────────────┘
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GCS (Backup Storage)                         │
│  - Daily backups of all volumes                                 │
│  - 30-day retention                                             │
│  - Encrypted at rest                                            │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Caddy (Reverse Proxy)

**Purpose:** Routes incoming traffic to the correct container.

**How it works:**
- `user1.agentbot.com` → `localhost:18001`
- `user2.agentbot.com` → `localhost:18002`
- Auto-generates SSL certificates via Let's Encrypt

**Config Example:**
```
user1.agentbot.com {
    reverse_proxy localhost:18001
}

user2.agentbot.com {
    reverse_proxy localhost:18002
}
```

### 2. OpenClaw Containers

**Purpose:** Each user gets an isolated OpenClaw instance.

**Resources per container:**
- Memory: 512MB (soft limit)
- CPU: 0.5 cores
- Storage: Unlimited (via volume)

**Isolation:**
- Cannot access other containers
- Cannot access host filesystem
- Network isolated (only Caddy can reach them)

### 3. Docker Volumes

**Purpose:** Persistent storage for user data.

**Contents:**
```
~/.openclaw/
├── config/           # API keys, settings
│   └── openclaw.json
├── workspace/        # User's files, memory
│   ├── MEMORY.md
│   ├── SOUL.md
│   └── memory/
├── state/            # Session history
└── credentials/      # Encrypted secrets
```

**Backup:** Volumes are backed up daily to GCS.

### 4. Backup System

**Schedule:** Daily at 3 AM UTC

**Process:**
1. Stop container (brief pause)
2. Tar volume contents
3. Upload to GCS bucket
4. Restart container
5. Delete local backup after 7 days

**Retention:** 30 days on GCS

### 5. Management API (Future)

**Endpoints:**
- `POST /provision` — Create new instance
- `DELETE /deprovision` — Remove instance
- `POST /restart` — Restart instance
- `GET /status` — Health check
- `POST /backup` — Trigger backup
- `POST /restore` — Restore from backup

---

## Data Flow

### User Onboarding

```
1. User signs up on agentbot.com
2. Frontend calls API: POST /provision
3. API creates Docker volume
4. API writes config to volume
5. API starts container
6. API updates Caddy config
7. Caddy reloads
8. User's subdomain goes live
9. User messages Telegram bot
10. OpenClaw responds
```

### Daily Backup

```
1. Cron triggers at 3 AM
2. For each container:
   a. Pause container
   b. Create tarball of volume
   c. Resume container
   d. Upload to GCS
3. Cleanup old local backups
```

### Restore from Backup

```
1. Admin runs: restore.sh user123 2026-02-08
2. Script downloads backup from GCS
3. Removes old volume
4. Creates new volume
5. Extracts backup to volume
6. Starts new container
7. User's data restored
```

---

## Scaling Plan

### Phase 1: Single VM (0-100 users)
- One GCP e2-medium
- All containers on same VM
- Good enough for MVP

### Phase 2: Multiple VMs (100-500 users)
- Add more VMs as needed
- Distribute users across VMs
- Load balancer in front

### Phase 3: Kubernetes (500+ users)
- Migrate to GKE
- Auto-scaling
- Rolling updates
- Better resource utilization

---

## Security Model

### Container Isolation
- Each container runs as non-root user
- No privileged mode
- Read-only root filesystem (future)
- Network namespace isolation

### Data Protection
- API keys encrypted at rest
- Backups encrypted on GCS
- HTTPS everywhere (Caddy)
- No plain-text secrets in logs

### Access Control
- Users can only access their own instance
- Admin access via SSH key only
- No shared credentials

---

## Failure Modes

| Failure | Detection | Recovery |
|---------|-----------|----------|
| Container crash | Docker health check | Auto-restart |
| VM crash | GCP auto-heal | VM restarts, containers restart |
| Data corruption | User report | Restore from backup |
| Caddy crash | Systemd | Auto-restart |
| GCS unavailable | Backup script fails | Retry next day, alert |
