# Contributing to Agentbot

Thank you for your interest in contributing! This guide covers everything you need to get started.

## Quick Start

```bash
git clone https://github.com/Eskyee/agentbot-opensource.git
cd agentbot-opensource

# Docker (recommended)
cp web/.env.example web/.env   # fill in your values
docker compose up -d           # http://localhost:3000

# Manual
cd web && npm install && npm run dev           # frontend → :3000
cd agentbot-backend && npm install && npm run dev  # backend  → :4000
```

## SDK Development

The public starter SDK lives in [`sdk/agentbot`](./sdk/agentbot).

- Keep it aligned with the public routes in this repo
- Do not wire managed-platform-only endpoints into it
- Prefer typed `fetch` wrappers over generated clients or private assumptions

## Project Structure

```
agentbot-opensource/
├── web/                        # Next.js 16 frontend + API routes
│   ├── app/
│   │   ├── api/               # ~140 API route handlers
│   │   ├── dashboard/         # Dashboard pages
│   │   └── onboard/           # Agent setup wizard
│   ├── lib/                   # Shared utilities
│   └── prisma/                # Database schema + migrations
├── agentbot-backend/           # Express.js backend API
│   └── src/
│       ├── routes/            # REST endpoints
│       └── services/          # Business logic
├── mintlify-docs/              # Documentation site
├── scripts/                   # Dev + ops utilities
└── .github/workflows/          # CI/CD + secret scanning
```

## Development Workflow

1. Fork the repo and create a feature branch: `git checkout -b feat/my-feature`
2. Make your changes — keep them focused and minimal
3. Run the secret scanner before pushing: `bash scripts/check-secrets.sh .`
4. Run tests:
   ```bash
   cd agentbot-backend && npm test
   cd web && npm test
   ```
5. Open a pull request against `main`

## Code Standards

- **TypeScript strict** — no `any` where avoidable
- **One feature or fix per PR** — keep diffs small and reviewable
- **Follow existing patterns** — read the surrounding code before writing new code
- **No shell injection** — use `spawn()` not `exec()` for all shell commands
- **Fail-closed security** — auth checks default to deny, not allow

## Environment Variables

Copy `web/.env.example` to `web/.env`. Required fields are documented in the [README](README.md#environment-variables).

> Never commit real API keys. The CI pipeline runs GitLeaks + TruffleHog on every push.
> Never commit personal email addresses or live infrastructure hostnames to the public repo.

## Before Opening a PR

- [ ] `bash scripts/check-secrets.sh .` passes (no leaked secrets)
- [ ] `cd agentbot-backend && npx tsc --noEmit` passes (no type errors)
- [ ] Tests pass: `npm test` in both `web/` and `agentbot-backend/`
- [ ] PR description explains **what** and **why**, not just what changed

## Reporting Issues

- Security vulnerabilities → see [SECURITY.md](SECURITY.md) (do not open public issues)
- Bugs and features → [GitHub Issues](https://github.com/Eskyee/agentbot-opensource/issues)

## License

By contributing you agree your code will be licensed under the [MIT License](LICENSE).
