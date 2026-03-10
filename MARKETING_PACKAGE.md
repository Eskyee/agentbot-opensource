# Marketing & Growth Package

## 1. IMPROVED HERO & PRICING COPY

### Current Issues:
- Hero is too technical ("Deploy OpenClaw in Seconds")
- Pricing descriptions are confusing ("+ usage" - what usage?)
- Missing clear value proposition
- No social proof

---

### NEW HERO COPY

**Headline Options:**

1. **Primary:** "Your AI Agent. Hosted. Always Online."
2. **Alternative:** "Deploy Your Personal AI Assistant in One Click"
3. **For Crypto/Underground:** "Onchain AI Agents with Verified Human Badges"

**Recommended Hero:**

```tsx
<h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
  Your AI Agent. Hosted. Always Online.
</h1>

<p className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto">
  Deploy an AI assistant that remembers everything, thinks deeply, and works 24/7 
  across Telegram, Discord, and WhatsApp. No server management. Just conversation.
</p>

<p className="mt-4 text-base text-gray-500 max-w-2xl mx-auto">
  Built on Kimi K2.5 with 128K context window. Bring your own API key—no markups, no credits.
</p>
```

**Subheadline:**
"From £19/month. First 14 days free."

---

### IMPROVED PRICING DESCRIPTIONS

| Plan | Current | Improved |
|------|---------|----------|
| **Starter** | "1 AI Agent, 10GB storage, Telegram channel" | "Perfect for personal use. 1 agent, 2GB RAM, Telegram." |
| **Pro** | "1 AI Agent, 50GB storage, Telegram + WhatsApp, Custom domain, + usage" | "Most popular. Custom domain, WhatsApp, 4GB RAM." |
| **Scale** | "3 AI Agents, 100GB storage, All channels, Advanced analytics" | "Growing teams. 3 agents, 8GB RAM, white-label ready." |
| **Enterprise** | "Unlimited agents, 500GB storage, White-label, 24/7 support" | "Full power. Unlimited agents, dedicated support." |
| **White Glove** | "Premium - Everything in Enterprise, 10x resources, Dedicated account manager" | "Maximum performance. 32GB RAM, 8 CPU, priority everything." |

**Key Changes:**
- Remove confusing "+ usage" text
- Lead with the benefit, not features
- Add social proof: "Most popular" badge on Pro
- Clearer resource specs

---

### PRICING PAGE HERO

```tsx
<h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-100 tracking-tight">
  Simple pricing. No surprises.
</h1>
<p className="mt-4 text-lg sm:text-xl text-gray-400">
  From £19/month. Scale as you grow. Cancel anytime.
</p>
```

---

## 2. ONE-PAGE INVESTOR/SALES PITCH

### Agentbot Pitch Deck (1 Page)

---

# THE OPPORTUNITY

**Every developer wants an AI agent. Most can't deploy one.**

AI assistants are the next platform shift—but infrastructure is the bottleneck. 
Self-hosting is complex. SaaS options are expensive and lock you in.

---

# THE SOLUTION

**Agentbot = OpenClaw as a Service**

- Deploy your personal AI agent in one click
- Runs on your API key—no markup, no credit system
- 24/7 availability, zero server management
- Multi-channel: Telegram, Discord, WhatsApp
- Custom domains + white-label for agencies

---

# MARKET SIZE

| Segment | TAM | Notes |
|---------|-----|-------|
| Individual developers | £2B | Hobbyists, makers |
| Small teams | £8B | Startups, agencies |
| Enterprise | £25B | Crypto, fintech |

**Total Addressable Market: £35B+**

---

# TRACTION

- ✅ Production live since Feb 2026
- ✅ A+ security grade (rare in AI agent space)
- ✅ 5 pricing tiers (£19-£199/mo)
- ✅ Stripe integrated, payments working
- ✅ Custom domain live: agentbot.raveculture.xyz

---

# COMPETITIVE ADVANTAGE

| Factor | Agentbot | Competitors |
|--------|----------|-------------|
| Security | A+ grade | C-D typical |
| Pricing | £19-199/mo | $49-500/mo |
| Custom domain | ✅ Yes | ❌ Rare |
| White-label | ✅ Yes | ❌ Rare |
| Your API key | ✅ No markup | ❌ Marked up 2-5x |
| OpenClaw ecosystem | ✅ Native | ❌ None |

---

# THE ASK

We're looking for our first 10 paying customers to validate product-market fit.

**Revenue target Year 1: £60K ARR**

---

# THE TEAM

