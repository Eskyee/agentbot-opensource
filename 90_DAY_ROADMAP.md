# 90-Day Roadmap - Agentbot Execution Plan

## Executive Summary

Ship royalty-split agent MVP in 60 days, talent-booking agent in 30 days, with 2-3 real case studies. Focus on crypto-native collectives (Techno/DnB) for beta. Success metrics: 10 real bookings, £10K USDC processed, 5 beta collectives loving it. Week-by-week breakdown with dependencies, GTM strategy, and real user focus.

---

## Constraints

- **60 days:** Royalty-split agent MVP
- **30 days:** Talent-booking agent MVP (after royalty-split)
- **Concurrent:** 2-3 real case studies
- **Focus:** Real users, not just launches
- **Goal:** 10 real bookings in 90 days

---

## Week-by-Week Breakdown

### WEEK 1-2: Foundation + Beta Recruitment

**Royalty-Split Agent:**
- [ ] Smart contract development (RoyaltySplit.sol)
- [ ] Unit tests (100% coverage)
- [ ] Deploy to Base Sepolia testnet
- [ ] Database schema (splits, payments, distributions)
- [ ] Basic API endpoints (create, execute, history)

**Beta Recruitment:**
- [ ] Identify 5 crypto-native collectives
  - 2 Techno crews (Berlin/Amsterdam)
  - 2 DnB collectives (London/Bristol)
  - 1 Rave organizer (LA/NYC)
- [ ] Direct outreach (Telegram, Farcaster)
- [ ] Pitch: "Free beta access, help us build"
- [ ] Schedule kickoff calls

**Dependencies:** None
**Deliverable:** Smart contract on testnet + 5 beta collectives committed

---

### WEEK 3-4: Royalty-Split MVP

**Frontend:**
- [ ] Dashboard UI (create split, view history)
- [ ] Wallet connection (OnchainKit)
- [ ] Add recipients form (addresses, percentages)
- [ ] Transaction history view
- [ ] Mobile responsive

**Backend:**
- [ ] CDP SDK integration (wallet management)
- [ ] Payment processing logic
- [ ] Telegram notifications
- [ ] Error handling

**Testing:**
- [ ] Internal testing with testnet USDC
- [ ] Fix critical bugs
- [ ] Deploy to Base mainnet

**Beta Launch:**
- [ ] Onboard 5 beta collectives
- [ ] Walk through setup (1-on-1)
- [ ] First real split executed
- [ ] Gather immediate feedback

**Dependencies:** Week 1-2 complete
**Deliverable:** Royalty-split agent live on mainnet + 5 beta users onboarded

---

### WEEK 5-6: Iterate + Case Studies

**Iteration:**
- [ ] Fix bugs from beta feedback
- [ ] Add requested features (if quick wins)
- [ ] Improve UX based on user sessions
- [ ] Optimize gas costs

**Case Studies:**
- [ ] Interview 3 beta collectives
- [ ] Document their use case
- [ ] Get testimonials (text + video)
- [ ] Take screenshots of agents in action
- [ ] Write up case studies

**Metrics:**
- [ ] Track: # splits created, USDC processed, user satisfaction
- [ ] Goal: £5K+ USDC processed, 10+ splits created

**Marketing:**
- [ ] Publish case study #1 on blog
- [ ] Share on Twitter/Farcaster
- [ ] Post in underground Telegram groups

**Dependencies:** Week 3-4 complete
**Deliverable:** 3 case studies published + £5K+ USDC processed

---

### WEEK 7-8: Talent Booking - Smart Contract + Backend

**Smart Contract:**
- [ ] BookingEscrow.sol development
- [ ] Unit tests (escrow, disputes, reputation)
- [ ] Deploy to Base Sepolia
- [ ] Security review

**Backend:**
- [ ] Database schema (talent, bookings, reviews)
- [ ] API endpoints (create booking, confirm, complete)
- [ ] Reputation system logic
- [ ] Notification service (Telegram)

**Talent Recruitment:**
- [ ] Recruit 10 DJs/producers for beta
  - 5 Techno (Berlin/Amsterdam)
  - 3 DnB (London/Bristol)
  - 2 House (Chicago/Detroit)
- [ ] Create profiles manually
- [ ] Set availability

