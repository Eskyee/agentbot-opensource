# soul/ — Tempo-x402 soul service (Rust)

This directory builds the Borg cognition runtime that powers
`borg-0-production.up.railway.app` and the `/dashboard/borg` live telemetry
page. The binary itself lives in
[compusophy/tempo-x402](https://github.com/compusophy/tempo-x402); this
directory only contains the Railway-specific build + deploy glue.

## Upstream pin — never auto-bump

The Dockerfile clones `compusophy/tempo-x402` at a **pinned tag**, not
`main`:

```dockerfile
ARG TEMPO_X402_REF=v9.2.0
```

`v9.2.0` is the last known-good tag before the v9.3.0 "Composable Cartridge
Intelligence" refactor (2026-04-11), which changed the soul routing surface
and added runtime deps (llama-server) not present in `debian:trixie-slim`.

**Never let Railway pull `main` unpinned again.** The full platform outage
on 2026-04-20 happened because the original Dockerfile cloned `main` and
one automated Railway redeploy picked up the breaking v9.3.0 refactor,
crash-looping the container until it got restart-policy-killed.

To bump the pin:

1. Run `cargo build --release --package tempo-x402-node` locally against
   the new ref.
2. Inspect the new runtime deps — any new binaries, model weights, env
   vars? Update the Dockerfile runtime stage if so.
3. Deploy the new ref to a Railway preview environment (**not** prod) and
   verify `/soul/status` returns 200.
4. Update `ARG TEMPO_X402_REF` here and add a Notion journal entry
   explaining what's in the bump.

## Volume hygiene — `/data` must be mounted

Soul writes all long-lived state to `/data`:

| Path                       | What                                                          |
| -------------------------- | ------------------------------------------------------------- |
| `/data/soul.db`            | SQLite DB: weights, beliefs, goals, cycles, plans, benchmarks |
| `/data/soul_memory.md`     | Persistent memory file                                        |
| `/data/brain_checkpoints/` | Transformer + brain checkpoints                               |
| `/data/benchmark_history/` | Past eval runs                                                |
| `/data/cartridges/`        | Generated code cartridges                                     |
| `/data/workspace/`         | Tools + codegen workspace                                     |

If `/data` is not a persistent Railway volume, **every restart wipes
everything** — fitness goes to zero, beliefs vanish, goals reset, plans
are lost. This is what caused the 2026-04-20 Borg data-loss incident.

Two guards make this impossible to ship:

1. **Platform-level** — `soul/railway.json` declares
   `"requiredMountPath": "/data"`. Railway refuses to deploy if no volume
   is attached at that path.
2. **Runtime-level** — `soul/entrypoint.sh` checks `/proc/mounts` and
   exits with FATAL if `/data` isn't a real mount (backstop in case the
   platform check is bypassed).

### Attaching the volume

In the Railway UI: `borg-0` service → **Settings** → **Volumes** →
**+ New Volume** → Mount path: `/data` → Size: 5 GB (or as needed).

### Why the previous Dockerfile was broken (fixed 2026-04-22)

The Dockerfile used to set `SOUL_WORKSPACE_ROOT=/home/agent/data/workspace`,
which pointed the workspace at ephemeral disk rather than the volume. Even
if a volume had been mounted at `/data`, workspace state would still have
been lost on restart. All state env vars now default to `/data/*`.

## Health check

The binary exposes `/health` on port 4023.
`railway.json` wires that to Railway's healthcheck with a 30-second
timeout so crash-looping containers are detected fast.

## Related Linear issues

- [AGE-5](https://linear.app/agentbot/issue/AGE-5) — Redeploy borg-0 (2026-04-20 outage recovery)
- [AGE-12](https://linear.app/agentbot/issue/AGE-12) — Evaluate tempo-x402 > v9.2.0 and bump intentionally
- [AGE-13](https://linear.app/agentbot/issue/AGE-13) — Volume hygiene policy
