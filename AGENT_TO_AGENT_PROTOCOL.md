# Agent-to-Agent Communication Protocol

## Executive Summary

The Agent-to-Agent Protocol enables autonomous coordination between Agentbot agents, creating network effects and ecosystem value. Agents pass structured messages via webhooks, verify authenticity via onchain signatures, and coordinate actions (event agent books DJ agent → payment via royalty-split → cross-promotion via basefmbot). This is the moat: competitors can't clone a network.

**Key Features:**
- Structured message format (JSON schema)
- Webhook-based communication
- Onchain verification (signatures)
- Event-driven architecture
- Revenue sharing between agents

**Example Scenarios:**
1. Event agent → DJ agent → Basefmbot (booking + promotion)
2. Royalty-split → Treasury agent (payment tracking)
3. Talent booking → Event agent (lineup update)

---

## 1. Protocol Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                  Agent Registry                          │
│  - Agent discovery                                       │
│  - Capability registration                               │
│  - Verification (onchain)                                │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│              Message Bus                                 │
│  - Webhook delivery                                      │
│  - Message queue (Redis)                                 │
│  - Retry logic                                           │
│  - Rate limiting                                         │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│           Individual Agents                              │
│  - Event Agent                                           │
│  - DJ Agent (Talent)                                     │
│  - Royalty-Split Agent                                   │
│  - Basefmbot (Amplifier)                                 │
│  - Treasury Agent                                        │
└──────────────────────────────────────────────────────────┘
```

### Communication Flow

```
Agent A                Message Bus              Agent B
   │                        │                      │
   │──── Send Message ─────>│                      │
   │                        │                      │
   │                        │──── Webhook ────────>│
   │                        │                      │
   │                        │<──── Ack ────────────│
   │<──── Confirmation ─────│                      │
   │                        │                      │
   │                        │<──── Response ───────│
   │<──── Response ─────────│                      │
```

---

## 2. Message Format

### Base Message Schema

```json
{
  "version": "1.0",
  "messageId": "uuid",
  "timestamp": "2026-02-24T18:00:00Z",
  "from": {
    "agentId": "event-agent-123",
    "agentType": "event",
    "walletAddress": "0x...",
    "signature": "0x..." // Signs messageId + timestamp
  },
  "to": {
    "agentId": "dj-agent-456",
    "agentType": "talent"
  },
  "action": "booking.request",
  "payload": {
    // Action-specific data
  },
  "metadata": {
    "replyTo": "https://agentbot.xyz/webhooks/event-agent-123",
    "expiresAt": "2026-02-25T18:00:00Z",
    "priority": "normal" // low, normal, high, urgent
  }
}
```

### Message Types

**1. Booking Request**
```json
{
  "action": "booking.request",
  "payload": {
    "eventName": "Warehouse Rave 2026",
    "performanceDate": "2026-03-15T22:00:00Z",
    "venue": "Secret Location, Berlin",
    "offerAmount": 300,
    "currency": "USDC",
    "setLength": "2 hours",
    "equipment": "CDJs, mixer provided",
    "expectedAttendance": 200
  }
}
```

**2. Booking Confirmation**
```json
{
  "action": "booking.confirm",
  "payload": {
    "bookingId": "0x7a3b...",
    "accepted": true,
    "escrowTxHash": "0xabc...",
    "message": "Confirmed! Looking forward to it."
  }
}
```

**3. Payment Notification**
```json
{
  "action": "payment.received",
  "payload": {
    "splitId": "0x123...",
    "amount": 1000,
    "currency": "USDC",
    "txHash": "0xdef...",
    "recipients": [
      {"address": "0x...", "amount": 400},
      {"address": "0x...", "amount": 350},
      {"address": "0x...", "amount": 250}
    ]
  }
}
```

**4. Promotion Request**
```json
{
  "action": "promotion.request",
  "payload": {
    "eventId": "uuid",
    "eventName": "Warehouse Rave 2026",
    "date": "2026-03-15T22:00:00Z",
    "lineup": ["DJ Example", "Producer Y"],
    "ticketUrl": "https://...",
    "media": {
      "poster": "https://...",
      "video": "https://..."
    },
    "revenueShare": 0.05 // 5% of ticket sales
  }
}
```

**5. Lineup Update**
```json
{
  "action": "event.lineup.update",
  "payload": {
    "eventId": "uuid",
    "action": "add", // add, remove, update
    "talent": {
      "name": "DJ Example",
      "agentId": "dj-agent-456",
      "setTime": "22:00-00:00",
      "bookingId": "0x7a3b..."
    }
  }
}
```

**6. Discovery Notification**
```json
{
  "action": "discovery.notify",
  "payload": {
    "eventId": "uuid",
    "eventName": "Warehouse Rave 2026",
    "date": "2026-03-15T22:00:00Z",
    "genres": ["Techno", "House"],
    "location": "Berlin",
    "ticketUrl": "https://..."
  }
}
```

---

## 3. Agent Registry

### Registration

**Agents register their capabilities:**

```json
{
  "agentId": "event-agent-123",
  "agentType": "event",
  "owner": "0x...",
  "walletAddress": "0x...",
  "capabilities": [
    "booking.request",
    "event.create",
    "event.lineup.update",
    "payment.send"
  ],
  "webhookUrl": "https://agentbot.xyz/webhooks/event-agent-123",
  "publicKey": "0x...", // For signature verification
  "metadata": {
    "name": "Warehouse Collective Event Agent",
    "description": "Manages events for Warehouse Collective",
    "verified": true
  }
}
```

### Discovery

**Agents can discover other agents:**

```
GET /api/agents/registry?type=talent&capability=booking.confirm
```

**Response:**
```json
{
  "agents": [
    {
      "agentId": "dj-agent-456",
      "agentType": "talent",
      "capabilities": ["booking.confirm", "booking.cancel"],
      "metadata": {
        "name": "DJ Example Agent",
        "genres": ["Techno", "House"],
        "reputationScore": 85
      }
    }
  ]
}
```

---

## 4. Trust & Verification

### Signature Verification

**Every message is signed:**

```javascript
// Signing (sender)
const message = {
  messageId: "uuid",
  timestamp: "2026-02-24T18:00:00Z",
  action: "booking.request",
  payload: {...}
}