**Dependencies:** Royalty-split stable (Week 5-6)
**Deliverable:** Booking smart contract on testnet + 10 DJs recruited

---

### WEEK 9-10: Talent Booking - Frontend + Beta

**Frontend:**
- [ ] Marketplace UI (browse talent)
- [ ] Talent profile pages
- [ ] Booking flow (create, confirm, complete)
- [ ] Calendar integration (availability)
- [ ] Review system

**Testing:**
- [ ] Internal testing (testnet)
- [ ] Fix critical bugs
- [ ] Deploy to Base mainnet

**Beta Launch:**
- [ ] Connect 5 organizers with 10 DJs
- [ ] Facilitate 5 bookings
- [ ] Walk through booking flow
- [ ] Gather feedback

**Dependencies:** Week 7-8 complete
**Deliverable:** Talent booking live + 5 bookings facilitated

---

### WEEK 11-12: Scale + Agent-to-Agent

**Iteration:**
- [ ] Fix bugs from booking beta
- [ ] Improve search/discovery
- [ ] Add filters (genre, rate, location)
- [ ] Optimize UX

**Agent-to-Agent Protocol:**
- [ ] Design message format (JSON schema)
- [ ] Webhook infrastructure
- [ ] Event agent → Booking agent integration
- [ ] Booking agent → Royalty-split integration
- [ ] Test coordination

**Case Studies:**
- [ ] Document 2 successful bookings
- [ ] Get testimonials from DJs + organizers
- [ ] Video interviews
- [ ] Publish case study #2

**Metrics:**
- [ ] Track: # bookings, GMV, completion rate
- [ ] Goal: 10 bookings, £3K+ GMV, 100% completion

**Marketing:**
- [ ] Publish case study #2
- [ ] Demo video (booking flow)
- [ ] Share on socials
- [ ] IRL demo at underground event

**Dependencies:** Week 9-10 complete
**Deliverable:** 10 total bookings + agent-to-agent protocol live

---

## Dependencies Map

```
Week 1-2: Foundation
    ↓
Week 3-4: Royalty-Split MVP
    ↓
Week 5-6: Iterate + Case Studies
    ↓
Week 7-8: Booking Backend (parallel with Week 5-6 iteration)
    ↓
Week 9-10: Booking Frontend + Beta
    ↓
Week 11-12: Scale + Agent-to-Agent
```

**Key dependency:** Royalty-split must be stable before starting talent booking (Week 5-6 buffer allows this).

---

## Go-to-Market Strategy

### Target Communities (Beta)

**Tier 1: Crypto-Native (Week 1-6)**
- **Techno crews:** Berlin (Herrensauna, Tresor community), Amsterdam (De School)
- **DnB collectives:** London (Rupture, Metalheadz community), Bristol (Dispatch)
- **Rave organizers:** LA (Desert Hearts), NYC (Unter)

**Why:** Already using crypto, understand USDC, early adopters

**How to reach:**
- Farcaster (Base community)
- Telegram groups (underground music)
- Direct DMs to organizers
- IRL at events

**Tier 2: Crypto-Curious (Week 7-12)**
- **House collectives:** Chicago, Detroit
- **Bass music:** UK, Australia
- **Experimental:** Global

**Why:** Open to new tools, tech-savvy, community-focused

**How to reach:**
- Case studies from Tier 1
- Word-of-mouth
- Resident Advisor forums
- Reddit (r/Techno, r/DnB)

### Outreach Script

**Initial DM:**
```
Hey [Name],

I'm building Agentbot - crypto-native tools for underground collectives.

We're launching a royalty-split agent that automatically distributes USDC to your crew. No spreadsheets, no delays, no trust required.

Looking for 5 beta collectives to test with. Free access, you help shape the product.

Interested? Happy to jump on a call and show you.

[Your Name]
```

**Follow-up (after demo):**
```
Thanks for the call! Here's what we discussed:

1. You create a split (add crew members + percentages)
2. Anyone sends USDC to the split address
3. It auto-distributes instantly
4. Transparent history onchain

Next steps:
- I'll send you beta access
- Let's set up your first split
- Try it with a real payment

Sound good?
```

---

## Success Metrics

