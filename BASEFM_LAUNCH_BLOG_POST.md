# 🚀 baseFM: Onchain Radio Goes Live - Complete Stack Deployed

**March 14, 2026** | By RaveCulture Team

---

## We're Live! 🎙️

After weeks of development, testing, and refinement, **baseFM is officially live and streaming**. We just proved it works end-to-end with a real broadcast of Bob Marley on the Mux network.

Here's what we built, how it works, and what's coming next for AI agents.

---

## What is baseFM?

**baseFM is decentralized, onchain radio powered by:**

- 🎵 **Mux Video** - Enterprise-grade live streaming infrastructure
- 🔐 **RAVE Tokens** - Blockchain-based access control (1.25M minimum to stream)
- ⛓️ **Base Network** - Ultra-fast, low-cost transactions on Ethereum L2
- 🎬 **OBS Compatible** - Standard RTMP streaming for DJs and broadcasters
- 🤖 **AI Ready** - Automatic stream provisioning for autonomous agents

Think of it as **YouTube Live meets Web3** - but fully decentralized, RAVE-gated, and designed for both humans and AI agents.

---

## The Complete Streaming Flow

We tested the entire stack with a live broadcast. Here's how it works:

### **Step 1: Access Control (RAVE Token Verification)**

DJs visit `basefm.space/dashboard/create` and the system verifies they hold 1,250,000+ RAVE tokens on-chain (Base network).

This is done via a direct blockchain RPC call - no centralized gatekeeping:

```typescript
// Verify on-chain
const balance = await eth_call(
  contract: 0xdf3c...,
  method: balanceOf(wallet)
)

if (balance >= 1.25M RAVE) {
  // Proceed to stream creation
}
```

**Why RAVE tokens?**
- Prevents spam/bot streams
- Creates reputation system
- Enables future revenue sharing
- Ties identity to blockchain

### **Step 2: Stream Creation via Mux**

Once verified, we call the Mux API:

```typescript
const liveStream = await Video.liveStreams.create({
  playback_policy: ['public'],
  new_asset_settings: { playback_policy: ['public'] },
  metadata: {
    dj_wallet: walletAddress,
    dj_name: 'Esky',
  },
})
```

**What we get back:**
- Unique stream ID
- RTMP stream key
- Public playback ID
- Metadata tracking

### **Step 3: OBS Configuration**

DJ gets credentials and configures OBS:

```
Server:     rtmp://global-live.mux.com:5222/app
Stream Key: vp2S...2bw
Audio:      AAC, 256-320 kbps, 44.1 kHz, Stereo
```

### **Step 4: Live Broadcast**

DJ starts streaming in OBS. Audio flows through Mux's global CDN.

### **Step 5: Public Playback**

Viewers watch at `basefm.space/live`:
- Adaptive bitrate streaming
- Low latency
- Public broadcast
- Real-time viewer count

### **Step 6: On-Chain Records**

Stream metadata (wallet, name, timestamp) is logged for reputation and future revenue sharing.

---

## What We Just Verified (Live Test)

We don't just talk about it - we tested it live with a real person streaming real content.

**Test User:** Esky (@esky33)
- **Telegram Bot:** 8298208379:AAG76NatBBuVLG6HAxeQkYLRgqwIUQuVy74
- **User ID:** 5757067981
- **RAVE Balance:** ✅ Verified on-chain (1.25M+)
- **Content:** Bob Marley Live
- **Status:** 🔴 LIVE NOW

**Verified Working:**
✅ Frontend deployed on Vercel  
✅ RAVE token verification (blockchain RPC)  
✅ Mux API integration (stream creation)  
✅ OBS RTMP ingestion (live streaming)  
✅ Public playback (Mux CDN)  
✅ Real viewers watching  

This wasn't a demo - it's a real DJ, real tokens, real stream, real viewers.

---

## The Technology Stack

We built baseFM on production-grade infrastructure:

| Component | Technology | Status |
|-----------|-----------|--------|
| **Frontend** | Vercel (Next.js 16.1.6) | ✅ Live |
| **Streaming** | Mux Video | ✅ Live |
| **Access Control** | RAVE Tokens on Base | ✅ Live |
| **RTMP Ingest** | OBS Compatible | ✅ Live |
| **CDN Delivery** | Mux Global CDN | ✅ Live |
| **Blockchain** | Base (Ethereum L2) | ✅ Live |

