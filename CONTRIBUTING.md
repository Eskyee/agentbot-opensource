# Contributing to Agentbot

Thank you for your interest in contributing to Agentbot! This guide will help you get started.

## Getting Started

1. **Fork the repository** - Click the "Fork" button on GitHub
2. **Clone your fork** - `git clone https://github.com/YOUR_USERNAME/agentbot.git`
3. **Add upstream** - `git remote add upstream https://github.com/raveculture/agentbot.git`

## Development Setup

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Run locally
cd web && npm run dev
```

## Code Style

- Use **TypeScript** for all new code
- Run **Prettier** before committing: `npm run format`
- Follow existing code conventions

## Submitting Changes

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Run tests: `npm test`
4. Commit with clear messages: `git commit -m "Add feature: my feature"`
5. Push to your fork: `git push origin feature/my-feature`
6. Open a Pull Request

## Pull Request Guidelines

- Describe what your PR does
- Link any related issues
- Include screenshots for UI changes
- Ensure all tests pass

## Reporting Bugs

Use GitHub Issues with:
- Clear title
- Steps to reproduce
- Expected vs actual behavior
- Environment details

## Feature Requests

Open an issue with:
- Clear description
- Use case
- Any implementation ideas

## Code of Conduct

Be respectful and inclusive. We follow the [Contributor Covenant](https://www.contributor-covenant.org).

## Questions?

Join our [Discord](https://discord.gg/eskyee) or open a GitHub discussion.
