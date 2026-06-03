# Contributing to Agentbot

Thank you for your interest in contributing to Agentbot! This guide will help you get started.

## Development Setup

```bash
git clone https://github.com/raveculture/agentbot.git
cd agentbot
cp .env.example .env
# Edit .env with your API keys
```

### Running Locally

```bash
# Frontend (Next.js)
cd web && npm install && npm run dev

# Backend (new terminal)
cd agentbot-backend && npm install && npm run dev
```

## Project Structure

```
agentbot/
├── web/                    # Next.js frontend
│   ├── app/               # App router pages
│   ├── components/       # React components
│   └── lib/              # Utilities
├── agentbot-backend/      # Express API server
│   └── src/
│       ├── routes/       # API endpoints
│       └── services/     # Business logic
└── skills/               # Claude Code skills
```

## Adding New Skills

Create a new skill in the `skills/` directory:

```typescript
// skills/my-skill.md
---
name: my-skill
description: What my skill does
---

# My Skill

## Setup

Instructions for setting up the skill...

## Usage

How to use the skill...
```

## Adding New Agents

Define agent configurations in the backend:

```typescript
const agent = {
  name: 'my-agent',
  brain: 'llama-3.3-70b',
  skills: ['web-search', 'my-skill'],
  systemPrompt: 'You are a helpful agent...'
}
```

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Code Style

- Use TypeScript for new code
- Run `prettier` before committing
- Follow existing patterns in the codebase

## License

By contributing to Agentbot, you agree that your contributions will be licensed under the MIT License.
