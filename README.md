# Agentbot

**This repo is private production code.**

## 🌟 Open Source Version

Go to: **[github.com/Eskyee/agentbot-opensource](https://github.com/Eskyee/agentbot-opensource)**

The open source repo shows our architecture, CI quality, and code standards.

## Production

- **Site:** [agentbot.raveculture.xyz](https://agentbot.raveculture.xyz)
- **Docs:** [raveculture.mintlify.app](https://raveculture.mintlify.app)

## Vercel Agent

This repo is configured with a root [AGENTS.md](./AGENTS.md) for AI code review context.

Recommended setup in Vercel:
- Enable **Vercel Agent**
- Enable **Code Review** for this repository
- Include private repositories
- Review draft PRs only if you want early feedback on work in progress

Useful GitHub PR comments:
- `@vercel run a review`
- `@vercel fix the type errors`
- `@vercel why is this failing?`

Review focus for this repo:
- provisioning and Prisma state drift
- dashboard data integrity
- Vercel build/runtime regressions
- auth, webhook, and token security

## License

MIT
