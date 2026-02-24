# Agentbot Underground Culture - TODO & Roadmap

## 🎯 Current Status
- ✅ Rave Event Agent (MVP)
- ✅ Community Treasury Agent (MVP)
- ✅ Crypto Wallet Integration (UI ready)
- ✅ Marketplace with templates
- ✅ Blog post announcement

---

## 🚀 Phase 1: Core Infrastructure (Weeks 1-2)

### High Priority
- [ ] Complete CDP SDK integration
  - [ ] Proper wallet creation API
  - [ ] USDC transfer functionality
  - [ ] Gasless transaction support
  - [ ] Balance checking
  
- [ ] Database schema implementation
  - [ ] Events table
  - [ ] Guest lists
  - [ ] Treasury transactions
  - [ ] Wallet storage (encrypted)
  
- [ ] Telegram bot integration
  - [ ] Event reminders
  - [ ] Treasury alerts
  - [ ] Guest list notifications

### Medium Priority
- [ ] Multi-sig wallet support
  - [ ] 2-of-3 signatures for treasury
  - [ ] Approval workflow
  - [ ] Transaction history

- [ ] Testing with beta collectives
  - [ ] Identify 5 underground crews
  - [ ] Onboard and train
  - [ ] Gather feedback

---

## 🎨 Phase 2: New Agent Templates (Weeks 3-6)

### 1. Royalty Split Agent 💰
**Priority:** HIGH - Real pain point

**Features:**
- [ ] Automatic royalty distribution to multiple wallets
- [ ] Splits triggered by sales/streams
- [ ] Smart contract escrow for collabs
- [ ] Milestone-based payment release
- [ ] Transparent split history

**Use Case:** Producer collective releases track. Agent automatically splits revenue 40/30/30 to three members in USDC.

**Technical:**
- Smart contract for split logic
- Webhook for sales events
- Multi-recipient transfers

---

### 2. Talent Booking Agent 🎤
**Priority:** HIGH - Game-changer for underground

**Features:**
- [ ] Browse available talent (DJs, producers, performers)
- [ ] Rates and availability calendar
- [ ] Auto-negotiate rates in USDC
- [ ] Contract generation + onchain signature
- [ ] Payment release on performance date
- [ ] Past gig history and reviews

**Use Case:** Collective needs DJ for Friday. Agent finds available talent, negotiates rate, generates contract, holds payment in escrow, releases after gig.

**Technical:**
- Talent database
- Availability calendar
- Contract templates
- Escrow smart contract
- Reputation system

---

### 3. Community Insights Agent 📊
**Priority:** MEDIUM - Data-driven decisions

**Features:**
- [ ] Track event attendance patterns
- [ ] Analyze fan loyalty over time
- [ ] Suggest optimal event timing
- [ ] Predict attendance based on history
- [ ] Engagement metrics (Telegram, social)
- [ ] "What resonates" reports

**Use Case:** Agent analyzes past 6 months: "Friday warehouse parties average 180 people. Saturday club nights only 90. Next event: Friday, expect 200+."

**Technical:**
- Analytics database
- ML for predictions
- Social media API integration
- Reporting dashboard

---

### 4. Talent Marketplace Agent 🎵
**Priority:** MEDIUM - Decentralized SoundCloud

**Features:**
- [ ] Browse beats, remixes, unreleased tracks
- [ ] Buy directly in USDC (no middleman)
- [ ] Producers list work + rates
- [ ] Preview tracks
- [ ] License management
- [ ] Discovery algorithm

**Use Case:** Producer uploads beat for 50 USDC. Collective browses marketplace, previews, buys license instantly. Producer gets paid, buyer gets track.

**Technical:**
- IPFS for audio storage
- Metadata database
- Payment processing
- License NFTs
- Search/discovery

---

### 5. Merch Agent 👕
**Priority:** LOW - Nice to have

**Features:**
- [ ] Design merch (vinyl, cassettes, tees)
- [ ] Pre-order campaigns with USDC
- [ ] Inventory tracking
- [ ] Print-on-demand coordination
- [ ] Batch production triggers
- [ ] Shipping management

**Use Case:** Collective designs vinyl. Agent runs pre-order campaign. When 50 orders hit, triggers production. Tracks inventory, handles shipping.

**Technical:**
- Design tools integration
- Pre-order system
- Print-on-demand API
- Inventory database
- Shipping API

---

### 6. Venue Network Agent 🏢
**Priority:** MEDIUM - Hard problem to solve

**Features:**
- [ ] Track available warehouse/club spaces
- [ ] Book venues for events
- [ ] Insurance + liability coordination
- [ ] Split venue costs between collectives
- [ ] Verified venue database
- [ ] Reviews and ratings

**Use Case:** Collective needs warehouse for March 15. Agent shows 3 available spaces, handles booking, splits £800 cost with another crew using same space next week.

**Technical:**
- Venue database
- Booking calendar
- Cost-splitting logic
- Insurance API integration
- Verification system

---

### 7. Collective DAO Agent 🗳️
**Priority:** MEDIUM - Governance matters

**Features:**
- [ ] Voting on major decisions
- [ ] Proposal submission
- [ ] Snapshot/DAO-style voting
- [ ] Transparent voting history
- [ ] Quorum requirements
- [ ] Execution of approved proposals

**Use Case:** Member proposes buying new speakers for £2K. Agent creates vote, notifies members, tallies results. If approved, treasury agent executes purchase.

**Technical:**
- Voting smart contract
- Proposal database
- Notification system
- Integration with treasury agent
- Vote history

---

### 8. Social Amplifier Agent 📢
**Priority:** HIGH - Network effects

