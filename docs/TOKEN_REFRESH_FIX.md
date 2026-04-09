# OpenClaw Token Refresh Fix - Summary

## Problem
Users had to manually refresh the dashboard to restore pairing tokens when they expired or went missing. The system only **checked** for tokens but didn't **auto-generate** new ones.

## Solution Implemented

### 1. Auto-Token Generation (`token-manager.ts`)
- **Generates** cryptographically secure tokens (32 bytes entropy = 64 hex chars)
- **Stores** user-specific tokens in `agent_registrations` table
- **Auto-creates** tokens when missing (no manual refresh needed!)
- **Validates** token format
- **Falls back** gracefully to shared token if needed

### 2. Updated heal-token API
- Now **generates** new tokens instead of just checking
- Stores tokens per-user in database
- Returns token to dashboard for immediate use
- Updates Control UI URL automatically

### 3. Dashboard Auto-Heal
- Checks token on dashboard load
- If missing, automatically calls heal-token
- Updates UI with new token
- No user action required!

### 4. OpenClaw 2026.4.2 Compatibility
- Plugin config migration (x_search, firecrawl)
- Agent pairing scope fixes
- Task Flow integration
- Exec YOLO mode defaults
- Gateway/exec loopback fixes

## How It Works Now

1. User opens dashboard
2. System checks for gateway token
3. If missing → automatically generates new one
4. Stores in database for user
5. Updates Control UI URL with new token
6. User can connect immediately - no refresh needed!

## Files Changed

| File | Purpose |
|------|---------|
| `token-manager.ts` | Generate, validate, store tokens |
| `heal-token/route.ts` | Auto-generate tokens API |
| `dashboard/page.tsx` | Auto-heal on load |
| `openclaw-compatibility.ts` | 2026.4.2 migration helpers |
| `openclaw-doctor.ts` | Diagnostic tool |
| `ensure-compatibility/route.ts` | Compatibility check API |

## Testing

Run the diagnostic:
```bash
curl -X POST /api/support/heal-token
# Returns: { healed: true, token: "...", isNew: true }
```

Check dashboard:
1. Open dashboard
2. If token was missing, it should auto-generate
3. Control UI should connect without manual refresh

## Benefits

- ✅ No more manual token refresh
- ✅ Auto-generation when tokens expire
- ✅ User-specific tokens (more secure)
- ✅ Compatible with OpenClaw 2026.4.2
- ✅ Graceful fallbacks
- ✅ Better error handling
