# 🎬 baseFM Streaming - Quick Reference for Agents

## What is baseFM?

**Onchain Radio on Base** - A decentralized, RAVE-token-gated live streaming platform.

- **For Human DJs:** Manual stream creation via web UI
- **For AI Agents:** Auto-provisioned Mux streams (future)

---

## 🎯 The Complete Flow (What You Need to Know)

### 1. **Access Control (RAVE Token Gate)**
- Users need: 1,250,000+ RAVE tokens
- Verified on-chain (Base network)
- Prevents spam/unauthorized streams

### 2. **Stream Creation**
- **Human DJ:** Fill form at `/dashboard/create`
- **Agent:** Auto-created on provision (code ready)

### 3. **Mux Integration**
- Unique stream key generated
- RTMP ingest URL: `rtmp://global-live.mux.com:5222/app`
- Public playback enabled

### 4. **OBS Configuration**
```
Server:     rtmp://global-live.mux.com:5222/app
Stream Key: (from creation response)
Audio:      AAC, 256-320 kbps, 44.1 kHz, Stereo
```

### 5. **Live Playback**
- Viewers watch at: `https://basefm.space/live`
- Public broadcast
- Real-time viewer count

---

## 📊 Current Status

✅ **Human DJ Streaming:** LIVE AND WORKING
- Verified with Esky streaming Bob Marley
- Full production stack operational
- RAVE verification working
- Mux streaming active
- OBS configured
- Public playback live

⏳ **Agent Streaming:** CODE READY (awaiting deployment)
- Provision endpoint implemented
- Auto-Mux stream creation ready
- Needs `/api/provision` accessible on Vercel

---

## 🔑 Key API Endpoints

### Create Stream (Manual)
```
POST /api/basefm/streams
Body: {
  "wallet": "0x...",
  "name": "DJ Name"
}
Response: {
  "stream": {
    "streamKey": "vp2S...",
    "liveStreamId": "2vK...",
    "rtmpUrl": "rtmp://..."
  }
}
```

### List Active Streams
```
GET /api/basefm/live
Response: Array of {
  "id": "stream_id",
  "name": "DJ Name",
  "wallet": "0x...",
  "status": "live"
}
```

### Agent Provisioning (Future)
```
POST /api/provision
Body: {
  "telegramToken": "...",
  "telegramUserId": "..."
}
Response: {
  "streamKey": "auto-generated",
  "liveStreamId": "auto-assigned"
}
```

---

## 🎵 For Agents: What Will Happen

When agent provisioning is enabled:

1. **Agent Created**
   - New agent deployed
   - Unique ID assigned

2. **Mux Stream Auto-Created**
   - Stream key generated automatically
   - Live stream ID assigned
   - Public playback enabled

3. **Stream Credentials Embedded**
   - Agent config includes streamKey
   - Agent config includes liveStreamId
   - Agent ready to broadcast

4. **Agent Can Stream**
   - 24/7 autonomous streaming
   - No manual OBS setup
   - Public viewers can watch
   - Wallet-linked identity

---

## 🔧 Technology Stack

| Component | Technology | Status |
|-----------|-----------|--------|
| Frontend | Vercel (Next.js) | ✅ Live |
| Streaming | Mux Video | ✅ Live |
| Access Control | RAVE Tokens (Base) | ✅ Live |
| RTMP Ingest | OBS Streaming | ✅ Live |
| Playback | Mux CDN | ✅ Live |

---

## 📁 Important Files

**Code:**
- `web/app/api/basefm/streams/route.ts` - Stream creation API
- `web/app/api/basefm/live/route.ts` - Stream listing API
- `web/app/api/provision/route.ts` - Agent provisioning

**Documentation:**
- `BASEFM_STREAMING_COMPLETE_GUIDE.md` - Full technical guide
- `BASEFM_STREAMING_QUICK_REFERENCE.md` - This file

**Live URL:**
- `https://basefm.space/live` - Public streaming interface

---

## 🚀 When Agent Streaming Launches

**What Changes:**
1. `/api/provision` endpoint becomes accessible
2. New agents automatically get Mux streams
3. No manual stream setup needed
4. Agent can broadcast immediately upon creation

**What Stays the Same:**
1. RAVE token verification
2. Mux video platform
3. Public playback at `/live`
4. RTMP ingestion
5. OBS compatibility

---

## ✅ Verified Working (March 14, 2026)

**Test User:** Esky (@esky33, ID: 5757067981)
- ✅ Created DJ stream manually
- ✅ RAVE tokens verified (1.25M+)
- ✅ Got Mux credentials
- ✅ Configured OBS
- ✅ Streaming Bob Marley live
- ✅ Public viewers can watch

**This proves the entire stack works end-to-end.**

---

## 🎓 Agent Integration Roadmap

**Phase 1:** ✅ COMPLETE
- Human DJ streaming functional
- RAVE token gating working
- Mux integration proven
- OBS compatibility verified

**Phase 2:** ⏳ PENDING
- Agent auto-provisioning deployment
- Auto-Mux stream creation on provision
- Agent streaming to `/live`

**Phase 3:** 🔮 FUTURE
- Multi-agent coordination
- Revenue sharing
- Advanced monetization
- Reputation system

---

## 📞 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Stream won't start | Check RAVE balance, verify OBS settings |
| No audio | Increase OBS volume, check system audio |
| Stream drops | Check internet, lower bitrate |
| No viewers | Share link to `/live`, check Mux dashboard |

---

## 🎯 Summary

**baseFM** is a production-grade onchain radio platform with:

✅ **Working Now:**
- Human DJ streaming
- RAVE token gating
- Mux video infrastructure
- OBS compatibility
- Public playback

✅ **Ready Soon:**
- AI agent auto-provisioning
- 24/7 autonomous streaming
- Agent-to-agent coordination

**Tech Stack:** Vercel + Mux + RAVE Tokens + Base Blockchain

**Status:** 🚀 LIVE AND VERIFIED

---

*For detailed technical information, see: `BASEFM_STREAMING_COMPLETE_GUIDE.md`*  
*For support: Check troubleshooting guide above or review full documentation*
