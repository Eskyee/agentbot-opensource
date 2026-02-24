# Kiro Prompts - Underground Culture Agents

## Core Principles

1. **Culture-first, not corporate**
2. **Crypto that makes sense, not forced**
3. **Transparent, not opaque**
4. **Community-owned, not top-down**
5. **Built by ravers, for ravers**

---

## Prompt 1: Design the Royalty-Split Agent

**Context:** Producer collectives, labels, and remix collaborations need automatic revenue splitting. Current solutions (spreadsheets, PayPal) are manual, slow, and error-prone. Crypto enables instant, transparent, trustless splits.

**Your Task:** Design a complete Royalty-Split Agent including:
- Technical architecture
- Smart contract design
- User flows
- API specifications
- Database schema
- UI/UX mockups
- Integration points
- Security considerations

**Requirements:**
- Support 2-10 recipients per split
- Percentage-based or fixed amounts
- Milestone-based releases (optional)
- Transparent history
- Gas-efficient (Base network)
- Gasless for recipients

**Deliverable:** Detailed design document ready for implementation.

---

## Prompt 2: Design the Talent Booking Agent

**Context:** Booking DJs/producers happens in DMs with no contracts, no escrow, and frequent disputes. An agent that handles discovery, negotiation, contracts, and payments would be game-changing.

**Your Task:** Design the complete booking flow including:
- Talent profile system
- Availability calendar
- Rate negotiation logic
- Contract generation
- Escrow smart contract
- Payment release triggers
- Reputation system

**Requirements:**
- Browse talent by genre, location, rate
- Auto-negotiate within budget
- Generate legal contracts
- Hold payment in escrow
- Release on performance date
- Handle disputes

**Deliverable:** Complete system design with smart contracts and workflows.

---

## Prompt 3: Design the Social Amplifier Agent

**Context:** Collectives manually cross-post to 10+ channels. An agent that coordinates promotion across collectives would create network effects.

**Your Task:** Design agent-to-agent communication protocol including:
- Cross-promotion logic
- Trust/reputation system
- Spam prevention
- Engagement tracking
- Viral mechanics

**Requirements:**
- One post → many channels
- Agents coordinate with each other
- Respect audience preferences
- Track engagement
- Prevent spam

**Deliverable:** Protocol specification and implementation plan.

---

## Prompt 4: Design the Community Insights Agent

**Context:** Collectives have no data on what works. An agent that analyzes patterns and predicts outcomes would optimize events.

**Your Task:** Design analytics system including:
- Data collection
- Pattern recognition
- Prediction models
- Reporting dashboard
- Actionable insights

**Requirements:**
- Track attendance over time
- Analyze engagement patterns
- Predict optimal timing
- Suggest improvements
- Privacy-preserving

**Deliverable:** Analytics architecture and ML models.

---

## Prompt 5: Design the Venue Network Agent

**Context:** Finding trustworthy underground spaces is hard. A decentralized venue marketplace with verification would solve this.

**Your Task:** Design venue network including:
- Venue verification system
- Booking coordination
- Insurance integration
- Cost-splitting logic
- Review system

**Requirements:**
- Verified venue database
- Availability calendar
- Insurance coordination
- Split costs between crews
- Reputation system

**Deliverable:** Marketplace design and verification protocol.

---

## Agent Personality Guidelines

### Tone
- **Helpful, not corporate**
- **Direct, not verbose**
- **Underground, not mainstream**
- **Transparent, not opaque**

### Language
- Use "crew" not "team"
- Use "collective" not "company"
- Use "underground" not "niche"
- Use "vibe" not "atmosphere"

### Examples

**Good:**
```
User: "Add Sarah to the guest list"
Agent: "✓ Added Sarah. 47 confirmed. Vibe is building."
```

**Bad:**
```
User: "Add Sarah to the guest list"
Agent: "I have successfully processed your request to add Sarah to the guest list. The current total is 47 confirmed attendees."
```

**Good:**
```
User: "How much in the treasury?"
Agent: "2,450 USDC. Venues: 800 | Equipment: 450. Looking healthy."
```

**Bad:**
```
User: "How much in the treasury?"
Agent: "The current treasury balance is 2,450 USDC. Expenditures by category are as follows..."
```

---

## Crypto Messaging Guidelines

### Do
- Emphasize transparency
- Highlight trustlessness
- Show onchain receipts
- Explain gasless transactions
- Use USDC (not "crypto")

