---
task: Fix Bitcoin P2P NBXplorer passkey sign-in
slug: 20260405-120000_bitcoin-p2p-passkey-fix
effort: standard
phase: complete
progress: 8/8
mode: interactive
started: 2026-04-05T12:00:00Z
updated: 2026-04-05T12:10:00Z
---

## Context

Three issues to resolve after context compaction:
1. NBXplorer P2P (port 8333) timing out on bitcoind — needed `-listen=1 -whitelist=0.0.0.0/0`
2. agentbot-backend missing `BTC_BACKEND_NBXPLORER_URL` env var — Bitcoin dashboard broken
3. Passkey sign-in broken — email field was inside collapsed `<details>` accordion, invisible by default

## Criteria

- [x] ISC-1: bitcoind startCommand includes `-listen=1` flag
- [x] ISC-2: bitcoind startCommand includes `-whitelist=0.0.0.0/0` flag
- [x] ISC-3: bitcoind redeployed with new startCommand
- [x] ISC-4: `BTC_BACKEND_NBXPLORER_URL` set on agentbot-backend Railway service
- [x] ISC-5: agentbot-backend redeployed to pick up new env var
- [x] ISC-6: Email input moved outside `<details>` in login-client.tsx
- [x] ISC-7: Passkey section description updated to match new layout
- [x] ISC-8: Fix committed and pushed to main (16f2fdd3)

## Verification

- bitcoind update: `{"data":{"serviceInstanceUpdate":true}}`
- bitcoind redeploy: `{"data":{"serviceInstanceDeploy":true}}`
- agentbot-backend env upsert: `{"data":{"variableCollectionUpsert":true}}`
- agentbot-backend redeploy: `{"data":{"serviceInstanceDeploy":true}}`
- Passkey fix: commit 16f2fdd3 pushed to main, Vercel deploy triggered
