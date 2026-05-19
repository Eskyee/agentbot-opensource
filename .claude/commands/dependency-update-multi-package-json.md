---
name: dependency-update-multi-package-json
description: Workflow command scaffold for dependency-update-multi-package-json in agentbot-opensource.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /dependency-update-multi-package-json

Use this workflow when working on **dependency-update-multi-package-json** in `agentbot-opensource`.

## Goal

Updates dependencies across multiple package.json files in a monorepo, typically using an automated tool like Dependabot.

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

- Automated tool detects outdated dependencies.
- Tool updates version numbers in all relevant package.json files (e.g., root, backend, web, gateway).
- Tool updates the package-lock.json to reflect new dependency tree.
- Commit is created summarizing all updated packages.

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.