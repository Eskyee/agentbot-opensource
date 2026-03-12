# Agentbot: Cloud Infrastructure Quick Reference (Render)

## Overview
These notes allow Atlas (Platform Operator) to manage the production environment via the Render Dashboard and API.

## Environment Details (Live)
- **Primary Dashboard:** [Render Dashboard](https://dashboard.render.com)
- **Repo:** `https://github.com/Eskyee/agentbot`
- **Deployment Flow:** Push to GitHub -> Build Images -> Push to Docker Hub -> Render Auto-deploy.

## Services
- **`agentbot-api`:** Primary Express API (Web Service).
- **`agentbot-worker`:** Background job processing (Worker).
- **`agentbot-ollama`:** Local LLM Inference (Web Service).
- **`agentbot-db`:** PostgreSQL 15 (Managed Database).
- **`agentbot-redis`:** Redis 7 (Managed Cache).

## Deployment Management
- **Manual Redeploy:** Trigger via Render Dashboard or API hook.
- **Rollbacks:** Available in the Render "Events" tab for each service.
- **Logs:** Accessible via the "Logs" tab in the Render Dashboard.

## Operational Notes
- **Scaling:** Update `plan` in `render.yaml` or manually in the Dashboard to handle increased inference load.
- **Disks:** `agentbot-ollama` uses a 50GB persistent disk for model weights. **Never delete this disk** without backing up the `.ollama` directory.
- **Internal Networking:** Services communicate via internal URLs (e.g., `http://agentbot-ollama:11434`).
