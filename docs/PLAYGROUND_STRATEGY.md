# Agentbot Playground Strategy

Based on gitlawb's Playground - AI-powered app generation from natural language.

## What is a Playground?

A UI where users:
1. Describe an app in natural language ("build me a shopping app")
2. AI generates the code
3. App renders live instantly
4. User can deploy/use it

## Gitlawb Playground Features

- Natural language → single HTML file
- Live preview in sandbox
- Token-gated usage (free tier → hold $GITLAWB)
- Examples: games, tools, editors
- Deploy to gitlawb network

## Agentbot Playground Design

### Core Features
1. **Prompt Input** - Text area for describing app
2. **Generate Button** - AI generates code
3. **Live Preview** - Render app in sandboxed iframe
4. **Deploy Button** - Deploy to agentbot

### Token Gating (Future)
```
Free: 3 prompts/day
Hold $AGENTBOT → more prompts
```

### Examples to Show
- "A todo app with dark theme"
- "A weather dashboard"
- "A simple snake game"
- "A markdown editor"

## Implementation Plan

1. Create `/playground` page
2. Add AI generation (use existing /api/ai route)
3. Add live preview iframe
4. Add deploy functionality

## Tech Stack

- Next.js frontend
- AI generation via OpenAI/Anthropic
- Sandboxed preview (iframe with srcdoc)
- Deploy to Vercel/Railway (future)

---

*Inspired by gitlawb Playground*