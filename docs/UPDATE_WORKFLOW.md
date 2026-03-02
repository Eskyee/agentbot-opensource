# Update Monitoring Workflow

## Current Versions

| Component | Current | Latest | Status |
|-----------|---------|--------|--------|
| OpenClaw | 2026.2.26 | 2026.3.1 | ❌ Outdated |
| Local (Atlas) | 2026.3.1 | 2026.3.1 | ✅ Current |

## Action Needed

Update `agentbot-backend/src/index.ts`:
```typescript
OPENCLAW_IMAGE = 'ghcr.io/openclaw/openclaw:2026.3.1'
OPENCLAW_RUNTIME_VERSION = '2026.3.1'
```

---

## Rule #1: Always check official docs first

Before making any changes:
1. Check OpenClaw docs: https://docs.openclaw.ai
2. Check GitHub releases: https://github.com/openclaw/openclaw/releases
3. Check MCP/skills docs

## Daily Update Check

```bash
# Check OpenClaw version
openclaw update status

# Check for new releases
gh release list --repo openclaw/openclaw

# Check docs
openclaw docs
```

## Weekly Tasks

1. **Monday** - Check OpenClaw releases for breaking changes
2. **Wednesday** - Review MCP/skills for new capabilities  
3. **Friday** - Test any new features locally

## Update Process

```
1. Check docs first
2. Check release notes
3. Test in dev/local first
4. Then push to production
```

## Useful Commands

```bash
# Check current version
openclaw --version

# Check update status
openclaw update status

# Dry run update
openclaw update --dry-run

# Check GitHub releases
gh release list --repo openclaw/openclaw

# Check docs
openclaw docs
```
