# Contributing to Agentbot

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

1. Fork and clone the repo
2. Copy `.env.example` to `.env` and fill in values
3. Run `docker-compose up -d` for local infrastructure
4. Run `npm install` to install dependencies
5. Run `npx prisma generate` to generate the Prisma client

## Code Style

- **TypeScript** — strict mode enabled, no `any` without justification
- **Components** — follow the design system in `BRAND_GUIDELINES.md`
- **Naming** — PascalCase for components, camelCase for functions/variables
- **Imports** — use `@/` path aliases, not relative paths

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with clear commit messages
3. Run `npm run typecheck` to verify TypeScript
4. Run `npm run lint` to check code style
5. Open a PR with a clear description of what you changed and why

## Design System

All UI changes must follow the design system:

- **Dark only** — no light mode additions
- **Monospace** — use `font-mono` for all UI text
- **No gradients** — solid colors only
- **No shadows** — use borders instead
- **Uppercase labels** — with `tracking-widest` and `text-[10px]`

See `BRAND_GUIDELINES.md` for full details.

## Reporting Issues

Use the GitHub issue templates:
- **Bug report** — for things that are broken
- **Feature request** — for things you'd like to see

## Security

Do NOT open public issues for security vulnerabilities. See [SECURITY.md](./SECURITY.md) for responsible disclosure.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
