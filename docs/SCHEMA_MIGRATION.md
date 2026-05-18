# Schema Migration — PascalCase vs snake_case Models

## Status: tech debt, contained — do **not** migrate

The Prisma schema in `web/prisma/schema.prisma` carries two parallel sets of
models for what is conceptually the same data:

- **PascalCase models** (`User`, `Agent`, `Skill`, `Subscription`, …) — the
  canonical App-Router-era models. New code must use these.
- **snake_case models** (`users`, `agents`, `wallets`, …) — legacy introspected
  tables that predate the App-Router migration. Several existing routes still
  read and write through these.

The two sets share underlying tables but have diverging cascade behavior, soft
vs. hard delete conventions, and column naming. Trying to fold them into a
single set today would touch dozens of routes, basefm/bridge/ops pipelines,
and live cron jobs — a high-risk change for low day-to-day benefit.

This document captures **which legacy models are still active**, **which
helpers exist to bridge the two**, and **the rule for adding new code**.

## Active legacy snake_case models

| Legacy model | Used in | Status |
|---|---|---|
| `agents` | `app/api/basefm/streams/*`, `app/api/cron/cleanup/route.ts`, `app/api/ops/fleet/*` | Active reads + writes |
| `users` | `app/lib/legacyUserId.ts`, `app/api/basefm/*`, `app/api/bridge/*`, `app/api/x402/route.ts` | Active reads |
| `wallets` | `app/api/user/basefm-wallet/route.ts` | Active reads |
| `deployments` | `app/api/cron/cleanup/route.ts` | Active reads |
| `events` | (via `agents` relation) | Passive |
| `dj_sessions` | `app/api/basefm/live/route.ts`, `app/api/basefm/dj-stats/route.ts` | Active reads + writes |
| `bridge_messages` | `app/api/bridge/inbox/route.ts`, `app/api/bridge/send/route.ts`, `app/api/bridge/health/route.ts` | Active reads + writes |
| `model_metrics` | (via `agents` relation) | Passive |
| `bookings` | (via `agents` relation) | Passive |
| `royalty_splits` | `app/api/basefm/distribution/route.ts` | Active reads |
| `social_campaigns` | (via `agents` relation) | Passive |
| `treasury_transactions` | (via `agents` relation) | Passive |

"Passive" means the model is reachable as a Prisma relation from an active
parent (e.g. `agents.events`) but no route currently queries it directly.

## The schema-level rule

Quoting the comment block at the top of `web/prisma/schema.prisma`:

> Don't mix the two when adding a new model — pick the side that owns the
> canonical row (`Agent` vs `agents`) and inherit its cascade behavior. If you
> need to delete across both sides, do it explicitly in the route handler
> rather than relying on cascades.

PascalCase models use `onDelete: Cascade` consistently. Legacy snake_case
models use `onDelete: NoAction` consistently — deleting a parent leaves
orphans, and soft-delete conventions are inconsistent (`status='destroyed'`
on some, hard delete on others).

## Rules for new code

1. **New features MUST use PascalCase models.** No exceptions.

2. **If you need data from a legacy table from new code, do not import the
   legacy Prisma model directly.** Add a read-only helper in
   `web/app/lib/legacyUserId.ts` (or a sibling file that follows the same
   pattern) that exposes only the shape the new code needs. This keeps the
   blast radius of the legacy schema bounded.

3. **Cross-side writes go in the route handler, not in cascades.** If a write
   needs to touch both a PascalCase and a snake_case row, do it explicitly —
   `prisma.$transaction([…])` is fine, implicit cascade behavior across the
   boundary is not.

4. **The CI check at `scripts/check-legacy-models.sh` warns when changed
   files reference legacy models.** It is intentionally non-blocking; it
   exists to draw a reviewer's eye, not to fail builds, since some legacy-
   touching changes are legitimate (bug fixes in the existing pipelines).

## When to revisit

A real migration becomes worthwhile when:

- We need a single source of truth for analytics that currently has to merge
  PascalCase and snake_case counts (e.g. "live agents" on the public stats),
  *and*
- The basefm/bridge pipelines have been simplified to the point that
  rewriting their data access layer is not the dominant cost.

Until then, the rule is: contain, don't migrate.
