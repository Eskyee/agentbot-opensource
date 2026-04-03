# Contributing to Agentbot

Thank you for your interest in contributing. Here's everything you need to go from zero to running locally.

---

## Prerequisites

- Node.js 20+
- Docker + Docker Compose
- PostgreSQL client (or use the Docker setup)
- A [Neon](https://neon.tech) or local PostgreSQL instance
- An [OpenRouter](https://openrouter.ai) API key (free tier works)

---

## Local Setup — Step by Step

### 1. Clone and install

```bash
git clone https://github.com/Eskyee/agentbot-opensource.git
cd agentbot-opensource
npm install
```

### 2. Or open in GitHub Codespaces

Use the repository's checked-in devcontainer in [`.devcontainer/devcontainer.json`](./.devcontainer/devcontainer.json). The container installs dependencies automatically and forwards port `3000`.

### 3. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in at minimum:

| Variable | Where to get it |
|----------|----------------|
| `DATABASE_URL` | Local Postgres or [Neon](https://neon.tech) free tier |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` |
| `INTERNAL_API_KEY` | `openssl rand -hex 32` |
| `OPENROUTER_API_KEY` | [openrouter.ai/keys](https://openrouter.ai/keys) |
| `NEXT_PUBLIC_OPENCLAW_GATEWAY_URL` | `https://openclaw-gw-ui-production.up.railway.app` |
| `OPENCLAW_GATEWAY_TOKEN` | Contact us in Discord for a dev token |

Everything else is optional for basic local development.

### 4. Start infrastructure

```bash
docker-compose up -d   # starts postgres + redis
```

### 5. Set up the database

Run the root Prisma commands:

```bash
npm run db:generate
npm run db:push       # creates all tables
```

### 6. Start the frontend

```bash
npm run dev            # runs on http://localhost:3000
```

Visit `http://localhost:3000` — you should see the Agentbot dashboard.

### 7. (Optional) Start the backend API

```bash
cd agentbot-backend
npm install
npm run dev            # runs on http://localhost:3001
```

---

## Project Structure

```
agentbot-opensource/
├── .devcontainer/           # GitHub Codespaces configuration
├── src/                     # Frontend shared code + reference server
│   ├── components/          # UI components
│   ├── prisma/              # Schema
│   └── server/              # Express routes and backend utilities
├── agentbot-backend/        # Optional backend workspace
└── docker-compose.yml       # Local postgres + redis
```

---

## Code Style

- **TypeScript strict** — no `any` without justification
- **`spawn()` not `exec()`** — no shell injection vectors
- **`getAuthSession()`** — all protected API routes must call this first
- **Fail-closed** — auth failures return 404 (not 401) to avoid enumeration
- **No secrets in source** — use `process.env` only, never hardcode values

### UI conventions

- **Dark only** — no light mode additions
- **Monospace** — `font-mono` for all UI text
- **No gradients** — solid colors only
- **No shadows** — use borders instead
- **Uppercase labels** — `tracking-widest` + `text-[10px]`

Full design spec: [BRAND_GUIDELINES.md](./BRAND_GUIDELINES.md)

---

## Making Changes

### Branch strategy

```bash
git checkout -b feat/your-feature-name   # new features
git checkout -b fix/your-bug-description  # bug fixes
git checkout -b docs/your-improvement     # documentation
```

### Before opening a PR

```bash
npm run typecheck   # must pass with zero errors
npm run lint        # currently mirrors CI and runs a strict TS no-emit check
```

### PR checklist

- [ ] TypeScript compiles with no errors
- [ ] New API routes call `getAuthSession()` at the top
- [ ] No secrets or API keys committed
- [ ] PR description explains what changed and why
- [ ] Screenshots/recordings for UI changes

---

## Good First Issues

| Area | What to tackle |
|------|---------------|
| Skills | Extend skill data flows in `src/prisma/schema.prisma` and the shared UI surfaces |
| Channels | Add a new channel adapter (Slack, SMS, etc.) |
| UI | Improve dashboard components |
| Docs | Expand the docs site |
| Tests | Write Jest tests for API routes |

---

## Reporting Issues

Use GitHub Issues:
- **Bug report** — for broken behaviour
- **Feature request** — for things you'd like to see

**Security vulnerabilities** — do NOT open public issues. See [SECURITY.md](./SECURITY.md) for responsible disclosure.

---

## Community

- 💬 [Discord](https://discord.gg/eskyee) — best place for questions
- 🚀 [Live platform](https://agentbot.raveculture.xyz)
- 📖 [Docs](https://docs.agentbot.raveculture.xyz)

---

## License

By contributing, you agree your changes will be licensed under the MIT License.
