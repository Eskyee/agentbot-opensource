# Agentbot Architecture & Pricing Update

## Dual Agent Architecture

### Agentbot = Creative Crew
- Fan-facing. Promo. Music. The "shamantic" DJ side.
- Telegram/WhatsApp fan engagement
- BlockDB queries for A&R
- Base FM submissions
- Visual artwork generation

### OpenClaw = Business Operations  
- Back-office. Contracts. Gig hunting. The manager/lawyer side.
- Email inbox management (unlimited accounts)
- Contract/Rider analysis (PDF ingestion)
- Web scraping (gig listings, venue research)
- Calendar coordination & booking logistics
- Autonomous USDC invoicing via x402

---

## Revised Pricing: The Hybrid Model

Each tier includes both creative and business agents, honestly specced.

| Tier | Price | Creative Agents | OpenClaw Business | Hardware Reality | Target |
|------|-------|-----------------|-------------------|------------------|--------|
| Solo | £29/mo | 1 thread (chat only) | ❌ Not included | Shared cluster | Bedroom producers |
| Collective | £69/mo | 3 threads | 1 OpenClaw seat | Shared + Priority queue | DJs with day jobs |
| Label | £149/mo | 10 threads | 3 OpenClaw seats | Dedicated 4vCPU container | Indie labels |
| Network | £499/mo | Unlimited | Unlimited OpenClaw | Dedicated 16GB VM | Agencies |

---

## Why This Works

OpenClaw is resource-heavy. Unlike simple chatbots, document processing (PDF parsing, OCR, email IMAP sync, browser automation) requires:

- ~1GB RAM per concurrent OpenClaw instance (Selenium/Playwright browsers are heavy)
- Persistent storage for document queues (not just ephemeral chat context)
- CPU spikes during web scraping (rendering JavaScript)

**Solo tier excluded** because OpenClaw would crash the 2GB shared allocation. Honest exclusion > impossible promises.

---

## OpenClaw Feature Breakdown

### Collective: OpenClaw Core (£69 tier includes 1 seat)

"The Tour Manager" agent

- **Email Triage**: Connects to Gmail/Outlook, drafts responses to booking inquiries, flags urgent rider changes
- **Calendar Guard**: Blocks studio time, prevents double-bookings
- **Simple Scraping**: Monitors 5 venues' "Bookings" pages for open slots
- **Document Reading**: Parses PDF contracts for key terms (clauses, dates, red flags)
- **x402 Enabled**: Sends USDC invoices, tracks payment status

*Limitation: 50 emails processed/day, 3 active monitoring jobs (scraping targets)*

### Label: OpenClaw Pro (£149 tier includes 3 seats)

"The Label Infrastructure"

- **Multi-inbox**: Manage entire roster's public inquiries (A&R@, Booking@, Press@)
- **Rider Analysis**: Compares incoming hospitality riders against venue capabilities database
- **Lead Qualification**: Scrapes Resident Advisor, Songkick, Bandcamp for gig opportunities, scores by fit
- **Contract Lifecycle**: Tracks signature status, automates follow-ups
- **Bankr Integration**: Agent manages tour budget, trades stablecoins for gas/operational expenses

*Limitation: 500 emails/day, unlimited monitoring, white-label email signatures (@yourlabel.com)*

### Network: OpenClaw Reseller (£499 tier)

White-label business automation for agencies

- **Full white-label**: Your clients see "Managed by [AgencyName] AI"
- **Sub-accounts**: Resell OpenClaw seats at your markup (suggested: £199/seat)
- **Custom scrapers**: Build vertical-specific scrapers (festival databases, label rosters)
- **SLA guarantees**: 99.9% uptime on business automation (email never stops)

---

## The "Crew Coordination" (A2A Bus Reality)

How Agentbot and OpenClaw talk to each other (available Collective+):

```
Fan DM (Agentbot): "Is DJ X available for June 15th?"
        ↓ (A2A Bus)
OpenClaw checks Google Calendar API
        ↓
OpenClaw: "Date conflicts with studio session. Alternative: June 16th?"
        ↓
Agentbot to Fan: "June 15th is booked for production, but the 16th is open. Shall I tentative hold?"
```

Resource impact: A2A coordination consumes extra API calls but minimal RAM. The "Bus" is just message passing, not duplicate model loading.

---

## Honest Resource Allocation (Internal Only)

| Resource | Solo | Collective | Label | Network |
|----------|------|------------|-------|---------|
| Creative Memory | 1 hour context | 24hr persistent | 30 days RAG | Unlimited |
| Business Documents | ❌ | 50 pages/day | 500 pages/day | Unlimited |
| Web Scraping | ❌ | 3 sites/hour | Unlimited | Dedicated proxy pool |
| Email Processing | ❌ | 50/day | 500/day | Unlimited |

---

## Critical Implementation Notes

### 1. OpenClaw Needs Its Own Instance
Don't try to run OpenClaw (browser automation + email sync) on the same container as high-volume chat. It causes latency spikes.

- **Collective**: OpenClaw runs on shared "business cluster" (isolated from chat cluster)
- **Label+**: Dedicated container per account for OpenClaw

### 2. The "Warmup" Period
OpenClaw requires 10-15 minutes of initial indexing (downloading email headers, parsing existing Drive docs). Be upfront:

> "OpenClaw initializes in ~10 minutes as it learns your filing system. First sync may be slower."

### 3. Crypto-Native Business
OpenClaw is where x402 shines:

- Automatically detects "Payment due" in emails → generates USDC payment link
- Tracks on-chain royalty receipts → updates spreadsheet
- Manages "Agent Wallet" for operational expenses (gas fees, API credits)

### 4. Telegram vs Email Paradox
Telegram is for Agentbot (creative), Email is for OpenClaw (business). Don't force OpenClaw into Telegram (clunky) or Agentbot into Email (inefficient). Let them specialize.

---

## Updated Positioning

**Old (Broken):** "100 agents on 8GB"

**New (Honest):**

> "One creative crew, one business mind."

Agentbot handles your fans. OpenClaw handles your inbox. Both run on Base, paid in USDC, hosted on infrastructure that actually exists.

### The Value Prop:

- **Solo**: You chat with fans manually, but Agentbot helps with replies. No business automation.
- **Collective**: You get a digital tour manager (OpenClaw) + 3 creative agents. First step to autonomy.
- **Label**: Full label infrastructure – creative crew of 10 + back office of 3 OpenClaw seats handling the boring stuff.
- **Network**: Resell the future. White-label both systems.

This pricing is now defensible, technically accurate, and positions OpenClaw as the premium business layer that justifies the jump from £29 to £69.