[Your name] — Founder, Full-stack developer
[Optional: co-founder if you have one]

---

# CONTACT

- Website: agentbot.raveculture.xyz
- Email: [your email]
- X/Twitter: [your handle]

---

## 3. TWITTER/X THREADS

### Thread 1: Launch Announcement

```
🧵 I spent 3 months building a hosted AI agent platform. Here's what I learned:

1/ Building AI agents is easy. Deploying them is hard.

Most developers can create an AI assistant. But making it:
- Run 24/7
- Remember everything
- Connect to Telegram, Discord, WhatsApp
- Handle payments
- Scale on demand

...is a whole other problem.

2/ That's why I built Agentbot.

One-click deploy for OpenClaw (my favorite AI agent framework).

No server management. No complex Docker setup.
Just your API key and a conversation.

3/ The pricing innovation:

Most AI SaaS marks up API keys 2-5x.
We don't touch your key at all.

You bring your own. We handle the infrastructure.
From £19/month.

4/ Security was non-negotiable:

- A+ security grade
- Rate limiting
- CSRF protection
- Session auth on every route
- No debug routes in production

AI agents handle sensitive data. They need real security.

5/ The stack:

- Frontend: Next.js 16
- Backend: Node.js + Docker
- Payments: Stripe
- Auth: NextAuth
- Database: Neon (PostgreSQL)
- Hosting: Vercel + Render

6/ What's next:

First 10 customers. That's the goal.

If you want an AI agent that:
- Remembers everything
- Works everywhere
- Doesn't cost a fortune

→ agentbot.raveculture.xyz

7/ Also: we're verified humans. 🦞

Onchain attestation via Coinbase Verify.
Because in crypto/underground scenes, reputation matters.

DM me if you want early access.
```

---

### Thread 2: Problem/Solution

```
🧵 Why most AI agent products will fail:

The problem isn't the AI. It's the infrastructure.

Here's what I've learned building @agentbot for the last 3 months:

1/ "Just use LangChain" is not a product

Everyone can wrap an LLM. The moat is:
- Deployment
- Memory persistence  
- Multi-channel
- Scaling
- Security

2/ API key arbitrage is dying

The old model: "We'll use our API key and mark it up 3x"

No. Users are smart now. They know:
- API costs
- What markup looks like

We let users bring their own key. No markup.

3/ Security is a feature

Your AI agent has access to:
- Conversations
- API keys
- User data
- Maybe payment systems

If you're not taking security seriously, you're building a liability, not a product.

We got an A+ grade. Here's how:

[Thread on security implementation]

4/ The real competitor isn't another AI SaaS

It's "I'll just host it myself"

The only way to beat self-hosting:
- Make it 10x easier
- Make it cheaper than AWS
- Add features they can't DIY (white-label, multi-channel)

5/ That's Agentbot.

One-click deploy.
£19-199/month.
Your keys, your data.

→ agentbot.raveculture.xyz

What's your take? Am I wrong?
```

---

### Thread 3: Feature Highlight

```
🧵 5 features that make Agentbot different:

1/ Custom Domains

Your agent at: yourname.com/chat
Not: agentbot.io/u/yourname

White-label ready. Clients never know.

2/ Multi-Channel

Telegram + Discord + WhatsApp
One agent, everywhere.

Switching channels shouldn't mean retraining your AI.

3/ Persistent Memory

128K context window via Kimi K2.5
Your agent remembers conversations for months.

Not "session" memory. Real memory.

4/ No Credit System

Bring your own API key.
We don't mark it up.

You know exactly what you're paying.

5/ A+ Security Grade

- Rate limiting
- CSRF tokens
- Session auth everywhere
- No debug routes in prod

Your agent, your data, your keys—secure.

→ agentbot.raveculture.xyz

What feature would you want most?
```

---

## 4. CUSTOMER INTERVIEW QUESTIONS

### Discovery Call Script

---

**Opening (2 min)**
"Thanks for chatting! I'm [name] from Agentbot. Mind if I ask a few questions to better understand what you're looking for?"

---

**Current Situation (5 min)**

1. "What are you currently using for AI assistance? (ChatGPT, Claude, self-hosted, other SaaS?)"

2. "What's your biggest pain point with your current setup?"

3. "How many people on your team need access to an AI agent?"

4. "Which channels do you use most? (Telegram, Discord, WhatsApp, web chat?)"

---

**Needs & Priorities (5 min)**

5. "When you imagine the 'perfect' AI agent setup, what's the #1 thing it does that yours doesn't today?"

