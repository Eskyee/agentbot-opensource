---
name: dependency-update-batch
description: Workflow command scaffold for dependency-update-batch in agentbot-opensource.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /dependency-update-batch

Use this workflow when working on **dependency-update-batch** in `agentbot-opensource`.

## Goal

Batch updating multiple dependencies (npm packages) across the monorepo, typically using an automated tool like Dependabot.

## Common Files

- `package.json`
- `package-lock.json`
- `agentbot-backend/package.json`
- `gateway/package.json`
- `web/package.json`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Detect outdated dependencies (via bot or manually).
- Update the version numbers in multiple package.json files (root and sub-packages).
- Update the lockfile (package-lock.json) to reflect new dependency versions.
- Commit the changes with a summary of updated packages.

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.