# Royalty-Split Agent - Detailed Design Document

## Executive Summary

The Royalty-Split Agent automates revenue distribution for producer collectives, labels, and collaborations. It uses smart contracts on Base to split payments instantly, transparently, and trustlessly. No spreadsheets, no delays, no disputes.

**Key Features:**
- Automatic USDC splits to 2-10 recipients
- Percentage-based or fixed amounts
- Milestone-based releases (optional)
- Transparent onchain history
- Gasless for recipients
- 3% platform fee

**Target Users:**
- Producer collectives (3-5 members)
- Record labels (multiple artists)
- Remix collaborations (2-4 producers)
- Sample pack creators (revenue sharing)

---

## 1. Technical Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                        │
│  (Dashboard, Telegram Bot, API)                         │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│              Backend Services                            │
│  - Split Management API                                  │
│  - Payment Processing                                    │
│  - Notification Service                                  │
│  - Analytics Engine                                      │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│           Blockchain Layer (Base)                        │
│  - RoyaltySplit Smart Contract                          │
│  - USDC Token Contract                                   │
│  - CDP SDK (Coinbase)                                    │
└──────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- Next.js 16 (React)
- TailwindCSS
- OnchainKit (Coinbase)

**Backend:**
- Node.js / TypeScript
- PostgreSQL (splits, history)
- Redis (caching)
- CDP SDK (wallet management)

**Blockchain:**
- Base (L2, low fees)
- Solidity 0.8.x
- OpenZeppelin contracts
- Hardhat (development)

**Infrastructure:**
- Vercel (hosting)
- Supabase (database)
- Alchemy (RPC)

---

## 2. Smart Contract Design

