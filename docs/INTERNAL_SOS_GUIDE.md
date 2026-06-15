# Internal SOS Guide

Quick reference for troubleshooting Agentbot platform issues.

## Quick Checks

| Issue | Check | Fix |
|-------|-------|-----|
| Token mismatch | User's unique token in `agent_registrations` | Re-fetch from DB via `/api/user/openclaw` |
| Gateway down | Railway service status | Check `agentbot-agent-{userId}.up.railway.app` |
| OpenClaw not loading | moltx.io status | External - wait or notify users |
| DB connection | Neon connection string | Check env vars in Railway |
| Provisioning fails | Railway API key | Verify in `.env` |

## Token Verification

```bash
# Check user's token in database
psql $NEON_URL -c "SELECT id, gateway_url, token FROM agent_registrations WHERE user_id = 'USER_ID';"
```

## Common Fixes

1. **Token mismatch**: User gets wrong token → Use `/api/user/openclaw` (fetches from DB)
2. **Repair route fails**: Use user's unique token from `agent_registrations`
3. **Gateway 502**: Check Railway service health, restart if needed

## Emergency Contacts

- Platform issues: Check Railway dashboard
- Database: Check Neon console
- DNS: Check Cloudflare DNS

## Useful Commands

```bash
# Check active agents
psql $NEON_URL -c "SELECT COUNT(*) FROM agent_registrations WHERE status = 'active';"

# Check recent errors
railway logs --service agentbot-backend
```