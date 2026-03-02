# Agentbot: Cloud Infrastructure Quick Reference (GCP)

## Overview
These commands allow Atlas (Platform Operator) to manage the production VM instance directly via the Google Cloud SDK (`gcloud`).

## Instance Details (Live)
- **Name:** agentbot-prod
- **Zone:** us-central1-a
- **Machine Type:** e2-standard-4 (4 vCPU, 16GB RAM)
- **Internal IP:** 10.128.0.3
- **External IP:** 34.170.109.115
- **Status:** RUNNING (Last checked: 2026-03-02 21:56 GMT)

## Instance Management
- **GCloud Path:** `/Users/raveculture/google-cloud-sdk/bin/gcloud` (Add to PATH or use absolute path)
- **Stop Instance (Save Costs):**
  `/Users/raveculture/google-cloud-sdk/bin/gcloud compute instances stop agentbot-prod --zone=us-central1-a`
- **Start Instance:**
  `/Users/raveculture/google-cloud-sdk/bin/gcloud compute instances start agentbot-prod --zone=us-central1-a`
- **SSH Access:**
  `/Users/raveculture/google-cloud-sdk/bin/gcloud compute ssh agentbot-prod --zone=us-central1-a`

## Logging & Monitoring
- **Read Last 10 Logs:**
  `/Users/raveculture/google-cloud-sdk/bin/gcloud logging read "resource.type=gce_instance AND labels.instance_name=agentbot-prod" --limit=10`

## Operational Notes
- Use `stop` during low-traffic windows or development pauses to minimize burn.
- Use `ssh` to manually inspect Docker containers (`docker ps`) or run local repair scripts.
- Logs are the primary tool for diagnosing `agentbot-worker` job failures.