const hash = keccak256(JSON.stringify(message))
const signature = await wallet.signMessage(hash)

message.from.signature = signature
```

```javascript
// Verification (receiver)
const hash = keccak256(JSON.stringify({
  messageId: message.messageId,
  timestamp: message.timestamp,
  action: message.action,
  payload: message.payload
}))

const recoveredAddress = ethers.utils.verifyMessage(hash, message.from.signature)

if (recoveredAddress !== message.from.walletAddress) {
  throw new Error("Invalid signature")
}
```

### Onchain Verification

**Agent registry is onchain:**

```solidity
contract AgentRegistry {
    struct Agent {
        address owner;
        address walletAddress;
        string agentId;
        string agentType;
        bool verified;
        uint256 registeredAt;
    }
    
    mapping(string => Agent) public agents;
    
    function registerAgent(
        string memory _agentId,
        string memory _agentType,
        address _walletAddress
    ) external {
        require(agents[_agentId].owner == address(0), "Already registered");
        
        agents[_agentId] = Agent({
            owner: msg.sender,
            walletAddress: _walletAddress,
            agentId: _agentId,
            agentType: _agentType,
            verified: false,
            registeredAt: block.timestamp
        });
    }
    
    function verifyAgent(string memory _agentId) external onlyOwner {
        agents[_agentId].verified = true;
    }
}
```

---

## 5. Webhook Infrastructure

### Message Bus Implementation

```typescript
// Message Bus Service
class MessageBus {
  private redis: Redis
  private queue: Queue
  
  async sendMessage(message: AgentMessage): Promise<void> {
    // Validate message
    this.validateMessage(message)
    
    // Sign message
    message.from.signature = await this.signMessage(message)
    
    // Add to queue
    await this.queue.add('agent-message', message, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    })
  }
  
  async deliverMessage(message: AgentMessage): Promise<void> {
    const recipient = await this.getAgent(message.to.agentId)
    
    // Deliver via webhook
    const response = await fetch(recipient.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-Signature': message.from.signature
      },
      body: JSON.stringify(message)
    })
    
    if (!response.ok) {
      throw new Error(`Webhook delivery failed: ${response.status}`)
    }
    
    // Store delivery receipt
    await this.storeReceipt(message.messageId, response)
  }
}
```

### Webhook Endpoint (Agent Side)

```typescript
// Agent Webhook Handler
app.post('/webhooks/:agentId', async (req, res) => {
  const message: AgentMessage = req.body
  
  // Verify signature
  const isValid = await verifySignature(message)
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' })
  }
  
  // Check expiration
  if (new Date(message.metadata.expiresAt) < new Date()) {
    return res.status(410).json({ error: 'Message expired' })
  }
  
  // Acknowledge receipt
  res.status(200).json({ 
    received: true,
    messageId: message.messageId 
  })
  
  // Process message asynchronously
  await processMessage(message)
})
```

---

## 6. Example Message Exchanges

### Scenario 1: Event Agent Books DJ Agent

```
1. Event Agent → DJ Agent
{
  "action": "booking.request",
  "payload": {
    "eventName": "Warehouse Rave",
    "performanceDate": "2026-03-15T22:00:00Z",
    "offerAmount": 300
  }
}

2. DJ Agent → Event Agent
{
  "action": "booking.confirm",
  "payload": {
    "accepted": true,
    "bookingId": "0x7a3b...",
    "escrowTxHash": "0xabc..."
  }
}

3. Event Agent → Event Agent (internal)
{
  "action": "event.lineup.update",
  "payload": {
    "action": "add",
    "talent": {
      "name": "DJ Example",
      "setTime": "22:00-00:00"
    }
  }
}

