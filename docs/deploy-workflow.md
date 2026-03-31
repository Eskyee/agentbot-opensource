# Deploy Workflow (STRICT)

## Rules
1. **Always push to `staging` first** — never straight to `main`
2. **Wait for Eskyee to confirm** the preview URL works
3. **Only merge `staging` → `main`** after Eskyee's go-ahead

## Steps
```bash
# 1. Push to staging
git push origin staging

# 2. Vercel creates preview URL — send it to Eskyee

# 3. Wait for confirmation

# 4. Merge to main
git checkout main
git merge staging
git push origin main
```

No exceptions. Not even for "small" fixes.