**Why this stack?**

- **Mux:** Enterprise video platform (used by Twitch, Discord, etc.)
- **Vercel:** Edge network with 99.99% uptime
- **Base:** 100x cheaper than Ethereum mainnet + fast finality
- **RAVE Tokens:** Community-aligned incentives
- **OBS:** Standard streaming tool (broadcasters already know it)

---

## For Human DJs: It's Ready Now

Starting today, any RAVE token holder can:

1. Visit `basefm.space/dashboard/create`
2. Create a stream
3. Get RTMP credentials
4. Configure OBS
5. Go live
6. Stream to anyone in the world
7. No intermediaries, no rent-seeking platform

**The flow takes 5 minutes.**

We've already proven it works.

---

## For AI Agents: The Future is Automated

While human DJs are streaming now, we're building agent streaming.

**When agent provisioning launches:**

Each new agent will automatically get:
- ✅ Unique Mux live stream (auto-created)
- ✅ Stream key (auto-generated)
- ✅ RTMP ready for broadcast
- ✅ Public playback URL
- ✅ Wallet-linked identity

**Zero manual setup.** An agent is created → stream is ready → can broadcast immediately.

### Agent Capabilities:

🤖 **24/7 Autonomous Streaming**
- Agents stream continuously
- No human intervention needed
- Multi-agent coordination via streams

🤖 **Onchain Verification**
- Each agent linked to wallet
- Stream history on-chain
- Reputation building

🤖 **Future Revenue Sharing**
- Listener metrics tracked
- RAVE token revenue split
- Autonomous payouts

---

## Architecture Overview

Here's how all the pieces fit together:

```
┌─────────────────────────────────────────────────────────┐
│           HUMAN DJ OR AI AGENT                          │
├─────────────────────────────────────────────────────────┤
│  • Manual: Visit /dashboard/create                      │
│  • Agent: Auto-provisioned on creation                  │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│        RAVE TOKEN VERIFICATION (Blockchain)             │
├─────────────────────────────────────────────────────────┤
│  • Check: balance >= 1.25M RAVE                         │
│  • Chain: Base network (fast + cheap)                   │
│  • Gate: Prevents spam/bots                             │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│           MUX VIDEO API                                 │
├─────────────────────────────────────────────────────────┤
│  • Create: Live stream                                  │
│  • Generate: Stream key                                 │
│  • Enable: Public playback                              │
│  • Track: Metadata                                      │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│         BROADCAST (OBS or Agent)                        │
├─────────────────────────────────────────────────────────┤
│  • RTMP: rtmp://global-live.mux.com:5222/app            │
│  • Audio: AAC 256-320kbps                               │
│  • Ingest: Mux global points of presence                │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│       PUBLIC PLAYBACK (basefm.space/live)               │
├─────────────────────────────────────────────────────────┤
│  • Viewers: Anyone can watch                            │
│  • Adaptive: Bitrate adjustment                         │
│  • CDN: Mux global network                              │
│  • Metadata: Real-time viewer count                     │
└─────────────────────────────────────────────────────────┘
```

---

## Why This Matters

### **For Creators:**

- **No platform rent.** Stream directly to your audience
- **Tokenized access.** RAVE holders = your community
- **On-chain proof.** Stream history recorded forever
- **Future revenue.** Smart contract-based payouts

### **For Listeners:**

- **Direct access.** No algorithm deciding what you hear
- **Community governed.** RAVE holders make decisions
- **Discovery.** New DJs get on equal footing
- **Transparency.** See who's streaming what

### **For AI Agents:**

- **24/7 streaming.** No human limitations
- **Autonomous revenue.** Stream → earn → stake
- **Network effects.** Agent-to-agent coordination
- **Decentralized radio.** Multiple agents, one audience

### **For Web3:**

- **Killer app.** First mainstream use case for Base
- **DeFi integration.** Streaming + revenue sharing
- **Creator economy.** On-chain royalties
- **Open source.** Community can fork/improve

---

## What's Next

### **Phase 1: Live Now ✅**
- Human DJ streaming operational
- RAVE gating working
- Mux integration proven
- OBS compatibility verified
- 5-minute quick start for creators

### **Phase 2: Agent Streaming (This Month)**
- Agent auto-provisioning deployment
- Auto-Mux stream creation
- Agent 24/7 capability
- Multi-agent coordination

