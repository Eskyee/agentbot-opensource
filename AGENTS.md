# AGENTS.md — Developer Guide

This file provides setup and development instructions for working on the Agentbot codebase. It is also used by AI coding assistants (Claude Code, Cursor, etc.) for context.

## Project Structure

```
agentbot/
├── web/                    # Next.js frontend application
│   ├── app/               # App router pages
│   ├── components/        # React components
│   ├── lib/              # Utilities and helpers
│   └── prisma/            # Database schema
├── agentbot-backend/      # Express.js backend API
│   └── src/              # TypeScript source
├── skills/               # Claude Code skills
└── mintlify-docs/        # Documentation site
```

## Development Commands

### Web Application (Next.js)
```bash
cd web

# Start development server
npm run dev

# Build for production
npm run build

# Run tests (Playwright)
npm run test

# Lint code
npm run lint

# Generate Prisma client
npx prisma generate
```

### Backend API (Express)
```bash
cd agentbot-backend

# Start development server
npm run dev

# Run tests (Jest)
npm run test

# Build TypeScript
npm run build
```

## Environment Setup

Copy `.env.example` to `.env` and configure:

**Web (.env):**
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — Auth secret
- `NEXTAUTH_URL` — Auth URL
- `DISCORD_CLIENT_ID/SECRET` — Discord OAuth
- `TELEGRAM_BOT_TOKEN` — Telegram bot token
- `STRIPE_SECRET_KEY` — Payment processing

**Backend (.env):**
- `PORT` — Server port (default: 4000)
- `DATABASE_URL` — PostgreSQL connection
- `JWT_SECRET` — JWT signing secret

## Database

Agentbot uses Prisma with PostgreSQL. Run migrations:
```bash
cd web && npx prisma migrate dev
```

## Testing

- **Unit tests:** Jest in backend
- **E2E tests:** Playwright in web
- Run all tests: `npm test` in each directory

## Code Style

- Use ESLint and Prettier
- Follow existing component patterns in `web/components/`
- Use TypeScript strictly
- Zod for validation, Prisma for ORM

## Key Integrations

- **Auth:** NextAuth.js with multiple providers
- **Payments:** Stripe with subscription tiers
- **Messaging:** Telegram, Discord, WhatsApp bots
- **Blockchain:** Wagmi/Viem for Base network
- **AI:** OpenAI, Anthropic via AI SDK
- **Streaming:** Mux for live video

## Common Tasks

### Adding a new bot platform
1. Create skill: `skills/add-[platform].md`
2. Add API route: `web/app/api/bot/[platform]/route.ts`
3. Add UI component: `web/components/bot/[Platform]Config.tsx`

### Adding a new API endpoint
1. Create route: `web/app/api/[feature]/route.ts`
2. Add Zod validation schema
3. Add to API docs

## Security

- Never commit secrets to git
- Use BotID for bot protection
- Enable 2FA on all accounts
- Run `npm audit` regularly
