# Syncing to the Public Repo

Private repo: `https://github.com/Eskyee/agentbot` (you)
Public repo:  `https://github.com/Eskyee/agentbot-opensource` (world)

---

## How it works

The private repo contains personal emails, internal infrastructure URLs, and a real wallet address. These must never reach the public repo. The sync pipeline has three layers of protection:

```
private repo ──► sync script strips secrets ──► public repo ──► CI gate blocks any leak
```

1. **`scripts/sync-to-opensource.sh`** — copies everything from the private repo into a temp dir, runs `sed` replacements on the known secret locations, runs `check-secrets.sh` on the output, then commits and pushes to the public repo.
2. **`scripts/check-secrets.sh`** — standalone scanner you can run manually before any push.
3. **`.github/workflows/check-secrets.yml`** — GitHub Actions CI gate that runs on every push/PR to the public repo and blocks the merge if secret patterns are detected.

---

## One-time setup

The `opensource` remote is already configured:

```bash
git remote -v
# opensource  https://github.com/Eskyee/agentbot-opensource.git (push)
```

If it were ever missing, add it back with:
```bash
git remote add opensource https://github.com/Eskyee/agentbot-opensource.git
```

---

## Syncing (every time you want to publish updates)

From the root of the **private** repo:

```bash
bash scripts/sync-to-opensource.sh
```

That's it. The script will:
- Rsync the full repo (excluding `.env`, `node_modules`, `.next`, log files)
- Strip all known secrets in-place using `sed`
- Run `check-secrets.sh` on the stripped output — **aborts if anything is still found**
- Commit with the message from your latest private commit
- Push to `agentbot-opensource` `main`

### Optional: sync a specific branch

```bash
bash scripts/sync-to-opensource.sh my-feature-branch
```

---

## Manual secret scan (before any push)

Run this any time you want to check a directory for leaks:

```bash
bash scripts/check-secrets.sh          # scans current directory
bash scripts/check-secrets.sh web/     # scans only the web app
```

It checks for:
| Pattern | Example |
|---------|---------|
| Personal Gmail addresses | `yourname@gmail.com` |
| iCloud addresses | `yourname@icloud.com` |
| Personal domain emails | `rbasefm@`, `eskyjunglelab@` |
| Real 40-char wallet addresses | `0x...` (filters obvious placeholders) |
| Railway private URLs | `*YOUR_SERVICE_URL` |
| Private subdomain patterns | `borg-0-production` |
| Real Resend API keys | `re_XXXX` |
| Real OpenAI keys | `sk-XXXX` |

---

## What gets stripped on sync

| File | What's replaced |
|------|-----------------|
| `web/app/onboard/page.tsx` | `ADMIN_EMAILS` array → `YOUR_ADMIN_EMAIL_*` placeholders |
| `web/app/api/provision/route.ts` | `HARDCODED_ADMINS` array → placeholders |
| `web/app/api/partner/route.ts` | `to: ['YOUR_ADMIN_EMAIL_2']` → placeholder |
| `web/app/api/bankr/prompt/route.ts` | fallback email → placeholder |
| `web/app/api/bankr/balances/route.ts` | fallback email → placeholder |
| `web/app/components/DashboardSidebar.tsx` | Railway URL → `YOUR_SOUL_SERVICE_URL` |
| `web/.env.example` | Real wallet address → `0xYOUR_WALLET_ADDRESS_HERE` |
| `web/.env.example` | Railway URL → `https://YOUR_SOUL_SERVICE_URL` |

---

## GitHub Actions gate (on the public repo)

`.github/workflows/check-secrets.yml` runs on every push and PR to the public repo. If any secret pattern is detected, the workflow fails with a clear error message and blocks the merge. This is a safety net — the sync script should catch everything first.

---

## Adding new secrets to the strip list

If you add new hardcoded values to the private repo, update **both**:

1. **`scripts/sync-to-opensource.sh`** — add a `sed` line inside the `strip()` function, and call `strip` on the new file
2. **`scripts/check-secrets.sh`** — add a `check` call for the new pattern
3. **`.github/workflows/check-secrets.yml`** — add the same pattern to the CI scanner

Keep all three in sync.
