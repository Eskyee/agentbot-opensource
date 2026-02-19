# Agentbot — Product Requirements Document

## One-Liner
Deploy your personal AI assistant in 60 seconds. No servers, no terminal, no BS.

## Problem
OpenClaw is powerful but setup takes 1-4 hours:
- Buy VPS
- SSH in
- Install Node.js
- Clone repo
- Configure Docker
- Create Telegram bot
- Set API keys
- Manage SSL
- Keep it running 24/7

**90% of interested users give up.**

## Solution
Agentbot handles everything:
1. User signs up
2. Picks AI provider (or uses free tier)
3. Creates Telegram bot (guided)
4. Pastes token
5. We provision container + connect + go live
6. **Under 60 seconds**

## Target Users

1. **Non-technical people** who saw OpenClaw on Twitter
2. **Developers** who don't want to manage infra
3. **Small teams** wanting shared AI assistant
4. **Affordable entry pricing** (£19/mo Starter vs higher-priced competitors)

---

## MVP Features (Week 1-2)

### Landing Page
- Hero: "Your AI assistant in 60 seconds"
- How it works (3 steps)
- Pricing table
- Deploy button → signup

### Onboarding Flow
1. Sign up (email or Google)
2. Choose plan (Free trial / Starter / Pro)
3. Choose AI provider:
   - Groq (free, we provide)
   - Anthropic (paste key)
   - OpenAI (paste key)
4. Connect Telegram:
   - Step-by-step BotFather guide with screenshots
   - Paste bot token
   - We validate it works
5. Deploy → progress bar → "You're live!"

### Dashboard
- Status (online/offline)
- Restart button
- View logs (last 100 lines)
- Update API key
- Usage stats (uptime, restarts)

### Backend
- Docker containers on GCP
- Caddy reverse proxy
- PostgreSQL for user data
- Stripe/Razorpay payments
- Daily backups to GCS

---

## Pricing

| Plan | GBP | Resources |
|------|-----|-----------|
| Trial | Free (3 days) | Shared, Groq |
| Starter | £19/mo | Shared, BYOK |
| Pro | £49/mo | Dedicated container |

---

## Phase 2 (Week 3-4)
- WhatsApp channel support
- Pre-installed skills (Email, Calendar)
- Custom domain per user
- Team/multi-user support

## Phase 3 (Month 2)
- Skill marketplace
- Backup/restore UI
- Analytics dashboard
- White-label for agencies

---

## Success Metrics

- **Week 1:** 50 signups, 10 trials
- **Week 2:** 5 paid conversions
- **Month 1:** 50 paying users, £1K MRR
- **Month 3:** 200 paying users, £8K MRR

## Competitive Advantage

1. **Simple pricing** — clear tiers with trial → Starter (£19) → Pro (£49)
2. **Free trial** — No card required, others don't offer
3. **Speed** — 60 seconds vs 5 minutes (SimpleClaw)
4. **Reliability** — Daily backups, auto-restore

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| OpenClaw changes breaking | Pin versions, test before update |
| API provider rate limits | Fallback chain (Groq → Gemini → OpenRouter) |
| User data breach | Encryption at rest, minimal access |
| GCP credits run out | Profitable before credits expire (6 users = break-even) |