### Don't
- Use jargon (no "web3", "degen", "gm")
- Oversell crypto
- Hide complexity dishonestly
- Assume knowledge

### Examples

**Good:**
```
"Sent 50 USDC to Alex. Receipt: 0x7a3b... Everyone can verify."
```

**Bad:**
```
"Executed onchain transaction via smart contract to recipient address."
```

---

## Community Engagement Prompts

### For Twitter/Farcaster
```
We're building agents for underground collectives.

Not "AI for business" — AI for culture.
Not "crypto for finance" — crypto for community.

Rave Event Agent: Manage guest lists, sell tickets in USDC
Treasury Agent: Transparent funds, automatic splits
Booking Agent: Trustless talent coordination

Built by ravers, for ravers. 🎧

Beta: [link]
```

### For Telegram Groups
```
Hey crew 👋

We built an agent that handles:
- Guest lists (no more WhatsApp chaos)
- Ticket sales in USDC (gasless)
- Treasury tracking (transparent)

Looking for 5 collectives to beta test. Free access, just want feedback.

Interested? DM me.
```

### For Blog Posts
```
Title: "Why Underground Collectives Need Agents"

Hook: Event coordination is chaos. Money management is opaque. Content creation is time-consuming.

Problem: WhatsApp hell, spreadsheet splits, manual everything.

Solution: Agents that handle coordination, transparent treasuries, automatic splits.

Why crypto: Borderless payments, trustless transactions, onchain receipts.

CTA: Try it free, join the beta.
```

---

## Strategic Prompts

### Prompt 6: Community Insights Agent — "What Hit Different?"
Design the `community-insights` agent that analyzes collective performance and gives actionable recommendations.

**Inputs:**
- Event agent data (attendance, revenue, timing)
- Community-treasury agent (spending patterns)
- Telegram chat history (vibe, sentiment)

**Outputs:**
- "Your Friday events do 2x better than Saturdays"
- "Techno nights have 30% higher repeat attendance"
- "Spending £200 on promo = 50% more tickets sold"
- "Your community engagement peaks on Wednesdays"

**Features:**
- Attendance pattern analysis
- Revenue optimization recommendations
- Talent performance tracking (which DJs bring crowds?)
- Optimal event timing predictions
- Loyalty tracking (who's a regular?)
- Sentiment analysis from chat

**Requirements:**
1. Data model (what metrics to track?)
2. AI reasoning approach (pattern detection, recommendations)
3. Privacy considerations (anonymize user data)
4. Visualization (charts, graphs, insights dashboard)

**Output:** Design doc with metrics, data model, and AI reasoning approach

---

### Prompt 7: Market Positioning — "Agentbot vs. Competitors"
Write a competitive analysis comparing Agentbot to:

- Eventbrite
- Bandcamp
- Stripe
- ResidentAdvisor
- Friend.tech (for networking)
- Zora (for creator economy)

For each competitor:

1. What is their moat?
2. Who do they serve?
3. What are they missing?
4. How does Agentbot differentiate?

Then write a positioning statement:
"Agentbot is ___ for ___ that ___ because ___."

Example: "Agentbot is the event + creator OS for underground communities that want autonomy, transparency, and crypto-native tools because Eventbrite is corporate and Bandcamp doesn't handle events."

Make it punchy, make it defensible.

---

### Prompt 8: 90-Day Roadmap
Create a 90-day product roadmap for Agentbot with this constraint:

- 60 days to ship royalty-split agent MVP
- 30 days to ship talent-booking agent MVP
- Concurrent: Launch 2-3 real case studies (book real events, real talent, real collectives)

Include:

- Week-by-week breakdown
- Dependencies (does talent-booking depend on something from royalty-split?)
- Go-to-market (which communities to beta with?)
- Success metrics (adoption, GMV, verified humans, onchain transactions)

Focus on real users — not just launches. Get 10 real bookings in the first 90 days.

---

## Community & Network Prompts

### Prompt 9: Agent-to-Agent Communication Protocol
Design how Agentbot agents can talk to each other and coordinate.

Example scenarios:

1. Event agent books a DJ agent → DJ agent confirms → event agent adds to lineup → basefmbot discovers it → basefmbot cross-promotes
2. Royalty-split agent manages payout → creates transaction visible on basefmbot feed
3. Talent-booking agent matches organizer with performer → event agent is notified

Requirements:

1. Message format (how do agents pass data?)
2. Trust & verification (how do we know agent is legit?)
3. Webhook/message bus (what infrastructure?)
4. Economics (do agents take cuts when coordinating with other agents?)

**Output:** Protocol spec + example message exchanges

---

## Research Prompts

### Prompt 10: Underground Music Economy Research
Research the underground music economy. Find and summarize:

1. **Market size estimates**
   - How many underground collectives globally?
   - What's their average spend on events/year?
   - Merch revenue potential?

2. **Pain points** (interview summaries or market research)
   - Booking talent
   - Managing money across collectives
   - Selling merch
   - Finding venues
   - Community trust

3. **Crypto adoption in underground scenes**
   - Are underground communities using crypto already?
   - What barriers exist to wider adoption?
   - Which scenes are most crypto-native? (Techno? Drum & Bass? Rave?)

4. **Comparable businesses**
   - Who's serving this market well?
   - Who's tried and failed?
   - What's the TAM if you do this right?

**Output:** Formatted brief with sources, data, and insights

---

## Meta Prompts

### Prompt 11: "Audit Agentbot"
Critique Agentbot's current offering. What's working? What's broken? What am I missing strategically?

**Current state:**
- Homepage: "Deploy OpenClaw in seconds"
- Marketplace: 10+ agents (rave-event, basefmbot, studio-one, studio, clawdbotdj, chain, vault, pay, community-treasury, cafe)
- Verified human badge
- Kimi K2.5 for thinking
- Base blockchain integration
- Culture-first positioning

**Audit:**
1. Is the positioning clear? Would an underground organizer understand why they should use Agentbot over Eventbrite?
2. Are the agents actually solving real problems, or are they just features?
3. What's the go-to-market? (Which communities should we target first?)
4. What's the moat? (Why can't Eventbrite clone this in 6 months?)
5. What's missing that would 10x adoption?

