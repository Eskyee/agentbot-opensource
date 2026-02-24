# AGENTBOT PROJECT CONTEXT - READ THIS FIRST

**Last Updated:** 2026-02-24  
**Status:** Strategic planning complete, ready for execution  
**Current Phase:** Week 1 of 90-day roadmap

---

## PROJECT OVERVIEW

**What is Agentbot?**
Agentbot is the autonomous agent OS for underground music collectives. We enable crypto-native tools for royalty splits, talent booking, and treasury management. Built by ravers, for ravers.

**Mission:** Give underground collectives autonomy over platforms. No gatekeepers, no middlemen, just agents.

**Target Market:** 10,000+ underground collectives globally (Techno, DnB, Rave scenes)

**TAM:** £150M+ annually

---

## CURRENT STATE (2026-02-24)

### What's Built
- ✅ Next.js web app (deployed to agentbot.raveculture.xyz)
- ✅ Dashboard with wallet integration
- ✅ Marketplace with 10+ agent templates
- ✅ Base blockchain integration (CDP SDK installed)
- ✅ Rave Event Agent (200+ lines, production-ready)
- ✅ Community Treasury Agent (250+ lines)
- ✅ Verified Human Badge feature
- ✅ Mobile-responsive UI

### What's NOT Built Yet
- ❌ Royalty-Split Agent (designed, not implemented)
- ❌ Talent Booking Marketplace (designed, not implemented)
- ❌ Merch Agent (designed, not implemented)
- ❌ Agent-to-Agent Protocol (designed, not implemented)
- ❌ Smart contracts (none deployed yet)
- ❌ Real users (0 beta collectives onboarded)
- ❌ USDC processed (£0 so far)

### Critical Gap
**We have features but NO USERS.** The audit (see `AGENTBOT_AUDIT.md`) gave us a C+ grade. We need to stop building and start selling.

---

## STRATEGIC DOCUMENTS (READ THESE)

### Week 1: Strategic Foundation
1. **`AGENTBOT_AUDIT.md`** - Brutal honest assessment
   - Grade: C+ (potential A if we execute)
   - Key finding: Stop building, start selling
   - Need 5 beta users NOW

2. **`MANIFESTO.md`** - Ideological positioning
   - Anti-platform, pro-crypto, pro-culture
   - "Built by ravers, for ravers"
   - This is a movement, not a product

3. **`MARKET_POSITIONING.md`** - Competitive analysis
   - vs. Eventbrite (corporate, Web2)
   - vs. Bandcamp (music-only, no events)
   - vs. Stripe (infrastructure, KYC friction)
   - Our moat: Agent-to-agent network effects

