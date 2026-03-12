# Agentbot Infrastructure Setup (Render + Docker Hub)

This guide walks through setting up the Agentbot infrastructure using Render.com and Docker Hub.

---

## Pillar 1: Build & Registry (Docker Hub)

### Step 1: Login to Docker Hub
```bash
docker login
```

### Step 2: Build & Push Images
From the root of the `agentbot` repo:

```bash
# Backend API
docker build -t raveculture/agentbot-api:latest ./agentbot-backend
docker push raveculture/agentbot-api:latest

# Deployment Worker
docker build -t raveculture/agentbot-worker:latest ./agentbot-worker
docker push raveculture/agentbot-worker:latest
```

---

## Pillar 2: Production Deployment (Render)

### Step 3: Deploy Blueprint
1. Connect your GitHub repo to **Render.com**.
2. Render will automatically detect the `render.yaml` file.
3. Apply the blueprint.

### Step 4: Managed Services
Render will provision the following automatically:
- **`agentbot-db`:** PostgreSQL 15.
- **`agentbot-redis`:** Redis 7 (Internal).
- **`agentbot-ollama`:** Inference engine with 50GB persistent disk.

---

## Pillar 3: Edge Node (Mac mini)

### Step 5: Local Edge Coordination
The Mac mini runs local OpenClaw agents for secure, physical coordination.

```bash
openclaw start
```

---

## Monitoring & Operations

- **Logs:** View via Render Dashboard for `api`, `worker`, and `ollama`.
- **Scaling:** Update the `plan` in `render.yaml` to scale horizontal workers or vertical inference RAM.
- **Backups:** Managed automatically by Render for PostgreSQL. Agent data is stored on persistent disks.

---

## Quick Reference

### Deployment Commands
| Action | Command |
| :--- | :--- |
| **Full Build** | `scripts/build-all.sh` |
| **Push Hub** | `scripts/push-hub.sh` |
| **Redeploy** | Trigger via Render Dashboard |

### Port Allocation (Internal)
| Service | Port | URL |
| :--- | :--- | :--- |
| API | 3001 | `http://agentbot-api:3001` |
| Ollama | 11434 | `http://agentbot-ollama:11434` |