### Week 2 (Foundation)
- ✅ Smart contract deployed to testnet
- ✅ 5 beta collectives committed

### Week 4 (Royalty-Split MVP)
- ✅ Royalty-split live on mainnet
- ✅ 5 beta users onboarded
- ✅ 5+ splits created
- ✅ £1K+ USDC processed

### Week 6 (Iterate + Case Studies)
- ✅ 3 case studies published
- ✅ £5K+ USDC processed
- ✅ 10+ splits created
- ✅ NPS > 50

### Week 8 (Booking Backend)
- ✅ Booking contract on testnet
- ✅ 10 DJs recruited
- ✅ API endpoints working

### Week 10 (Booking Beta)
- ✅ Booking marketplace live
- ✅ 5 bookings facilitated
- ✅ £1.5K+ GMV

### Week 12 (Scale)
- ✅ 10 total bookings
- ✅ £10K+ total USDC processed (splits + bookings)
- ✅ 5 case studies published
- ✅ Agent-to-agent protocol live
- ✅ 20+ active users

---

## Risk Mitigation

### Risk 1: Beta Collectives Don't Show Up
**Mitigation:**
- Over-recruit (10 collectives for 5 slots)
- Offer incentives (free credits, early access)
- Personal relationships (reach out to people we know)

### Risk 2: Technical Delays
**Mitigation:**
- Buffer time in weeks 5-6
- Prioritize MVP features only
- Cut scope if needed (milestones can wait)

### Risk 3: Low Adoption
**Mitigation:**
- Focus on real pain points (splits, bookings)
- 1-on-1 onboarding (white-glove service)
- Iterate based on feedback

### Risk 4: Smart Contract Bugs
**Mitigation:**
- Extensive testing on testnet
- Security review (OpenZeppelin)
- Start with small amounts
- Bug bounty program

### Risk 5: Crypto Friction
**Mitigation:**
- Gasless transactions (CDP SDK)
- Clear onboarding docs
- Video tutorials
- 1-on-1 support

---

## Team & Resources

### Required Skills
- **Smart contract dev:** Solidity, testing, security
- **Backend dev:** Node.js, PostgreSQL, APIs
- **Frontend dev:** Next.js, React, TailwindCSS
- **Product:** User research, iteration, GTM

### Time Allocation
- **Week 1-4:** 80% dev, 20% beta recruitment
- **Week 5-6:** 50% dev, 50% user support + case studies
- **Week 7-10:** 70% dev, 30% user support
- **Week 11-12:** 40% dev, 60% GTM + scaling

### Budget
- **Development:** In-house (no external cost)
- **Infrastructure:** £200/mo (Vercel, Supabase, Alchemy)
- **Marketing:** £500 (IRL event demos, swag)
- **Total:** £1,100 for 90 days

---

## What Success Looks Like (Day 90)

### Quantitative
- ✅ 10 bookings completed
- ✅ £10K+ USDC processed
- ✅ 20+ active users (collectives + DJs)
- ✅ 5 case studies published
- ✅ NPS > 50

### Qualitative
- ✅ Users saying "This solved a real problem"
- ✅ Word-of-mouth referrals happening
- ✅ Testimonials with faces and names
- ✅ Clear product-market fit signal

### Strategic
- ✅ Agent-to-agent protocol working
- ✅ Network effects starting (agents coordinating)
- ✅ Onchain reputation building
- ✅ Clear path to 100 users

---

## Post-90-Day Plan

### Month 4-6 (Scale)
- Public launch (no more beta)
- Add merch agent
- Scale to 100 collectives
- International expansion

### Month 7-12 (Ecosystem)
- Community insights agent
- Venue network
- DAO governance
- 500+ collectives

---

## Weekly Standups

**Every Monday:**
- Review last week's progress
- Identify blockers
- Adjust plan if needed
- User feedback review

**Every Friday:**
- Demo what shipped
- User testing sessions
- Plan next week
- Celebrate wins

---

## Conclusion

**Focus:** Real users over features. 10 bookings > 100 features.

**Strategy:** Start narrow (crypto-native), prove value, expand.

**Execution:** Ship fast, iterate based on feedback, build in public.

**Goal:** By Day 90, have undeniable proof that Agentbot solves real problems for underground collectives.

Let's build. 🎧
