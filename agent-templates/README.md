# Underground Agent Templates - README

## Overview

Agent templates for the underground music/crypto scene. Built for collectives, soundsystems, and DIY venues.

## Available Templates

### 1. 🎉 Rave Event Agent
**File:** `rave-event-agent.ts`

Manages underground events end-to-end:
- Guest list management
- Ticket sales in USDC
- Ride share coordination
- Event reminders
- Check-ins at the door
- Revenue tracking

**Perfect for:** Event organizers, collectives, promoters

---

### 2. 💰 Community Treasury Agent
**File:** `community-treasury-agent.ts`

Transparent fund management for collectives:
- Track treasury balance
- Budget by category
- Process reimbursements
- Financial reports
- Budget alerts
- Transaction export

**Perfect for:** Collectives, soundsystem crews, shared funds

---

### 3. 🔊 Soundsystem Agent
**Coming soon**

Equipment and booking management:
- Inventory tracking
- Booking calendar
- Quote generation
- Venue scouting
- Maintenance schedules

---

### 4. ✍️ Zine/Content Agent
**Coming soon**

Promo content generation:
- Event flyers
- Social media posts
- Promo art (AI-generated)
- Press releases
- Scheduled posting

---

## Quick Start

### 1. Install Dependencies

```bash
npm install @coinbase/cdp-sdk
npm install @coinbase/onchainkit
```

### 2. Import Template

```typescript
import { RaveEventAgent } from './agent-templates/rave-event-agent'
import { CommunityTreasuryAgent } from './agent-templates/community-treasury-agent'

// Create event agent
const eventAgent = new RaveEventAgent(
  walletAddress,
  telegramBot
)

// Create treasury agent
const treasuryAgent = new CommunityTreasuryAgent(
  walletAddress,
  2, // multi-sig threshold
  ['signer1', 'signer2', 'signer3']
)
```

### 3. Use in Your Agent

```typescript
// Add to guest list
await eventAgent.addToGuestList(
  'event_123',
  'Sarah',
  'admin',
  1 // +1
)

// Process reimbursement
await treasuryAgent.reimburse(
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  50,
  'Cables for soundsystem',
  'equipment'
)
```

---

## Integration with Agentbot

### Add to Dashboard

```typescript
// In app/dashboard/page.tsx
import { RaveEventAgent } from '@/agent-templates/rave-event-agent'

// Initialize agent for user
const agent = new RaveEventAgent(
  user.walletAddress,
  telegramBot
)
```

### Add to Marketplace

```typescript
// In app/marketplace/page.tsx
const templates = [
  {
    id: 'rave-event',
    name: 'Rave Event Agent',
    description: 'Manage underground events, guest lists, and ticket sales',
    price: 0, // Free
    category: 'Events',
    icon: '🎉'
  },
  {
    id: 'community-treasury',
    name: 'Community Treasury Agent',
    description: 'Transparent fund management for collectives',
    price: 0,
    category: 'Finance',
    icon: '💰'
  }
]
```

---

## Configuration

### Environment Variables

```bash
# CDP API Keys
CDP_API_KEY_NAME=your-api-key-name
CDP_API_KEY_PRIVATE_KEY=your-private-key

# Telegram Bot
TELEGRAM_BOT_TOKEN=your-bot-token

# Database
DATABASE_URL=postgresql://...
```

### Database Schema

```sql
-- Events table
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  date TIMESTAMP NOT NULL,
  venue TEXT,
  capacity INTEGER,
  ticket_price DECIMAL,
  status TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Guest list
CREATE TABLE guest_list (
  id SERIAL PRIMARY KEY,
  event_id TEXT REFERENCES events(id),
  name TEXT NOT NULL,
  telegram TEXT,
  plus_ones INTEGER DEFAULT 0,
  checked_in BOOLEAN DEFAULT FALSE,
  added_by TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Treasury transactions
CREATE TABLE treasury_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  category TEXT,
  description TEXT,
  recipient TEXT,
  tx_hash TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Examples

### Rave Event Agent

```typescript
// Create event
const event = await agent.createEvent({
  name: 'Warehouse Party',
  date: '2026-03-15T23:00:00Z',
  venue: 'Secret Location',
  capacity: 200,
  ticketPrice: 25,
  lineup: ['DJ Shadow', 'MC Flux', 'Vinyl Selector']
})

// Add to guest list
await agent.addToGuestList(event.id, 'Sarah', 'admin', 1)

// Sell tickets
await agent.sellTicket(event.id, '0x742d35...', 2)

// Get stats
const stats = await agent.getEventStats(event.id)
console.log(stats)
// 📊 Warehouse Party
// 📅 2026-03-15T23:00:00Z
// 👥 Confirmed: 47/200
// 🎫 Tickets sold: 23
// 💰 Revenue: 575 USDC
```

### Community Treasury Agent

```typescript
// Get balance
const balance = await treasury.getBalance()
console.log(`Treasury: ${balance} USDC`)

// Record expense
await treasury.recordExpense(
  800,
  'venues',
  'Warehouse deposit for March 15'
)

// Reimburse member
await treasury.reimburse(
  '0x742d35...',
  50,
  'Cables and adapters',
  'equipment'
)

// Get report
const report = await treasury.getReport('month')
console.log(report)
// 💰 Treasury Report (month)
// Balance: 2,450 USDC
// Income: +3,200 USDC
// Expenses: -1,370 USDC
```

---

## Roadmap

### Phase 1 (Current)
- [x] Rave Event Agent template
- [x] Community Treasury Agent template
- [x] Documentation
- [ ] Database integration
- [ ] CDP SDK integration

### Phase 2
- [ ] Soundsystem Agent
- [ ] Zine/Content Agent
- [ ] Multi-sig support
- [ ] Telegram bot integration

### Phase 3
- [ ] Agent marketplace
- [ ] Collective dashboards
- [ ] Cross-agent coordination
- [ ] Reputation system

---

## Contributing

Want to add a template? Follow this structure:

1. Create `your-agent.ts` in `agent-templates/`
2. Export class with clear methods
3. Add prompt template
4. Document in README
5. Add examples

---

## Support

- Discord: [Join CDP Discord](https://discord.com/invite/cdp)
- Docs: [CDP Documentation](https://docs.cdp.coinbase.com)
- Issues: [GitHub Issues](https://github.com/Eskyee/agentbot/issues)

---

## License

MIT - Built for the underground 🎧