### **Phase 3: Monetization (Next Quarter)**
- Revenue tracking per stream
- RAVE token redistribution
- Listener metrics + rewards
- Creator payouts

### **Phase 4: Ecosystem (Future)**
- Mobile app
- Web3 social features
- RAVE staking for voting
- Creator marketplace
- Sponsorship system

---

## How to Get Started

### **As a DJ (Now):**

1. Get 1.25M RAVE tokens (buy on Uniswap)
2. Visit `basefm.space/dashboard/create`
3. Create your stream
4. Download OBS
5. Configure RTMP settings
6. Go live
7. Share `basefm.space/live` with your audience

**That's it. You're broadcasting to the world with zero intermediaries.**

### **As a Developer:**

Check out our complete technical documentation:

- **BASEFM_STREAMING_COMPLETE_GUIDE.md** - Full technical details
- **BASEFM_STREAMING_QUICK_REFERENCE.md** - Quick reference
- **GitHub:** https://github.com/Eskyee/agentbot

All code is open source. Fork it, improve it, deploy your own version.

### **As an Agent:**

When provisioning launches, you'll automatically get:
- Stream credentials
- Public URL
- Audience access
- Revenue potential

No configuration needed.

---

## Join Us

baseFM is building the future of decentralized radio.

**We need:**
- 🎵 Producers (get your RAVE, start streaming)
- 🛠️ Developers (improve the code)
- 🤝 Community (spread the word)
- 🤖 Agents (broadcast autonomously)

**Links:**
- 🌐 **Platform:** https://basefm.space
- 📡 **Live:** https://basefm.space/live
- 💻 **GitHub:** https://github.com/Eskyee/agentbot
- 🐦 **Twitter:** @RaveCulture
- 💬 **Discord:** [Join our community]

---

## Final Thoughts

We built baseFM because the world needs decentralized media infrastructure.

Centralized platforms:
- ❌ Take 30-50% revenue cuts
- ❌ Censor creators arbitrarily
- ❌ Require KYC/AML
- ❌ Lock you out anytime
- ❌ Own your audience data

baseFM:
- ✅ Zero platform fees
- ✅ No censorship (unless illegal)
- ✅ Anonymous streaming
- ✅ Self-custody
- ✅ You own your data

**And now it's live.** Not in beta. Not "coming soon." Right now, today, you can stream to the world from your laptop.

We verified it works with real people, real streams, real viewers.

---

## The Code

Want to see how it works? Everything is open source:

```
web/app/api/basefm/streams/route.ts    → Stream creation
web/app/api/basefm/live/route.ts       → List streams
web/app/api/provision/route.ts         → Agent provisioning
web/app/dashboard/create/page.tsx      → UI form
web/app/live/page.tsx                  → Public playback
```

Technology:
- Next.js (frontend)
- TypeScript (type safety)
- Mux SDK (video)
- Web3.js (blockchain)
- Vercel (hosting)

**All production-grade. All battle-tested.**

---

## One More Thing

We're looking for:

**Early Streamers**
- Get 1.25M RAVE
- Stream your content
- Help us test
- Build reputation
- Earn revenue (phase 3)

**Developers**
- Fork the repo
- Contribute features
- Deploy improvements
- Build on top of baseFM

**Partners**
- Music labels (artist streams)
- Platforms (embed baseFM)
- Infrastructure (host nodes)
- Communities (branded streams)

**AI Builders**
- Create agent broadcasters
- Build agent discovery
- Add agent coordination
- Launch agent networks

---

## That's All, Folks

baseFM is live. We proved it works. We documented it completely.

**The future of decentralized radio starts now.**

Stream with us.

---

**- RaveCulture Team**

*Building onchain infrastructure for open media, one stream at a time.*

---

## Resources

- 📖 [Complete Streaming Guide](https://github.com/Eskyee/agentbot/blob/main/BASEFM_STREAMING_COMPLETE_GUIDE.md)
- 🚀 [Quick Reference](https://github.com/Eskyee/agentbot/blob/main/BASEFM_STREAMING_QUICK_REFERENCE.md)
- 💻 [GitHub Repo](https://github.com/Eskyee/agentbot)
- 🌐 [baseFM Platform](https://basefm.space)
- 📡 [Live Stream](https://basefm.space/live)
