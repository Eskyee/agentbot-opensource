# Agentbot: Cloud Infrastructure Quick Reference (GCP)

## Overview
These commands allow Atlas (Platform Operator) to manage the production VM instance directly via the Google Cloud SDK (`gcloud`).

## Instance Management
- **Stop Instance (Save Costs):**
  `gcloud compute instances stop agentbot-prod --zone=us-central1-a`
- **Start Instance:**
  `gcloud compute instances start agentbot-prod --zone=us-central1-a`
- **SSH Access:**
  `gcloud compute ssh agentbot-prod --zone=us-central1-a`

## Logging & Monitoring
- **Read Last 10 Logs:**
  `gcloud logging read "resource.type=gce_instance AND labels.instance_name=agentbot-prod" --limit=10`

## Operational Notes
- Use `stop` during low-traffic windows or development pauses to minimize burn.
- Use `ssh` to manually inspect Docker containers (`docker ps`) or run local repair scripts.
- Logs are the primary tool for diagnosing `agentbot-worker` job failures.