4. **`UNDERGROUND_ECONOMY_RESEARCH.md`** - Market validation
   - 10,000+ collectives globally
   - £150M+ TAM
   - Pain points ranked (royalty splits #1)
   - 2,000 crypto-curious collectives

### Week 2: Product Design
5. **`ROYALTY_SPLIT_AGENT_DESIGN.md`** - Complete technical spec
   - Smart contract code (Solidity)
   - Database schema
   - API specification
   - UI/UX mockups
   - 5-week implementation plan

6. **`TALENT_BOOKING_DESIGN.md`** - Marketplace design
   - Trustless booking system
   - Smart contract escrow
   - Reputation system (onchain)
   - Network effects strategy

7. **`MERCH_AGENT_DESIGN.md`** - Pre-order automation
   - Printful/Shippo integration
   - Auto-trigger production
   - Design templates
   - Low complexity, high demand

8. **`90_DAY_ROADMAP.md`** - Execution plan
   - Week-by-week breakdown
   - Dependencies mapped
   - GTM strategy (crypto-native first)
   - Goal: 10 bookings, £10K USDC processed

9. **`AGENT_TO_AGENT_PROTOCOL.md`** - Network effects
   - Message format (JSON schema)
   - Webhook infrastructure
   - Onchain verification
   - THIS IS THE MOAT

---

## POSITIONING & MESSAGING

### Current Homepage (WRONG)
❌ "Deploy OpenClaw in seconds"
- Too technical
- Unclear value proposition
- No one knows what OpenClaw is

### New Homepage (CORRECT)
✅ "Split royalties instantly with your crew"
- Clear outcome
- Solves real pain point
- Underground language

### Positioning Statement
**"Agentbot is the autonomous agent OS for underground collectives that want transparent, crypto-native tools for royalty splits, talent booking, and treasury management - because Eventbrite is corporate, Bandcamp doesn't handle events, and Stripe is Web2."**

### Punchy Version
**"The OS for underground culture. No platforms. No gatekeepers. Just agents."**

---

## TECHNICAL ARCHITECTURE

### Stack
- **Frontend:** Next.js 16, React 18, TailwindCSS
- **Backend:** Node.js, TypeScript, PostgreSQL, Prisma
- **Blockchain:** Base (L2), Solidity 0.8.x, CDP SDK
- **Deployment:** Vercel
- **Database:** Supabase (planned)

### Repository Structure
```
/Users/raveculture/Documents/GitHub/agentbot/
├── web/                          # Next.js app
│   ├── app/
│   │   ├── components/           # UI components
│   │   ├── dashboard/            # Dashboard pages
│   │   ├── marketplace/          # Agent marketplace
│   │   ├── api/                  # API routes
│   │   └── layout.tsx
│   ├── package.json
│   └── .npmrc
├── agent-templates/              # Agent code
│   ├── rave-event-agent.ts
│   ├── community-treasury-agent.ts
│   └── README.md
├── AGENTBOT_AUDIT.md            # Strategic docs
├── MANIFESTO.md
├── MARKET_POSITIONING.md
├── UNDERGROUND_ECONOMY_RESEARCH.md
├── ROYALTY_SPLIT_AGENT_DESIGN.md
├── TALENT_BOOKING_DESIGN.md
├── MERCH_AGENT_DESIGN.md
├── 90_DAY_ROADMAP.md
├── AGENT_TO_AGENT_PROTOCOL.md
└── WEEK_1_2_COMPLETE.md
```

### Key Files
- `web/app/page.tsx` - Homepage
- `web/app/dashboard/page.tsx` - Dashboard
- `web/app/marketplace/page.tsx` - Agent marketplace
- `web/app/components/Navbar.tsx` - Navigation
- `web/app/components/WalletCard.tsx` - Crypto wallet UI

### Environment Variables Needed
```
CDP_API_KEY_NAME=<coinbase-cdp-key>
CDP_API_KEY_PRIVATE_KEY=<coinbase-cdp-private-key>
DATABASE_URL=<postgresql-connection-string>
NEXT_PUBLIC_BASE_RPC_URL=<base-rpc-url>
```

---

## 90-DAY EXECUTION PLAN

### Week 1-2: Foundation (CURRENT)
- [ ] Smart contract development (RoyaltySplit.sol)
- [ ] Database schema
- [ ] Recruit 5 beta collectives
  - 2 Techno (Berlin/Amsterdam)
  - 2 DnB (London/Bristol)
  - 1 Rave (LA/NYC)

### Week 3-4: Royalty-Split MVP
- [ ] Frontend UI (create split, view history)
- [ ] CDP SDK integration
- [ ] Deploy to Base mainnet
- [ ] Onboard 5 beta users
- [ ] First real split executed

### Week 5-6: Iterate + Case Studies
- [ ] Fix bugs from beta feedback
- [ ] 3 case studies published
- [ ] £5K+ USDC processed
- [ ] 10+ splits created

### Week 7-8: Talent Booking Backend
- [ ] BookingEscrow.sol
- [ ] API endpoints
- [ ] Recruit 10 DJs

### Week 9-10: Talent Booking Frontend
- [ ] Marketplace UI
- [ ] Booking flow
- [ ] 5 bookings facilitated

### Week 11-12: Scale + Agent-to-Agent
- [ ] Agent-to-agent protocol
- [ ] 10 total bookings
- [ ] £10K+ USDC processed

---

## SUCCESS METRICS

### Week 4 (Royalty-Split MVP)
- ✅ 5 beta users onboarded
- ✅ 5+ splits created
- ✅ £1K+ USDC processed

### Week 6 (Iterate)
- ✅ 3 case studies published
- ✅ £5K+ USDC processed
- ✅ NPS > 50

### Week 12 (Scale)
- ✅ 10 bookings completed
- ✅ £10K+ USDC processed
- ✅ 20+ active users
- ✅ Agent-to-agent protocol live

---

## TARGET USERS

### Tier 1: Crypto-Native (Beta)
- **Techno crews:** Berlin (Herrensauna, Tresor), Amsterdam (De School)
- **DnB collectives:** London (Rupture, Metalheadz), Bristol (Dispatch)
- **Rave organizers:** LA (Desert Hearts), NYC (Unter)
- **Why:** Already using crypto, understand USDC, early adopters

### Tier 2: Crypto-Curious (Expansion)
- House collectives (Chicago, Detroit)
- Bass music (UK, Australia)
- Experimental (Global)

### Tier 3: Crypto-Skeptical (Long-term)
- Hip-Hop, Indie/Rock scenes
- Need education and onboarding

---

## PAIN POINTS (VALIDATED)

### 1. Manual Royalty Splits (CRITICAL)
- 80% of collectives struggle with this
- Manual spreadsheets, payment delays
- Trust issues ("Did I get paid correctly?")
- **Our solution:** Automatic USDC splits via smart contract

### 2. Chaotic Talent Booking (HIGH)
- 70% struggle with bookings
- DMs are broken, no contracts
- 40% report payment disputes
- **Our solution:** Trustless marketplace with escrow

### 3. Opaque Finances (HIGH)
- 60% struggle with treasury management
- No transparency, trust issues
- **Our solution:** Onchain treasury, transparent

### 4. Venue Finding (MEDIUM)
- 50% struggle with venue finding
- No verification system
- **Our solution:** Verified venue marketplace (future)

### 5. Manual Promotion (MEDIUM)
- 70% spend 5+ hours/event on promotion
- **Our solution:** Agent-to-agent cross-promotion

---

## THE MOAT

### Why Competitors Can't Clone This

**Not the moat:**
- Culture positioning (can be copied)
- Crypto-native (Stripe is adding crypto)
- AI agents (OpenAI makes this easy)

**The real moat:**
1. **Network effects:** Agents talking to each other
2. **Onchain reputation:** Verified booking/payment history
3. **Community ownership:** Built with the scene, not for them
4. **First-mover advantage:** 6-month window to lock in 500 collectives

**Agent-to-Agent Protocol = Moat**
- Event agent → DJ agent → Basefmbot → Royalty-split
- More agents = more value
- Competitors can't clone a network

---

## WHAT NOT TO DO

### ❌ Don't Build More Features
We have enough features. We need users.

### ❌ Don't Sell Infrastructure
"Deploy OpenClaw" means nothing. Sell outcomes: "Split royalties instantly"

### ❌ Don't Target Everyone
Start narrow (crypto-native Techno/DnB), prove value, expand.

### ❌ Don't Ignore Feedback
Beta users shape the product. Listen and iterate.

### ❌ Don't Launch Without Users
10 real bookings > 100 features. Focus on traction.

---

## WHAT TO DO

### ✅ Focus on ONE Agent
Royalty-split agent only. Nail it before moving to talent booking.

### ✅ Get 5 Beta Users THIS WEEK
Reach out to crypto-native collectives. Free access for feedback.

### ✅ Ship Fast, Iterate
MVP in 4 weeks. Fix bugs based on real usage.

### ✅ Build in Public
Share progress, case studies, testimonials. Word-of-mouth growth.

### ✅ Measure What Matters
USDC processed, bookings completed, user satisfaction. Not vanity metrics.

---

## IMMEDIATE NEXT STEPS (THIS WEEK)

### 1. Rewrite Homepage
- Change "Deploy OpenClaw in seconds" → "Split royalties instantly with your crew"
- Add "How it works" in 3 steps
- Show outcomes, not infrastructure

### 2. Recruit 5 Beta Collectives
- Direct outreach on Telegram/Farcaster
- Pitch: "Free beta access, help us build"
- Target: 2 Techno, 2 DnB, 1 Rave

### 3. Start Smart Contract Development
- RoyaltySplit.sol (see `ROYALTY_SPLIT_AGENT_DESIGN.md`)
- Unit tests (100% coverage)
- Deploy to Base Sepolia testnet

---

## WORKING WITH THIS PROJECT

### If You're Asked to Build a Feature
1. **Check if it's in the roadmap** (`90_DAY_ROADMAP.md`)
2. **Prioritize royalty-split agent** (everything else waits)
3. **Read the design doc** (complete specs exist)
4. **Focus on MVP** (no gold-plating)

### If You're Asked to Write Copy
1. **Read the manifesto** (`MANIFESTO.md`)
2. **Use underground language** (not corporate)
3. **Show outcomes, not tech** ("Split royalties" not "Deploy agents")
4. **Be authentic** (we're part of the scene)

### If You're Asked About Strategy
1. **Read the audit** (`AGENTBOT_AUDIT.md`)
2. **Focus on users** (not features)
3. **Target crypto-native first** (Techno/DnB)
4. **Network effects = moat** (agent-to-agent protocol)

### If You're Asked About Market
1. **Read the research** (`UNDERGROUND_ECONOMY_RESEARCH.md`)
2. **10K+ collectives, £150M TAM** (validated)
3. **Royalty splits = #1 pain point** (80% struggle)
4. **2,000 crypto-curious** (beachhead market)

---

## KEY PRINCIPLES

### 1. Culture First, Always
If it doesn't serve the underground, we don't build it.

### 2. Crypto That Makes Sense
Only use crypto when it solves a real problem (transparency, trustless, borderless).

### 3. No Gatekeepers
No approval process, no featured section, no algorithm. The network is the platform.

### 4. Community Owned
Built with the underground, not for them. Beta users shape the product.

### 5. Agents, Not Features
If it doesn't do work autonomously, it's not an agent.

---

## COMMON QUESTIONS

**Q: Why focus on royalty-split agent first?**
A: It's the #1 pain point (80% of collectives struggle), clearest value prop, and crypto makes perfect sense here.

**Q: Why not build all agents at once?**
A: We need to prove value with ONE agent before expanding. 10 real bookings > 100 features.

**Q: Why target Techno/DnB scenes?**
A: They're crypto-native, progressive, anti-establishment, and early adopters. Easier to sell to them first.

**Q: What's the moat?**
A: Agent-to-agent network effects. Competitors can build individual agents, but they can't clone a network.

**Q: When do we launch publicly?**
A: After 5 beta collectives are using it and loving it. Week 6 of the roadmap.

**Q: What if users want feature X?**
A: If it's not in the roadmap, defer it. Focus on MVP. Iterate based on real usage.

---

## CONTACT & RESOURCES

**Live Site:** https://agentbot.raveculture.xyz  
**GitHub:** https://github.com/Eskyee/agentbot  
**Deployment:** Vercel (auto-deploy from main branch)

**Key Documents:**
- Strategic: `AGENTBOT_AUDIT.md`, `MANIFESTO.md`, `MARKET_POSITIONING.md`
- Technical: `ROYALTY_SPLIT_AGENT_DESIGN.md`, `TALENT_BOOKING_DESIGN.md`
- Execution: `90_DAY_ROADMAP.md`, `AGENT_TO_AGENT_PROTOCOL.md`

---

## FINAL NOTE

**We're at a critical juncture.** We have strong strategy, clear positioning, and complete designs. But we have ZERO users.

**The next 90 days determine success or failure.**

Focus: Real users over features. 10 bookings > 100 features.

Let's build. 🎧

---

**Last Updated:** 2026-02-24  
**Next Review:** 2026-03-03 (after Week 1-2 execution)
