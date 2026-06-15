---
task: confirm workspace status
slug: 20260605-165616_code-review
effort: extended
phase: observe
progress: 0/16
mode: interactive
started: 2026-06-05T16:56:16.193360+01:00
updated: 2026-06-05T16:57:05.804506+01:00
---

## Context
This task is a fresh code review for the `agentbot` monorepo. The user requested a general review of the current repository state, not a code edit or feature implementation.

The review should cover backend and frontend quality, workspace/package consistency, security-sensitive patterns, testing and build hygiene, and repo-level documentation or process gaps.

The repo already includes an existing `CODE_REVIEW.md` with historical findings and a current review priority list in `AGENTS.md`, so this review should surface new or remaining issues without reusing stale conclusions.

## Criteria
- [ ] ISC-1: Identify backend security risks in `agentbot-backend` source files
- [ ] ISC-2: Identify frontend runtime or build issues in `web` source files
- [ ] ISC-3: Identify package/workspace version or dependency mismatch risks
- [ ] ISC-4: Identify TypeScript config or compiler-safety gaps
- [ ] ISC-5: Identify ESLint/linting gaps or inconsistent quality rules
- [ ] ISC-6: Identify missing or weak test coverage zones in backend and web
- [ ] ISC-7: Identify any unsafe process/env access or secret exposure patterns
- [ ] ISC-8: Identify any high-risk `console.log` / debug output left in production code
- [ ] ISC-9: Identify any gateway/runtime operational risks in `gateway` or Docker config
- [ ] ISC-10: Identify any workspace hygiene issues caused by persisted build artifacts
- [ ] ISC-11: Identify any docs or review guidance mismatch with current code state
- [ ] ISC-12: Identify any use of `any` or weak typings in critical code paths
- [ ] ISC-13: Identify any insecure or deprecated dependency usage in the current workspace
- [ ] ISC-14: Identify any test or package scripts that may fail on CI or non-mac systems
- [ ] ISC-15: Identify any backend auth or internal API key handling weaknesses
- [ ] ISC-16: Identify any repo layout or package manager inconsistency that may impair maintenance

## Decisions
- Use the repo's current structure, workspace packages, and review guidance to focus on the highest-risk areas.
- Treat this task as a review-only deliverable; do not modify production source unless explicitly requested.

## Verification
- Read and inspect backend, web, gateway, package manifest, and review guidance files.
- Confirm findings with file evidence and note explicit locations.
- Summarize issues clearly so the next reviewer can act without additional probe.
