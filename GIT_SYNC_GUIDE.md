# GIT SYNC MANAGEMENT - KEEP EVERYTHING IN SYNC

## Overview

baseFM repository is maintained in **CONTINUOUS SYNC** between:
- **Local:** `/tmp/agentbot`
- **GitHub:** `https://github.com/Eskyee/agentbot` (main branch)

This guide ensures all changes are automatically synchronized.

---

## AUTO-SYNC SETUP

### Post-Commit Hook (Installed)

Every time you commit locally, changes are automatically pushed to GitHub:

```bash
.git/hooks/post-commit → auto-pushes to origin/main
```

**Status:** ✅ Active

---

## MANUAL SYNC COMMANDS

### Check Sync Status

```bash
cd /tmp/agentbot
./git-sync-monitor.sh
```

Output shows:
- Local vs Remote commit hashes
- Sync status (IN SYNC / OUT OF SYNC)
- Uncommitted changes
- Latest 5 commits

### Pull Latest from GitHub

```bash
cd /tmp/agentbot
git pull origin main
```

### Push Local Changes to GitHub

```bash
cd /tmp/agentbot
git push origin main
```

### Force Full Sync

```bash
cd /tmp/agentbot
git fetch origin main
git merge origin/main
git push origin main
```

---

## DAILY SYNC WORKFLOW

### Morning: Verify Sync

```bash
./git-sync-monitor.sh
```

Expected output: ✅ IN SYNC

### During Work: Auto-Sync

Every commit automatically pushes:

```bash
git add [files]
git commit -m "Update: [description]"
# ↓ Auto-pushes to GitHub ↓
```

### End of Day: Final Verification

```bash
./git-sync-monitor.sh
```

---

## HANDLING MERGE CONFLICTS

If you get merge conflicts:

```bash
# Pull and see conflicts
git pull origin main

# Resolve conflicts in files

# Stage resolved files
git add [resolved-files]

# Commit merge
git commit -m "Merge: Resolved conflicts with main"

# Auto-pushes to GitHub
```

---

## SYNC CHECKLIST

### ✅ Before Launch (March 31)

- [ ] Run `./git-sync-monitor.sh` - Should show IN SYNC
- [ ] Check GitHub: Latest commits match local
- [ ] All test files present in both locations
- [ ] All documentation files present
- [ ] No uncommitted changes locally

### ✅ After Each Session

- [ ] Commit work: `git commit -m "..."`
- [ ] Auto-push confirms (check output)
- [ ] Verify sync: `./git-sync-monitor.sh`

### ✅ Before Major Changes

- [ ] Pull latest: `git pull origin main`
- [ ] Verify sync: `./git-sync-monitor.sh`
- [ ] Then make changes

---

## MONITORING DASHBOARD

### Real-Time Sync Status

```
Repository: /tmp/agentbot
Remote: https://github.com/Eskyee/agentbot
Branch: main

Local Head:  [commit hash]
Remote Head: [commit hash]

Status: ✅ IN SYNC
Last Sync: [timestamp]
```

### File Sync Status

```
Tests:
  ✅ tests/unit/provision-endpoint.test.ts
  ✅ tests/unit/mux-integration.test.ts
  ✅ tests/integration/error-recovery.test.ts
  ✅ tests/e2e/load-test-72h.test.ts

Config:
  ✅ jest.config.js
  ✅ package.test.json

Docs:
  ✅ TEST_EXECUTION_GUIDE.md
  ✅ FINAL_TEST_SUITE_SUMMARY.md
  ✅ CODE_REVIEW_PROVISIONING_FIXES.md
  ✅ A_PLUS_PROOF_EVERYTHING_WORKS.md
  ✅ LOCAL_VERIFICATION_COMPLETE.md
```

---

## WHAT STAYS IN SYNC

### 🔄 Automatically Synced
- ✅ All source code
- ✅ All test files
- ✅ All documentation
- ✅ Configuration files
- ✅ Shell scripts
- ✅ Git history

