# Phase 3d — Payment Session: localStorage → httpOnly Cookies

## Problem

`tempo_session_id` and `tempo_wallet_address` live in localStorage at
[web/lib/mpp/session-fetch.ts](../../../web/lib/mpp/session-fetch.ts). The client
reads them to attach `X-Session-Id` and `X-Wallet-Address` headers on every
`sessionFetch()` call. Any XSS on agentbot.sh can read these values
and replay paid-gateway calls against the user's balance.

Scope of current coupling:
- `web/lib/mpp/session-fetch.ts` — writes/reads localStorage, sets headers
- `web/lib/mpp/middleware.ts:160` — reads `X-Session-Id` from request
- `web/app/api/v1/gateway/route.ts:74-75,195` — reads both headers

## Goal

Move the session ID to a Secure, HttpOnly, SameSite=Strict cookie. Wallet
address can stay readable (it's public-key material, not a credential) but
should move to a cookie too for consistency.

## Non-goals

- Don't change the MPP protocol wire format (gateway stays compatible with
  external callers that send the header explicitly)
- Don't rotate existing sessions
- Don't break the Chrome extension or x402-gateway flows that may send
  headers directly

## Migration strategy (4 PRs, ship each separately)

### PR 1 — Backend accepts either cookie or header (additive, safe)

**web/lib/mpp/middleware.ts and web/app/api/v1/gateway/route.ts**

```ts
const sessionId =
  req.cookies.get('mpp_session')?.value ||
  req.headers.get('X-Session-Id');

const walletAddress =
  req.cookies.get('mpp_wallet')?.value ||
  req.headers.get('X-Wallet-Address');
```

Deploy. Verify nothing regresses — existing header-based clients keep working.

### PR 2 — New endpoint to set cookie (additive, safe)

Add `POST /api/v1/session/bind` that takes `{ sessionId, walletAddress }` in
the body, validates the session belongs to the authenticated user, and
returns `Set-Cookie` headers with:

- `Path=/`
- `HttpOnly`
- `Secure`
- `SameSite=Strict`
- `Max-Age=<session-expiry-seconds>`

Client `sessionFetch` unchanged at this point — just the endpoint exists.

### PR 3 — Client dual-writes (risky, rollable)

Update `setSessionId` to:
1. Write to localStorage (legacy fallback)
2. `POST /api/v1/session/bind` to also set cookie

Update `sessionFetch` to skip attaching headers if no localStorage value
(cookie travels automatically). Existing sessions that only have cookie via
PR 2 still work.

Feature-flag this behind `NEXT_PUBLIC_MPP_COOKIE_MIGRATION=1` so it can be
toggled off without a redeploy if something breaks.

Monitor for 24-48h.

### PR 4 — Remove localStorage (destructive, only after confidence)

- Delete `WALLET_ADDRESS_KEY` / `SESSION_ID_KEY` constants
- Remove localStorage reads from `sessionFetch` — rely entirely on cookie
- Keep the `/api/v1/session/bind` endpoint; remove feature flag
- Delete header reads from `middleware.ts` and `gateway/route.ts` only if
  the Chrome extension and external integrations no longer use them
  (audit first — may need to keep header path permanently for non-browser
  clients)

## Testing checklist per PR

- [ ] PR 1: old client (header only) still authenticates — existing test suite
- [ ] PR 1: new cookie path returns 200 with manual curl + `Cookie: mpp_session=…`
- [ ] PR 2: bind endpoint rejects mismatched user → 403
- [ ] PR 2: cookie flags verified via DevTools → `HttpOnly ✅ Secure ✅ SameSite=Strict ✅`
- [ ] PR 3: feature flag off → behavior unchanged
- [ ] PR 3: feature flag on → cookie set, calls succeed
- [ ] PR 3: logout clears cookie AND localStorage
- [ ] PR 4: no localStorage references remain in `lib/mpp/*`
- [ ] PR 4: XSS in dev tools → cannot read `document.cookie` for `mpp_session`

## Rollback

Each PR is independently revertable. PR 3 is the only one with client-side
behavior change — the feature flag lets us turn it off instantly.

## Open questions

1. Does the Chrome extension sign requests with `X-Session-Id`? If yes, the
   header path must remain permanently — only the browser app migrates.
2. Does x402-gateway's upstream (outside this repo) expect the header? Audit
   before PR 4.
3. Should `tempo_wallet_address` even be a cookie? Public-key data is safe
   in localStorage — consider keeping it client-readable if UI needs it for
   display without a round trip.

## Estimate

- PR 1: 1h (additive backend change + tests)
- PR 2: 2h (new endpoint, cookie serialization, auth check)
- PR 3: 3h (client dual-write, feature flag, QA)
- PR 4: 1h (cleanup) + monitoring window

Total: ~7h engineering + 1 week soak time between PR 3 and PR 4.