### RoyaltySplit.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract RoyaltySplit is Initializable, OwnableUpgradeable, PausableUpgradeable {
    
    struct Split {
        address[] recipients;
        uint256[] percentages; // basis points (10000 = 100%)
        uint256 totalReceived;
        uint256 totalDistributed;
        bool isActive;
        uint256 createdAt;
    }
    
    struct Milestone {
        uint256 amount;
        bool released;
        string description;
    }
    
    // Split ID => Split data
    mapping(bytes32 => Split) public splits;
    
    // Split ID => Milestones
    mapping(bytes32 => Milestone[]) public milestones;
    
    // Platform fee (3% = 300 basis points)
    uint256 public platformFee = 300;
    address public platformWallet;
    
    // USDC token address on Base
    IERC20 public usdc;
    
    event SplitCreated(
        bytes32 indexed splitId,
        address[] recipients,
        uint256[] percentages
    );
    
    event PaymentReceived(
        bytes32 indexed splitId,
        uint256 amount,
        address sender
    );
    
    event PaymentDistributed(
        bytes32 indexed splitId,
        address indexed recipient,
        uint256 amount
    );
    
    event MilestoneReleased(
        bytes32 indexed splitId,
        uint256 milestoneIndex,
        uint256 amount
    );
    
    function initialize(
        address _usdc,
        address _platformWallet
    ) public initializer {
        __Ownable_init();
        __Pausable_init();
        usdc = IERC20(_usdc);
        platformWallet = _platformWallet;
    }
    
    /**
     * Create a new split
     */
    function createSplit(
        address[] memory _recipients,
        uint256[] memory _percentages
    ) external returns (bytes32) {
        require(_recipients.length == _percentages.length, "Length mismatch");
        require(_recipients.length >= 2 && _recipients.length <= 10, "2-10 recipients");
        
        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < _percentages.length; i++) {
            totalPercentage += _percentages[i];
        }
        require(totalPercentage == 10000, "Must equal 100%");
        
        bytes32 splitId = keccak256(
            abi.encodePacked(
                msg.sender,
                _recipients,
                _percentages,
                block.timestamp
            )
        );
        
        splits[splitId] = Split({
            recipients: _recipients,
            percentages: _percentages,
            totalReceived: 0,
            totalDistributed: 0,
            isActive: true,
            createdAt: block.timestamp
        });
        
        emit SplitCreated(splitId, _recipients, _percentages);
        return splitId;
    }
    
    /**
     * Receive payment and distribute
     */
    function receivePayment(
        bytes32 _splitId,
        uint256 _amount
    ) external whenNotPaused {
        Split storage split = splits[_splitId];
        require(split.isActive, "Split not active");
        
        // Transfer USDC from sender
        require(
            usdc.transferFrom(msg.sender, address(this), _amount),
            "Transfer failed"
        );
        
        split.totalReceived += _amount;
        
        // Calculate platform fee
        uint256 fee = (_amount * platformFee) / 10000;
        uint256 amountAfterFee = _amount - fee;
        
        // Transfer fee to platform
        require(usdc.transfer(platformWallet, fee), "Fee transfer failed");
        
        // Distribute to recipients
        for (uint256 i = 0; i < split.recipients.length; i++) {
            uint256 recipientAmount = (amountAfterFee * split.percentages[i]) / 10000;
            
            require(
                usdc.transfer(split.recipients[i], recipientAmount),
                "Recipient transfer failed"
            );
            
            split.totalDistributed += recipientAmount;
            
            emit PaymentDistributed(_splitId, split.recipients[i], recipientAmount);
        }
        
        emit PaymentReceived(_splitId, _amount, msg.sender);
    }
    
    /**
     * Add milestone
     */
    function addMilestone(
        bytes32 _splitId,
        uint256 _amount,
        string memory _description
    ) external {
        Split storage split = splits[_splitId];
        require(split.isActive, "Split not active");
        
        milestones[_splitId].push(Milestone({
            amount: _amount,
            released: false,
            description: _description
        }));
    }
    
    /**
     * Release milestone payment
     */
    function releaseMilestone(
        bytes32 _splitId,
        uint256 _milestoneIndex
    ) external whenNotPaused {
        Milestone storage milestone = milestones[_splitId][_milestoneIndex];
        require(!milestone.released, "Already released");
        
        milestone.released = true;
        
        // Distribute milestone amount
        receivePayment(_splitId, milestone.amount);
        
        emit MilestoneReleased(_splitId, _milestoneIndex, milestone.amount);
    }
    
    /**
     * Get split details
     */
    function getSplit(bytes32 _splitId) external view returns (
        address[] memory recipients,
        uint256[] memory percentages,
        uint256 totalReceived,
        uint256 totalDistributed,
        bool isActive
    ) {
        Split storage split = splits[_splitId];
        return (
            split.recipients,
            split.percentages,
            split.totalReceived,
            split.totalDistributed,
            split.isActive
        );
    }
    
    /**
     * Deactivate split
     */
    function deactivateSplit(bytes32 _splitId) external {
        splits[_splitId].isActive = false;
    }
    
    /**
     * Update platform fee (owner only)
     */
    function setPlatformFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "Max 10%");
        platformFee = _fee;
    }
    
    /**
     * Emergency pause
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}
```

### Gas Optimization

- Use `uint256` for percentages (basis points)
- Batch transfers in single transaction
- Minimize storage writes
- Use events for history (cheaper than storage)

### Security Considerations

1. **Reentrancy Protection:** Use OpenZeppelin's ReentrancyGuard
2. **Access Control:** Only split creator can modify
3. **Pausable:** Emergency stop mechanism
4. **Upgradeable:** Proxy pattern for bug fixes
5. **Audit:** Third-party security audit before mainnet

---

## 3. Database Schema

```sql
-- Splits table
CREATE TABLE splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  split_id TEXT UNIQUE NOT NULL, -- onchain split ID
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  recipients JSONB NOT NULL, -- [{address, percentage, name}]
  total_received DECIMAL(20, 6) DEFAULT 0,
  total_distributed DECIMAL(20, 6) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Payments table
CREATE TABLE split_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  split_id TEXT NOT NULL REFERENCES splits(split_id),
  amount DECIMAL(20, 6) NOT NULL,
  sender_address TEXT NOT NULL,
  tx_hash TEXT UNIQUE NOT NULL,
  platform_fee DECIMAL(20, 6) NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, confirmed, failed
  created_at TIMESTAMP DEFAULT NOW()
);

-- Distributions table
CREATE TABLE split_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES split_payments(id),
  recipient_address TEXT NOT NULL,
  amount DECIMAL(20, 6) NOT NULL,
  tx_hash TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Milestones table
CREATE TABLE split_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  split_id TEXT NOT NULL REFERENCES splits(split_id),
  amount DECIMAL(20, 6) NOT NULL,
  description TEXT NOT NULL,
  released BOOLEAN DEFAULT false,
  released_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_splits_user_id ON splits(user_id);
CREATE INDEX idx_splits_split_id ON splits(split_id);
CREATE INDEX idx_payments_split_id ON split_payments(split_id);
CREATE INDEX idx_payments_tx_hash ON split_payments(tx_hash);
CREATE INDEX idx_distributions_payment_id ON split_distributions(payment_id);
CREATE INDEX idx_milestones_split_id ON split_milestones(split_id);
```

---

## 4. API Specification

### Base URL
```
https://agentbot.raveculture.xyz/api/splits
```

### Endpoints

#### POST /api/splits/create
Create a new split

**Request:**
```json
{
  "name": "Remix Collab - Track XYZ",
  "description": "3-way split for remix",
  "recipients": [
    {
      "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "percentage": 40,
      "name": "Producer A"
    },
    {
      "address": "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
      "percentage": 35,
      "name": "Producer B"
    },
    {
      "address": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      "percentage": 25,
      "name": "Producer C"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "splitId": "0x7a3b...",
  "contractAddress": "0x1234...",
  "recipients": [...],
  "createdAt": "2026-02-24T17:00:00Z"
}
```

#### POST /api/splits/{splitId}/pay
Send payment to split

**Request:**
```json
{
  "amount": 1000,
  "currency": "USDC"
}
```

**Response:**
```json
{
  "success": true,
  "txHash": "0xabc...",
  "distributions": [
    {
      "recipient": "0x742d...",
      "amount": 388, // 40% of 970 (after 3% fee)
      "txHash": "0xdef..."
    },
    ...
  ],
  "platformFee": 30
}
```

#### GET /api/splits/{splitId}
Get split details

**Response:**
```json
{
  "splitId": "0x7a3b...",
  "name": "Remix Collab - Track XYZ",
  "recipients": [...],
  "totalReceived": 5000,
  "totalDistributed": 4850,
  "platformFees": 150,
  "isActive": true,
  "createdAt": "2026-02-24T17:00:00Z"
}
```

#### GET /api/splits/{splitId}/history
Get payment history

**Response:**
```json
{
  "splitId": "0x7a3b...",
  "payments": [
    {
      "id": "uuid",
      "amount": 1000,
      "sender": "0x123...",
      "txHash": "0xabc...",
      "timestamp": "2026-02-24T18:00:00Z",
      "distributions": [...]
    },
    ...
  ],
  "totalPages": 5,
  "currentPage": 1
}
```

#### POST /api/splits/{splitId}/milestones
Add milestone

**Request:**
```json
{
  "amount": 500,
  "description": "First 1000 streams"
}
```

#### POST /api/splits/{splitId}/milestones/{milestoneId}/release
Release milestone payment

**Response:**
```json
{
  "success": true,
  "milestone": {...},
  "txHash": "0xabc...",
  "distributions": [...]
}
```

---

## 5. User Flows

### Flow 1: Create Split

```
1. User clicks "Create Split" in dashboard
2. Enter split name and description
3. Add recipients (address + percentage)
4. System validates:
   - 2-10 recipients
   - Percentages sum to 100%
   - Valid addresses
5. User confirms
6. System deploys smart contract
7. Split created, user gets split ID
8. Share split ID with payers
```

### Flow 2: Receive Payment

```
1. Payer has split ID
2. Payer sends USDC to split contract
3. Smart contract:
   - Deducts 3% platform fee
   - Calculates recipient amounts
   - Transfers to all recipients
4. All recipients notified via Telegram
5. Payment recorded in history
```

### Flow 3: Milestone-Based Release

```
1. Creator sets milestone: "500 USDC at 1000 streams"
2. Milestone tracked in database
3. When condition met:
   - Creator clicks "Release Milestone"
   - Payment distributed automatically
4. Recipients notified
5. Milestone marked as released
```

---

## 6. UI/UX Design

### Dashboard View

```
┌─────────────────────────────────────────────────────────┐
│  Royalty Splits                                    [+ New]│
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Remix Collab - Track XYZ                    Active│  │
│  │ 3 recipients • Created Feb 24                      │  │
│  │                                                     │  │
│  │ Total Received: 5,000 USDC                         │  │
│  │ Total Distributed: 4,850 USDC                      │  │
│  │ Platform Fees: 150 USDC                            │  │
│  │                                                     │  │
│  │ Recipients:                                         │  │
│  │ • Producer A (40%) - 1,940 USDC                    │  │
│  │ • Producer B (35%) - 1,697.50 USDC                 │  │
│  │ • Producer C (25%) - 1,212.50 USDC                 │  │
│  │                                                     │  │
│  │ [View History] [Add Milestone] [Share Link]       │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Create Split Modal

```
┌─────────────────────────────────────────────────────────┐
│  Create Royalty Split                              [X]   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Split Name *                                            │
│  [Remix Collab - Track XYZ                          ]   │
│                                                          │
│  Description                                             │
│  [3-way split for remix collaboration              ]   │
│                                                          │
│  Recipients *                                            │
│  ┌────────────────────────────────────────────────┐    │
│  │ Recipient 1                                     │    │
│  │ Address: [0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb]│
│  │ Name: [Producer A                              ]│    │
│  │ Percentage: [40] %                              │    │
│  └────────────────────────────────────────────────┘    │
│  [+ Add Recipient]                                      │
│                                                          │
│  Total: 100% ✓                                          │
│                                                          │
│  [Cancel]                          [Create Split]       │
└─────────────────────────────────────────────────────────┘
```

### Payment History

```
┌─────────────────────────────────────────────────────────┐
│  Payment History - Remix Collab                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Feb 24, 2026 - 1,000 USDC                              │
│  From: 0x123...abc                                      │
│  Tx: 0xdef...789                                        │
│  ├─ Producer A: 388 USDC (40%)                          │
│  ├─ Producer B: 339.50 USDC (35%)                       │
│  └─ Producer C: 242.50 USDC (25%)                       │
│  Platform Fee: 30 USDC                                  │
│                                                          │
│  Feb 23, 2026 - 500 USDC                                │
│  From: 0x456...def                                      │
│  ...                                                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 7. Integration Points

### CDP SDK Integration

```typescript
import { Coinbase, Wallet } from '@coinbase/cdp-sdk'

// Initialize CDP
Coinbase.configure({
  apiKeyName: process.env.CDP_API_KEY_NAME,
  privateKey: process.env.CDP_API_KEY_PRIVATE_KEY
})

// Create wallet for split contract
const wallet = await Wallet.create()
const address = await wallet.getDefaultAddress()

// Transfer USDC to split
const transfer = await wallet.transfer(
  amount,
  'usdc',
  splitContractAddress,
  { gasless: true }
)

await transfer.wait()
```

### Telegram Bot Integration

```typescript
// Notify recipients of payment
async function notifyRecipients(splitId: string, payment: Payment) {
  const split = await getSplit(splitId)
  
  for (const recipient of split.recipients) {
    if (recipient.telegram) {
      await bot.sendMessage(
        recipient.telegram,
        `💰 Payment received!
        
Split: ${split.name}
Amount: ${recipient.amount} USDC
Tx: ${payment.txHash}

View: https://basescan.org/tx/${payment.txHash}`
      )
    }
  }
}
```

### Webhook Support

```typescript
// POST /api/webhooks/splits
// Notify external systems of payments

interface SplitWebhook {
  event: 'payment.received' | 'payment.distributed' | 'milestone.released'
  splitId: string
  amount: number
  txHash: string
  timestamp: string
}
```

---

## 8. Security & Compliance

### Security Measures

1. **Smart Contract Audit**
   - Third-party audit (OpenZeppelin, Trail of Bits)
   - Bug bounty program
   - Testnet deployment first

2. **Access Control**
   - Only split creator can modify
   - Multi-sig for platform admin functions
   - Rate limiting on API

3. **Data Protection**
   - Encrypted wallet seeds
   - HTTPS only
   - No PII stored onchain

4. **Monitoring**
   - Real-time transaction monitoring
   - Anomaly detection
   - Alert system for large transfers

### Compliance

1. **KYC/AML**
   - Not required for USDC transfers
   - Monitor for suspicious activity
   - Comply with local regulations

2. **Tax Reporting**
   - Provide transaction history export
   - Recipients responsible for own taxes
   - Platform reports fees as revenue

3. **Terms of Service**
   - Clear fee structure (3%)
   - No liability for recipient disputes
   - Users own their splits

---

## 9. Testing Strategy

### Unit Tests
- Smart contract functions
- API endpoints
- Database operations
- Calculation logic

### Integration Tests
- End-to-end payment flow
- Webhook delivery
- Telegram notifications
- CDP SDK integration

### Security Tests
- Reentrancy attacks
- Integer overflow
- Access control
- Gas limit attacks

### User Acceptance Tests
- Create split flow
- Receive payment flow
- View history
- Mobile responsiveness

---

## 10. Deployment Plan

### Phase 1: Testnet (Week 1)
- Deploy to Base Sepolia
- Internal testing
- Fix bugs

### Phase 2: Beta (Week 2-3)
- Deploy to Base mainnet
- 5 beta users
- Real USDC (small amounts)
- Gather feedback

### Phase 3: Launch (Week 4)
- Public launch
- Blog post announcement
- Onboard 50 users
- Monitor closely

### Phase 4: Scale (Month 2+)
- Optimize gas costs
- Add features (milestones, etc.)
- Integrate with other agents
- 500+ users

---

## 11. Success Metrics

### Technical Metrics
- Transaction success rate: >99%
- Average gas cost: <$0.10
- API response time: <200ms
- Uptime: >99.9%

### Business Metrics
- Splits created: 100+ in month 1
- Total volume: 10,000+ USDC in month 1
- Platform fees: £300+ in month 1
- User retention: >80%

### User Metrics
- Time to create split: <2 minutes
- Payment distribution time: <30 seconds
- User satisfaction: NPS >50
- Support tickets: <5% of users

---

## 12. Future Enhancements

### V2 Features
- Multi-token support (ETH, other ERC20s)
- Recurring payments (subscriptions)
- Conditional splits (if/then logic)
- NFT-gated splits
- Cross-chain support (Ethereum, Polygon)

### V3 Features
- DAO integration (governance)
- Dispute resolution system
- Automated royalty tracking (Spotify, etc.)
- Tax reporting automation
- Fiat on-ramp integration

---

## 13. Cost Analysis

### Development Costs
- Smart contract development: 2 weeks
- Backend API: 1 week
- Frontend UI: 1 week
- Testing & audit: 1 week
- **Total:** 5 weeks

### Operational Costs
- RPC calls (Alchemy): £50/mo
- Database (Supabase): £25/mo
- Hosting (Vercel): £20/mo
- Monitoring: £10/mo
- **Total:** £105/mo

### Revenue Projections
- Month 1: 100 splits × £100 avg = £10K volume → £300 revenue
- Month 3: 500 splits × £150 avg = £75K volume → £2.25K revenue
- Month 6: 2000 splits × £200 avg = £400K volume → £12K revenue

**Break-even:** Month 1 (revenue > costs)

---

## 14. Implementation Checklist

### Smart Contract
- [ ] Write RoyaltySplit.sol
- [ ] Write tests (100% coverage)
- [ ] Deploy to testnet
- [ ] Security audit
- [ ] Deploy to mainnet

### Backend
- [ ] Database schema
- [ ] API endpoints
- [ ] CDP SDK integration
- [ ] Webhook system
- [ ] Telegram bot

### Frontend
- [ ] Dashboard UI
- [ ] Create split flow
- [ ] Payment history
- [ ] Mobile responsive
- [ ] Error handling

### Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] Security tests
- [ ] User acceptance tests
- [ ] Load testing

### Launch
- [ ] Beta testing (5 users)
- [ ] Bug fixes
- [ ] Documentation
- [ ] Blog post
- [ ] Public launch

---

## 15. Conclusion

The Royalty-Split Agent solves a critical pain point for underground collectives: automatic, transparent, trustless revenue distribution. By leveraging smart contracts on Base, we enable instant USDC splits with minimal fees and zero trust required.

**Key Advantages:**
- **Instant:** Payments distributed in seconds
- **Transparent:** All splits visible onchain
- **Trustless:** Smart contract enforces rules
- **Cheap:** Base L2 = low gas fees
- **Simple:** 2-minute setup, automatic thereafter

**Next Steps:**
1. Develop smart contract (Week 1)
2. Build API and UI (Week 2-3)
3. Beta test with 5 collectives (Week 4)
4. Public launch (Week 5)

**Timeline:** 5 weeks to launch
**Investment:** 5 weeks dev time + £105/mo ops
**Revenue:** £300+ month 1, £12K+ month 6

Let's build it. 🎧

---

**Document Version:** 1.0
**Last Updated:** 2026-02-24
**Status:** Ready for implementation