### ❌ NOT Synced
- node_modules/ (ignored)
- .env files (ignored)
- dist/ builds (ignored)
- .DS_Store (ignored)
- Local temporary files

---

## TROUBLESHOOTING

### Problem: "Your branch is ahead of origin"

**Solution:** Push changes
```bash
git push origin main
```

### Problem: "Your branch is behind origin"

**Solution:** Pull changes
```bash
git pull origin main
```

### Problem: "Merge conflict"

**Solution:** Resolve conflicts, then commit
```bash
# Edit conflicted files
git add [files]
git commit -m "Resolve: [conflict description]"
```

### Problem: "Failed to push"

**Solution:** Force sync
```bash
git fetch origin main
git reset --hard origin/main
git pull origin main
```

---

## SYNC MONITORING SCHEDULE

### Continuous (Automatic)
- Post-commit hook pushes after each commit
- No manual action needed

### Hourly (Optional)
```bash
# Run hourly check
*/60 * * * * cd /tmp/agentbot && ./git-sync-monitor.sh >> .sync.log 2>&1
```

### Daily (Recommended)
```bash
# Run at start of day
./git-sync-monitor.sh
```

---

## GITHUB VERIFICATION

### Check Latest Commits

```bash
# Local
git log --oneline -5

# Remote
git log origin/main --oneline -5
```

Should show same commits in same order.

### View on GitHub

https://github.com/Eskyee/agentbot/commits/main

All local commits should appear here within seconds of pushing.

---

## EMERGENCY FULL RESET

If something goes wrong:

```bash
cd /tmp/agentbot

# Reset to GitHub state
git fetch origin main
git reset --hard origin/main

# Verify sync
./git-sync-monitor.sh
```

---

## SUCCESS INDICATORS

### ✅ Properly Synced
- `./git-sync-monitor.sh` shows "IN SYNC"
- No uncommitted changes
- GitHub shows same commits as local
- No merge conflicts

### ❌ Out of Sync
- `./git-sync-monitor.sh` shows "OUT OF SYNC"
- Uncommitted changes present
- GitHub and local have different commits
- Merge conflicts exist

---

## DAILY CHECKLIST

```
Morning:
  [ ] cd /tmp/agentbot
  [ ] ./git-sync-monitor.sh
  [ ] Verify: IN SYNC

During Work:
  [ ] Make changes
  [ ] git commit -m "..."
  [ ] Auto-push confirms

Evening:
  [ ] ./git-sync-monitor.sh
  [ ] Verify: IN SYNC
  [ ] All changes on GitHub
```

---

## TEAM COMMUNICATION

When syncing fails:
1. Check sync status: `./git-sync-monitor.sh`
2. Run troubleshooting command if needed
3. Document issue in `.sync.log`
4. Report to team if manual intervention needed

---

## BEFORE MARCH 31 LAUNCH

**Critical:** All files must be in perfect sync

```bash
# Final verification (do 1 hour before launch)
cd /tmp/agentbot
./git-sync-monitor.sh

# Expected:
# ✅ IN SYNC
# ✅ No uncommitted changes
# ✅ All test files present
# ✅ All docs present
```

When ready for launch:
```bash
git log --oneline -1        # Confirm latest commit
git ls-remote --head origin main  # Confirm GitHub has it
```

Both should show same commit hash.

---

## SUMMARY

- **Local:** `/tmp/agentbot` - Development environment
- **GitHub:** `main` branch - Source of truth
- **Auto-Sync:** Post-commit hook keeps them in sync
- **Monitor:** `./git-sync-monitor.sh` verifies status
- **Status:** ✅ CONTINUOUS SYNC ACTIVE

Everything stays synchronized automatically. Just commit and push works seamlessly.

---

**Last Updated:** March 15, 2026  
**Sync Status:** ✅ ACTIVE & MONITORING  
**Next Check:** Auto-run before launch (Mar 31)