**Features:**
- [ ] Cross-promotion between agents
- [ ] Automatic social posting (Telegram, Discord, Twitter)
- [ ] Coordinate with other collectives' agents
- [ ] Schedule posts across channels
- [ ] Track engagement
- [ ] Agent-to-agent communication

**Use Case:** DJ drops new mix. Agent automatically posts to 10+ channels, notifies other collective agents, coordinates cross-promotion. Reach: 10K+ people.

**Technical:**
- Social media APIs
- Agent-to-agent protocol
- Scheduling system
- Analytics tracking
- Cross-promotion network

---

### 9. Soundsystem Agent 🔊
**Priority:** MEDIUM - Already planned

**Features:**
- [ ] Equipment inventory tracking
- [ ] Booking calendar
- [ ] Quote generation
- [ ] Venue scouting
- [ ] Maintenance schedules
- [ ] Rental coordination

**Status:** Spec written, implementation pending

---

### 10. Zine/Content Agent ✍️
**Priority:** MEDIUM - Already planned

**Features:**
- [ ] Event flyers
- [ ] Social media posts
- [ ] AI-generated art
- [ ] Press releases
- [ ] Scheduled posting
- [ ] Engagement tracking

**Status:** Spec written, implementation pending

---

## 🔧 Technical Infrastructure

### Smart Contracts Needed
- [ ] Royalty split contract
- [ ] Escrow contract (booking, merch)
- [ ] DAO voting contract
- [ ] License NFT contract

### Integrations Required
- [ ] Telegram Bot API
- [ ] Discord API
- [ ] Twitter API
- [ ] Resident Advisor API
- [ ] Print-on-demand services
- [ ] Insurance providers
- [ ] Shipping APIs

### Database Schema Additions
- [ ] Talent profiles
- [ ] Venue listings
- [ ] Merch inventory
- [ ] Voting proposals
- [ ] Analytics data
- [ ] Social posts

---

## 📊 Market Research Insights

### Pain Points Identified
1. **Royalty splits** - Manual, error-prone, no transparency
2. **Talent booking** - DMs, no contracts, payment disputes
3. **Audience insights** - No data on what works
4. **Talent discovery** - Gatekeepers (SoundCloud, Beatport)
5. **Merch logistics** - Manual, time-consuming
6. **Venue finding** - Hard to find trustworthy spaces
7. **Governance** - No transparent decision-making
8. **Promotion** - Manual cross-posting, no coordination

### Why Crypto Helps
- **Borderless payments** - International collectives
- **Transparent splits** - Everyone sees the math
- **Escrow** - Trustless transactions
- **Onchain contracts** - Enforceable agreements
- **DAO voting** - Transparent governance
- **No middlemen** - Direct artist-to-fan

### Competitive Advantage
- **Not generic AI** - Purpose-built for underground
- **Crypto that makes sense** - Solves real problems
- **Network effects** - Agents talk to each other
- **Community-owned** - Built by the scene, for the scene

---

## 🎯 Prioritization Matrix

### Must Have (Phase 2)
1. Royalty Split Agent
2. Talent Booking Agent
3. Social Amplifier Agent

### Should Have (Phase 3)
4. Community Insights Agent
5. Venue Network Agent
6. Collective DAO Agent

### Nice to Have (Phase 4)
7. Talent Marketplace Agent
8. Merch Agent
9. Soundsystem Agent (complete)
10. Zine/Content Agent (complete)

---

## 📅 Timeline

### Month 1
- Complete core infrastructure
- Beta test with 5 collectives
- Launch Royalty Split Agent

### Month 2
- Launch Talent Booking Agent
- Launch Social Amplifier Agent
- 50 collectives using platform

### Month 3
- Launch Community Insights Agent
- Launch Venue Network Agent
- 100+ collectives
- Public launch event (at a rave)

### Month 4-6
- Launch remaining agents
- Marketplace for custom templates
- 500+ collectives
- International expansion

---

## 💰 Revenue Model

### Subscription Tiers
- **Free:** 1 agent, basic features
- **Collective:** £29/mo, 5 agents, shared treasury
- **Crew:** £79/mo, unlimited agents, multi-sig, priority support

### Marketplace Revenue
- 10% fee on custom agent templates
- 5% fee on talent bookings
- 3% fee on merch sales

### Premium Features
- Multi-sig wallets: +£10/mo
- Advanced analytics: +£15/mo
- Custom integrations: +£25/mo

---

## 🚧 Blockers & Dependencies

### Technical
- [ ] CDP SDK proper integration
- [ ] Smart contract development
- [ ] Agent-to-agent protocol design
- [ ] Scalable infrastructure

### Business
- [ ] Beta collective recruitment
- [ ] Legal (contracts, insurance)
- [ ] Payment processing (fiat on-ramp)
- [ ] Customer support setup

### Community
- [ ] Trust building
- [ ] Education (crypto onboarding)
- [ ] Documentation
- [ ] Case studies

---

## 📈 Success Metrics

### Phase 1 (Beta)
- 5 collectives using agents
- 10+ events managed
- 1,000+ USDC processed
- Positive feedback

### Phase 2 (Launch)
- 50 collectives
- 100+ events/month
- 10,000+ USDC/month
- 10+ custom templates

### Phase 3 (Scale)
- 500+ collectives
- 1,000+ events/month
- 100,000+ USDC/month
- Self-sustaining ecosystem

---

## 🎧 Built for the Underground

Not "AI for business" — AI for culture.
Not "crypto for finance" — crypto for community.

Agents for the underground. Built by ravers, for ravers.

---

**Last Updated:** 2026-02-24
**Status:** Phase 1 in progress
**Next Milestone:** Beta testing with 5 collectives
