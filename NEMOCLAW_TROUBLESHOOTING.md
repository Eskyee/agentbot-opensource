# NemoClaw Troubleshooting Guide

Based on real-world installation experience. Credit: Community user.

## Hardware Requirements

**Minimum: 8GB RAM** (2vCPU/4GB is insufficient)

---

## Pre-requisites (not in official docs)

1. Docker installed
2. Nvidia Openshell installed

---

## Installation Issues & Fixes

### 1. Installation Method

The curl one-liner from the "getting started" page doesn't fully work. 

**Fix:** Use the GitHub installation method instead.

---

### 2. Docker Build Error (.dockerignore bug)

The repo's `.dockerignore` excludes `/dist`, which blocks Docker from copying `nemoclaw/dist/` into the image.

**Fix:** Manually edit `.dockerignore` to remove or comment out the `/dist` exclusion.

---

### 3. Sandbox Name Split-Brain

The onboard wizard lets you pick a custom sandbox name, but `setup.sh` hardcodes the name `nemoclaw` when creating the OpenShell sandbox. This creates a mismatch between NemoClaw's registry and OpenShell.

**Symptoms:** Everything breaks.

**Fix:** 
- Don't use a custom name - stick with default
- If confused, manually edit `~/.nemoclaw/sandboxes.json`

---

### 4. Environment Variable Confusion

- Telegram bridge reads: `SANDBOX_NAME`
- Start script reads: `NEMOCLAW_SANDBOX`
- They default to different values (`nemoclaw` vs `default`)

**Fix:** Set both in `.bashrc`:
```bash
export SANDBOX_NAME=nemoclaw
export NEMOCLAW_SANDBOX=nemoclaw
```

---

### 5. OpenShell Not on PATH

OpenShell installs to `~/.local/bin/`, which works in interactive shells but not for child processes spawned by the bridge.

**Fix:** Symlink to system PATH:
```bash
sudo ln -s ~/.local/bin/openshell /usr/local/bin/openshell
```

---

### 6. Inference Not Auto-Configured

After manually creating the sandbox, the Nvidia inference provider and routing weren't set up, despite providing the Nvidia API key during install.

**Fix:** Run manually:
```bash
openshell provider create
openshell inference set
```

---

### 7. Ghost Processes

After multiple stop/start cycles, old bridge processes can linger and intercept Telegram messages with stale config.

**Fix:**
```bash
pkill -f telegram-bridge
```

---

## Summary

The installer doesn't seem battle-tested. Key lessons:
1. Get 8GB+ RAM first
2. Use GitHub install method
3. Don't use custom sandbox names
4. Set both env vars
5. Symlink openshell to /usr/local/bin
6. Manually configure inference if needed
7. Kill ghost processes with pkill

---

*Note: Once fully operational, NemoClaw works well through Telegram. The enhanced policy and enterprise-grade mechanisms are worth exploring.*