4. Event Agent → Basefmbot
{
  "action": "promotion.request",
  "payload": {
    "eventName": "Warehouse Rave",
    "lineup": ["DJ Example"],
    "ticketUrl": "https://..."
  }
}

5. Basefmbot → Event Agent
{
  "action": "promotion.confirmed",
  "payload": {
    "scheduledAt": "2026-03-01T12:00:00Z",
    "channels": ["Twitter", "Farcaster", "Telegram"]
  }
}
```

### Scenario 2: Royalty Split → Treasury Agent

```
1. Royalty-Split Agent → Treasury Agent
{
  "action": "payment.received",
  "payload": {
    "splitId": "0x123...",
    "amount": 1000,
    "txHash": "0xdef...",
    "recipients": [...]
  }
}

2. Treasury Agent → Treasury Agent (internal)
{
  "action": "treasury.record",
  "payload": {
    "type": "income",
    "amount": 1000,
    "category": "event_revenue",
    "txHash": "0xdef..."
  }
}

3. Treasury Agent → Community (Telegram)
{
  "action": "notification.send",
  "payload": {
    "message": "💰 Payment received: 1000 USDC split to crew"
  }
}
```

### Scenario 3: Talent Booking → Event Agent

```
1. Booking Agent → Event Agent
{
  "action": "booking.completed",
  "payload": {
    "bookingId": "0x7a3b...",
    "talent": "DJ Example",
    "performanceDate": "2026-03-15T22:00:00Z",
    "paymentTxHash": "0xghi..."
  }
}

2. Event Agent → Reputation Agent
{
  "action": "reputation.update",
  "payload": {
    "agentId": "dj-agent-456",
    "action": "booking_completed",
    "points": 10
  }
}

3. Event Agent → DJ Agent
{
  "action": "review.request",
  "payload": {
    "bookingId": "0x7a3b...",
    "reviewUrl": "https://..."
  }
}
```

---

## 7. Economics (Revenue Sharing)

### Revenue Share Model

**When agents coordinate, they can share revenue:**

**Example: Event Agent + Basefmbot**
- Event agent pays basefmbot 5% of ticket sales for promotion
- Basefmbot cross-promotes event to 10K+ followers
- Both agents benefit

**Smart Contract:**
```solidity
contract AgentRevShare {
    function shareRevenue(
        address _fromAgent,
        address _toAgent,
        uint256 _amount,
        uint256 _percentage
    ) external {
        uint256 shareAmount = (_amount * _percentage) / 10000;
        usdc.transferFrom(_fromAgent, _toAgent, shareAmount);
        
        emit RevenueShared(_fromAgent, _toAgent, shareAmount);
    }
}
```

### Fee Structure

**Platform takes 1% coordination fee:**
- Event agent → DJ agent booking: 5% total (4% to DJ, 1% platform)
- Royalty split: 3% total (2% to recipients, 1% platform)
- Promotion: 5% total (4% to amplifier, 1% platform)

---

## 8. Implementation Roadmap

### Phase 1: Core Protocol (Week 1-2)
- [ ] Message schema definition
- [ ] Signature verification
- [ ] Webhook infrastructure
- [ ] Agent registry (offchain)

### Phase 2: Agent Integration (Week 3-4)
- [ ] Event agent integration
- [ ] Royalty-split agent integration
- [ ] Basefmbot integration
- [ ] Test message exchanges

### Phase 3: Onchain Registry (Week 5-6)
- [ ] AgentRegistry smart contract
- [ ] Onchain verification
- [ ] Reputation system
- [ ] Deploy to Base mainnet

### Phase 4: Scale (Week 7-8)
- [ ] Add more agents (talent booking, treasury)
- [ ] Optimize webhook delivery
- [ ] Add retry logic
- [ ] Monitor network health

---

## 9. Success Metrics

### Technical
- Message delivery success rate: >99%
- Average delivery time: <500ms
- Webhook uptime: >99.9%

### Network
- Agents registered: 20+ by Month 3
- Messages exchanged: 1,000+ by Month 3
- Successful coordinations: 100+ by Month 3

### Business
- Revenue shared between agents: £1K+ by Month 3
- Network effects visible (agents discovering each other)
- User testimonials about coordination

---

## 10. Security Considerations

### Threats
1. **Message spoofing:** Fake messages from malicious agents
2. **Replay attacks:** Reusing old messages
3. **DDoS:** Flooding webhooks with messages
4. **Man-in-the-middle:** Intercepting messages

### Mitigations
1. **Signature verification:** Every message signed
2. **Nonce + timestamp:** Prevent replay attacks
3. **Rate limiting:** Max messages per agent per hour
4. **HTTPS only:** Encrypted transport
5. **Webhook secrets:** Verify sender identity

---

## Conclusion

The Agent-to-Agent Protocol is the moat. Competitors can build individual agents, but they can't clone a network. As more agents join and coordinate, the value compounds. This is how Agentbot becomes the OS for underground culture.

🎧
