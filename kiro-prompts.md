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
