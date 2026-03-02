# Daily Checklist

## Morning (5 min)

```bash
# Check Atlas
openclaw status

# Check Agentbot
curl -s agentbot.raveculture.xyz/api/health
```

## If Issues

| Problem | Fix |
|---------|-----|
| Atlas down | `openclaw gateway` |
| Agentbot 500 | Check Vercel dashboard |
| Workflow failed | GitHub Actions → Run again |

## That's It!

```
✓ Morning: Check status (2 commands)
✓ Fix if needed
✓ Done
```

Everything else runs automatically:
- ✅ Copilot → Code review
- ✅ Daily blog → Auto publishes
- ✅ Gordon → Docker self-heals
- ✅ Agentbot → Health checks every 6h