6. "How important is custom branding/domain for your use case? (1-10)"

7. "What's your budget range for monthly AI infrastructure? (Under £20, £20-50, £50-100, £100+)"

8. "Are you currently self-hosting anything, or is everything SaaS?"

9. "What would make you say 'this is worth paying for' vs 'I could build this myself'?"

---

**The Close (3 min)**

10. "If we could deliver one thing that solves your biggest pain, what would it be?"

11. "What's the timeline—if you found the right solution, when would you want to start?"

12. "Who else on your team would be involved in this decision?"

---

**Email Follow-up Template:**

```
Subject: Quick follow-up from our chat

Hi [Name],

Thanks again for chatting!

As discussed, here's [the thing they mentioned wanting most]:
[link or explanation]

A few next steps:
1. [Action item]
2. [Action item]

Let me know if you have questions.

Cheers,
[Your name]
Agentbot
```

---

## 5. FEATURE PRIORITIZATION

### Build vs. Buy Matrix

| Feature | User Demand | Dev Effort | Priority |
|---------|-------------|------------|----------|
| **Multi-agent support** | High | Medium | P1 |
| **Web dashboard improvements** | High | Medium | P1 |
| **Usage analytics** | Medium | Low | P2 |
| **更多 channels (Slack, SMS)** | Medium | High | P2 |
| **Agent templates** | Medium | Medium | P3 |
| **API access** | Low | High | P3 |
| **Webhooks** | Low | Medium | P3 |
| **Mobile app** | Low | Very High | P4 |

---

### Recommendations by Phase

**Phase 1: Get to 10 Customers (Now)**
- Focus: Core experience (deploy, chat, channels)
- Don't add features yet
- Learn from early users

**Phase 2: Validate (Months 2-3)**
- Usage analytics dashboard
- Agent templates (pre-configured for common use cases)
- Better onboarding

**Phase 3: Scale (Months 4-6)**
- Multi-agent support
- API access
- Webhooks for integrations

---

### Feature Request Template

```
User: [Name]
Feature: [What they want]
Pain level: [1-10]
Would pay extra: [Yes/No + how much]
Competitor has: [Yes/No]

---
```

Track all requests in a simple Notion/Airtable. Review monthly.

---

## 6. PRICING PACKAGING SUGGESTIONS

### Current Issues:
- "Pro" says "+ usage" but doesn't clarify
- No annual discount (shown but disabled)
- Missing urgency/social proof

---

### Recommended Changes:

**1. Simplify Pro Description:**
```
Before: "1 AI Agent, 50GB storage, Telegram + WhatsApp, Custom domain, + usage"
After: "For professionals. Custom domain, WhatsApp support, priority responses."
```

**2. Add Annual Discount:**
- Enable the yearly toggle (currently disabled)
- 20% off = £182/year for Starter vs £228
- Great for locking in early customers

**3. Add "Usage" Clarity:**

If usage-based pricing is coming, be transparent:
```
"Pro: £39/month + AI usage (you pay your API provider directly)"
```

Or remove "usage" for now and keep it simple.

---

### Alternative Packaging Options:

**Option A: Usage-Based (Future)**
- Free tier: 100 messages/mo
- £19: Unlimited messages, 1 agent
- £49: 5 agents, custom domain
- Custom: Enterprise

**Option B: Feature-Led**
- Personal: £19 (1 agent, Telegram)
- Pro: £39 (multi-channel, custom domain)
- Team: £79 (3 agents, analytics)
- Business: £149 (unlimited, white-label)

**Option C: Resource-Led (Current, refine)**
- Keep as-is, just clean up descriptions

---

### Quick Wins:

1. ✅ Enable annual billing (20% discount)
2. ✅ Remove confusing "+ usage" from Pro
3. ✅ Add "14-day free trial" badge to all plans
4. ✅ Add "Most Popular" to Pro (already there, keep it)
5. ✅ Add "Cancel anytime" to hero

---

## 7. COMBINED ACTION PLAN

### This Week:
- [ ] Update hero copy on landing page
- [ ] Clean up pricing descriptions
- [ ] Enable annual billing toggle
- [ ] Post Thread #1 (Launch)

### This Month:
- [ ] Get 5 customer interviews
- [ ] Post Thread #2-3
- [ ] Add usage analytics (Phase 2 feature)
- [ ] Get first 3 paying customers

### This Quarter:
- [ ] Hit 10 customers
- [ ] Evaluate feature priorities
- [ ] Consider usage-based pricing option