**Output:** Honest critique + specific recommendations

---

### Prompt 12: "Agentbot Manifesto"
Write the Agentbot manifesto.

**Persona:** The underground. The collective. The people who want autonomy from platforms.

**Key themes:**
- Anti-platform (Eventbrite, Bandcamp, Spotify are gatekeepers)
- Pro-crypto (transparency, ownership, no KYC)
- Pro-culture (we're not for everyone, we're for the underground)
- Pro-community (treasuries, shared governance, transparency)
- Pro-agent (AI doing work, not just chatting)

Make it punchy. Make it ideological. Make people want to join.

**Output:** 1-2 page manifesto suitable for homepage, socials, pitch deck

---

## How to Use These Prompts with Kiro

1. **Pick the prompt** that maps to your current sprint
2. **Send to Kiro** via CLI, chat, or workflow
3. **Get back:** Detailed designs, code outlines, market analysis
4. **Iterate:** "Kiro, refine the UX for the royalty-split agent based on feedback from X..."
5. **Execute:** Use Kiro's output as the spec for engineering

**Example workflow:**

```
You: "@kiro Run Prompt 3: Design the Talent Booking Marketplace"

Kiro returns: 2000-word design doc with flows, UX mocks, competitive analysis

You: "@kiro Those flows look good. Now build an API spec for the booking agent based on this design"

Kiro: Returns OpenAPI spec + TypeScript types

You: Contractor builds from spec
```

That's the workflow. Let Kiro do the research and design, you execute.

---

## Technical Prompts

### Smart Contract Design
```
Design a royalty split contract that:
- Accepts USDC payments
- Splits to N recipients
- Supports percentage or fixed amounts
- Emits events for tracking
- Gas-efficient on Base
- Upgradeable (proxy pattern)
- Pausable (emergency)
```

### Database Schema
```
Design schema for:
- Events (name, date, venue, capacity)
- Guest lists (name, telegram, plus_ones, checked_in)
- Transactions (type, amount, category, recipient, tx_hash)
- Splits (recipients, percentages, total_paid)
```

### API Design
```
Design REST API for:
- POST /api/splits/create
- POST /api/splits/{id}/execute
- GET /api/splits/{id}/history
- GET /api/splits/{id}/recipients
```

---

## Use These Prompts

When designing new agents, use these prompts as templates. Adapt the tone, requirements, and deliverables to fit the specific agent.

**Remember:**
- Culture-first
- Crypto that makes sense
- Transparent and trustless
- Built for the underground

🎧
