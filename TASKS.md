# Tasks

## In Progress

## Up Next

## Done
- [x] Security audit — all CRIT/HIGH/MED/LOW findings fixed
- [x] CRIT-01: Outer Bearer auth gate (timingSafeEqual, fail-closed)
- [x] HIGH-01: Invite codes — atomic DB consumption, requireInternalAuth
- [x] HIGH-04: API keys — SHA-256 hash lookup, never store raw keys
- [x] MED-04: Container updates preserve plan-specific resource limits
- [x] MED-06: exec() → spawn() everywhere (no shell injection)
- [x] LOW-03: Per-user monthly token quota in model_metrics table
- [x] LOW-04: Extended SSRF blocklist (IPv6 ULA, mapped IPv4, CGN, zone IDs)
- [x] Discord interactions: SHA256 → Ed25519 (SubtleCrypto)
- [x] WhatsApp webhook: fail-closed + timingSafeEqual length guard
- [x] Mux webhook: timingSafeEqual length guard + replay protection
- [x] Stripe webhook: fail-closed (503 if secret not configured)
- [x] provision route (web): NextAuth gate + subscription check + INTERNAL_API_KEY
- [x] container-manager.ts: hardcoded path removed, exec → spawn, curl → fetch
- [x] bus.ts: IPv6 bracket stripping fix (Node.js 18+ URL.hostname behavior)
- [x] End-to-end security tests: 107/107 passing
