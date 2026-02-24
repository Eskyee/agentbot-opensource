# Talent Booking Marketplace - Design Document

## Executive Summary

The Talent Booking Marketplace enables trustless bookings between organizers and performers using smart contract escrow, onchain reputation, and USDC payments. No DMs, no disputes, no trust required. Browse talent, auto-negotiate rates, lock in with escrow, payment releases on performance date. Network effects: more talent = more organizers = more bookings.

**Key Features:**
- Browse talent profiles (rates, availability, genres)
- Auto-negotiate via agent
- Smart contract escrow
- Payment on performance date
- Onchain reputation system
- Dispute resolution

**Target Users:**
- Event organizers (need talent)
- DJs/producers (want bookings)
- Collectives (book multiple acts)
- Venues (recurring bookings)

---

## 1. Technical Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                  User Interface                          │
│  - Talent Marketplace (browse, search, filter)          │
│  - Booking Dashboard (manage bookings)                   │
│  - Profile Management (talent profiles)                  │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│              Backend Services                            │
│  - Talent Discovery API                                  │
│  - Booking Management API                                │
│  - Negotiation Engine (AI-powered)                       │
│  - Reputation System                                     │
│  - Notification Service                                  │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│           Blockchain Layer (Base)                        │
│  - BookingEscrow Smart Contract                         │
│  - Reputation NFT Contract                               │
│  - USDC Token Contract                                   │
└──────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- Next.js 16 (marketplace UI)
- TailwindCSS (styling)
- OnchainKit (wallet integration)

**Backend:**
- Node.js / TypeScript
- PostgreSQL (profiles, bookings)
- Redis (caching, search)
- Algolia (talent search)

**Blockchain:**
- Base (L2, low fees)
- Solidity 0.8.x
- OpenZeppelin contracts

**AI:**
- OpenAI GPT-4 (negotiation)
- Kimi K2.5 (reasoning)

---

## 2. Smart Contract Design

### BookingEscrow.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract BookingEscrow is ReentrancyGuard {
    
    enum BookingStatus {
        Pending,
        Confirmed,
        Completed,
        Disputed,
        Cancelled,
        Refunded
    }
    
    struct Booking {
        address organizer;
        address talent;
        uint256 amount;
        uint256 performanceDate;
        BookingStatus status;
        uint256 createdAt;
        string eventDetails;
    }
    
    IERC20 public usdc;
    address public platformWallet;
    uint256 public platformFee = 500; // 5%
    
    mapping(bytes32 => Booking) public bookings;
    mapping(address => uint256) public reputationScores;
    
    event BookingCreated(
        bytes32 indexed bookingId,
        address indexed organizer,
        address indexed talent,
        uint256 amount,
        uint256 performanceDate
    );
    
    event BookingConfirmed(bytes32 indexed bookingId);
    event BookingCompleted(bytes32 indexed bookingId);
    event BookingDisputed(bytes32 indexed bookingId);
    event BookingCancelled(bytes32 indexed bookingId);
    event PaymentReleased(bytes32 indexed bookingId, uint256 amount);
    
    function createBooking(
        address _talent,
        uint256 _amount,
        uint256 _performanceDate,
        string memory _eventDetails
    ) external returns (bytes32) {
        require(_performanceDate > block.timestamp, "Date must be future");
        
        bytes32 bookingId = keccak256(
            abi.encodePacked(
                msg.sender,
                _talent,
                _amount,
                _performanceDate,
                block.timestamp
            )
        );
        
        // Transfer USDC to escrow
        require(
            usdc.transferFrom(msg.sender, address(this), _amount),
            "Transfer failed"
        );
        
        bookings[bookingId] = Booking({
            organizer: msg.sender,
            talent: _talent,
            amount: _amount,
            performanceDate: _performanceDate,
            status: BookingStatus.Pending,
            createdAt: block.timestamp,
            eventDetails: _eventDetails
        });
        
        emit BookingCreated(bookingId, msg.sender, _talent, _amount, _performanceDate);
        return bookingId;
    }
    
    function confirmBooking(bytes32 _bookingId) external {
        Booking storage booking = bookings[_bookingId];
        require(msg.sender == booking.talent, "Only talent can confirm");
        require(booking.status == BookingStatus.Pending, "Invalid status");
        
        booking.status = BookingStatus.Confirmed;
        emit BookingConfirmed(_bookingId);
    }
    
    function completeBooking(bytes32 _bookingId) external nonReentrant {
        Booking storage booking = bookings[_bookingId];
        require(
            msg.sender == booking.organizer || msg.sender == booking.talent,
            "Unauthorized"
        );
        require(booking.status == BookingStatus.Confirmed, "Not confirmed");
        require(
            block.timestamp >= booking.performanceDate,
            "Performance date not reached"
        );
        
        booking.status = BookingStatus.Completed;
        
        // Calculate platform fee
        uint256 fee = (booking.amount * platformFee) / 10000;
        uint256 talentAmount = booking.amount - fee;
        
        // Transfer to talent
        require(usdc.transfer(booking.talent, talentAmount), "Transfer failed");
        require(usdc.transfer(platformWallet, fee), "Fee transfer failed");
        
        // Update reputation
        reputationScores[booking.organizer] += 10;
        reputationScores[booking.talent] += 10;
        
        emit BookingCompleted(_bookingId);
        emit PaymentReleased(_bookingId, talentAmount);
    }
    
    function disputeBooking(bytes32 _bookingId) external {
        Booking storage booking = bookings[_bookingId];
        require(
            msg.sender == booking.organizer || msg.sender == booking.talent,
            "Unauthorized"
        );
        require(
            booking.status == BookingStatus.Confirmed ||
            booking.status == BookingStatus.Pending,
            "Invalid status"
        );
        
        booking.status = BookingStatus.Disputed;
        emit BookingDisputed(_bookingId);
    }
    
    function cancelBooking(bytes32 _bookingId) external nonReentrant {
        Booking storage booking = bookings[_bookingId];
        require(msg.sender == booking.organizer, "Only organizer can cancel");
        require(booking.status == BookingStatus.Pending, "Cannot cancel");
        require(
            block.timestamp < booking.performanceDate - 7 days,
            "Too close to event"
        );
        
        booking.status = BookingStatus.Cancelled;
        
        // Refund organizer (minus cancellation fee)
        uint256 cancellationFee = (booking.amount * 100) / 10000; // 1%
        uint256 refundAmount = booking.amount - cancellationFee;
        
        require(usdc.transfer(booking.organizer, refundAmount), "Refund failed");
        require(usdc.transfer(platformWallet, cancellationFee), "Fee failed");
        
        emit BookingCancelled(_bookingId);
    }
}
```

---

## 3. Database Schema

```sql
-- Talent profiles
CREATE TABLE talent_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  wallet_address TEXT UNIQUE NOT NULL,
  stage_name TEXT NOT NULL,
  bio TEXT,
  genres JSONB, -- ["Techno", "House"]
  base_rate DECIMAL(10, 2), -- USDC
  availability JSONB, -- Calendar data
  social_links JSONB, -- {instagram, soundcloud, etc}
  media JSONB, -- {photos, mixes, videos}
  reputation_score INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT UNIQUE NOT NULL, -- onchain ID
  organizer_id TEXT NOT NULL,
  talent_id TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  performance_date TIMESTAMP NOT NULL,
  event_details JSONB,
  status TEXT DEFAULT 'pending',
  tx_hash TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Reviews
CREATE TABLE booking_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT NOT NULL REFERENCES bookings(booking_id),
  reviewer_id TEXT NOT NULL,
  reviewee_id TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Availability
CREATE TABLE talent_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id TEXT NOT NULL,
  date DATE NOT NULL,
  available BOOLEAN DEFAULT true,
  UNIQUE(talent_id, date)
);

-- Indexes
CREATE INDEX idx_talent_genres ON talent_profiles USING GIN (genres);
CREATE INDEX idx_talent_reputation ON talent_profiles(reputation_score DESC);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_date ON bookings(performance_date);
```

---

## 4. API Specification

### Base URL
```
https://agentbot.raveculture.xyz/api/bookings
```

### Endpoints

#### GET /api/talent
Search and browse talent

**Query params:**
```
?genre=Techno
&minRate=100
&maxRate=500
&availability=2026-03-01
&location=London
&sort=reputation
&limit=20
```

**Response:**
```json
{
  "results": [
    {
      "id": "uuid",
      "stageName": "DJ Example",
      "genres": ["Techno", "House"],
      "baseRate": 300,
      "reputationScore": 85,
      "totalBookings": 42,
      "verified": true,
      "avatar": "https://...",
      "bio": "Berlin-based techno DJ...",
      "socialLinks": {...}
    }
  ],
  "total": 156,
  "page": 1
}
```

#### GET /api/talent/{id}
Get talent profile

**Response:**
```json
{
  "id": "uuid",
  "stageName": "DJ Example",
  "bio": "...",
  "genres": ["Techno"],
  "baseRate": 300,
  "reputationScore": 85,
  "totalBookings": 42,
  "verified": true,
  "availability": ["2026-03-01", "2026-03-08"],
  "media": {
    "photos": [...],
    "mixes": [...],
    "videos": [...]
  },
  "reviews": [
    {
      "rating": 5,
      "comment": "Amazing set!",
      "reviewer": "Collective X",
      "date": "2026-02-01"
    }
  ]
}
```

#### POST /api/bookings/create
Create booking request

**Request:**
```json
{
  "talentId": "uuid",
  "amount": 300,
  "performanceDate": "2026-03-15T22:00:00Z",
  "eventDetails": {
    "name": "Warehouse Rave",
    "venue": "Secret Location",
    "expectedAttendance": 200,
    "setLength": "2 hours",
    "equipment": "CDJs, mixer provided"
  }
}
```

**Response:**
```json
{
  "success": true,
  "bookingId": "0x7a3b...",
  "status": "pending",
  "escrowTxHash": "0xabc...",
  "expiresAt": "2026-02-25T18:00:00Z"
}
```

#### POST /api/bookings/{id}/confirm
Talent confirms booking

**Response:**
```json
{
  "success": true,
  "status": "confirmed",
  "txHash": "0xdef..."
}
```

#### POST /api/bookings/{id}/complete
Mark booking as completed

**Response:**
```json
{
  "success": true,
  "status": "completed",
  "paymentTxHash": "0xghi...",
  "talentPaid": 285,
  "platformFee": 15
}
```

#### POST /api/bookings/{id}/dispute
Raise dispute

**Request:**
```json
{
  "reason": "Talent didn't show up",
  "evidence": ["photo_url", "witness_statement"]
}
```

#### POST /api/bookings/{id}/review
Leave review after completion

**Request:**
```json
{
  "rating": 5,
  "comment": "Incredible set, crowd loved it!"
}
```

---

## 5. User Flows

### Flow 1: Organizer Books Talent

```
1. Organizer browses marketplace
   - Filter by genre, rate, availability
   - View talent profiles, mixes, reviews

2. Organizer selects talent
   - View full profile
   - Check availability calendar
   - See base rate

3. Organizer creates booking
   - Enter event details
   - Propose rate (can negotiate)
   - Select performance date
   - Confirm and pay to escrow

4. Talent receives notification
   - Telegram: "New booking request from X"
   - View event details
   - Accept or counter-offer

5. Talent confirms booking
   - Signs smart contract
   - Booking locked in
   - Both parties notified

6. Performance happens
   - Organizer marks as completed
   - OR auto-completes 24h after date

7. Payment released
   - USDC sent to talent
   - Platform fee deducted
   - Both can leave reviews

8. Reputation updated
   - +10 points for both parties
   - Review visible on profiles
```

### Flow 2: Talent Creates Profile

```
1. Talent signs up
   - Connect wallet
   - Enter stage name, bio
   - Select genres

2. Add media
   - Upload photos
   - Link SoundCloud mixes
   - Add videos

3. Set availability
   - Mark available dates
   - Set base rate
   - Add location

4. Get verified (optional)
   - Submit social proof
   - Platform reviews
   - Verified badge

5. Profile goes live
   - Searchable in marketplace
   - Receive booking requests
```

### Flow 3: Negotiation

```
1. Organizer proposes rate
   - "I can offer 250 USDC"

2. Agent analyzes
   - Talent's base rate: 300
   - Event details: 200 capacity
   - Market rates: 250-350

3. Agent suggests counter
   - "Counter with 280 USDC"
   - Reasoning provided

4. Automated back-and-forth
   - Max 3 rounds
   - If no agreement, manual negotiation

5. Agreement reached
   - Both parties sign
   - Escrow created
```

---

## 6. Reputation System

### Reputation Score Calculation

**Base score: 0**

**Positive actions:**
- Complete booking: +10 points
- 5-star review: +5 points
- 4-star review: +3 points
- Verified profile: +20 points
- On-time performance: +2 points

**Negative actions:**
- Cancellation (< 7 days): -20 points
- No-show: -50 points
- 1-star review: -10 points
- Dispute (if found at fault): -30 points

**Reputation tiers:**
- 0-50: New
- 51-100: Established
- 101-200: Trusted
- 201+: Elite

**Benefits by tier:**
- **Trusted:** Featured in search
- **Elite:** Lower platform fees (3% instead of 5%)

### Reputation NFT

**Onchain badge:**
- Minted after 10 completed bookings
- Shows reputation tier
- Transferable (but loses history)
- Visible across ecosystem

---

## 7. UI/UX Design

### Marketplace View

```
┌─────────────────────────────────────────────────────────┐
│  Talent Marketplace                    [Filters] [Sort]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ [Photo]  DJ Example                    ⭐ 4.8/5  │  │
│  │          Techno • House                           │  │
│  │          300 USDC/night • Berlin                  │  │
│  │          42 bookings • Verified ✓                 │  │
│  │          [View Profile] [Book Now]                │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ [Photo]  Producer Y                   ⭐ 4.9/5   │  │
│  │          Drum & Bass                              │  │
│  │          250 USDC/night • London                  │  │
│  │          28 bookings • Verified ✓                 │  │
│  │          [View Profile] [Book Now]                │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Talent Profile

```
┌─────────────────────────────────────────────────────────┐
│  ← Back to Marketplace                                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [Large Photo]                                           │
│                                                          │
│  DJ Example                              ⭐ 4.8/5 (42)  │
│  Verified ✓ • Elite Tier                                │
│                                                          │
│  Techno • House • Minimal                               │
│  Berlin, Germany                                         │
│                                                          │
│  300 USDC/night                                         │
│  [Book Now]                                             │
│                                                          │
│  Bio:                                                    │
│  Berlin-based techno DJ with 10+ years experience...    │
│                                                          │
│  Mixes:                                                  │
│  🎵 Warehouse Sessions #42                              │
│  🎵 Berghain Closing Set                                │
│                                                          │
│  Reviews:                                                │
│  ⭐⭐⭐⭐⭐ "Incredible set!" - Collective X              │
│  ⭐⭐⭐⭐⭐ "Crowd loved it" - Warehouse Crew            │
│                                                          │
│  Availability:                                           │
│  [Calendar showing available dates]                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 8. Network Effects

### How Network Effects Work

**More talent → More organizers:**
- Larger talent pool = more choice
- Better discovery = easier bookings
- Organizers come for selection

**More organizers → More talent:**
- More gigs = more income
- Consistent bookings = join platform
- Talent comes for opportunities

**More bookings → Better data:**
- Market rates become clear
- Reputation scores more accurate
- AI negotiation improves

**Agent-to-agent coordination:**
- Event agent books DJ agent
- DJ agent updates availability
- Basefmbot cross-promotes
- Royalty-split handles payment

### Viral Growth Mechanisms

1. **Talent invites talent**
   - "Join and get more bookings"
   - Referral bonuses

2. **Organizers invite organizers**
   - "Found great talent here"
   - Word-of-mouth

3. **Reviews drive discovery**
   - High-rated talent featured
   - Social proof

4. **Onchain reputation portable**
   - Use across platforms
   - Verified history

---

## 9. Go-to-Market Strategy

### Phase 1: Seed (Month 1)
- Recruit 10 DJs manually
- Recruit 5 organizers
- Facilitate 5 bookings
- Gather feedback

### Phase 2: Beta (Month 2-3)
- 50 DJs on platform
- 20 organizers
- 30 bookings/month
- Refine based on feedback

### Phase 3: Launch (Month 4-6)
- Public launch
- 200 DJs
- 100 organizers
- 100 bookings/month
- Case studies

### Phase 4: Scale (Month 7-12)
- 1,000 DJs
- 500 organizers
- 500 bookings/month
- International expansion

---

## 10. Revenue Model

### Platform Fees
- **Booking fee:** 5% (3% for Elite tier)
- **Cancellation fee:** 1% (if > 7 days before)
- **Dispute resolution:** 2% (if mediation needed)

### Revenue Projections

**Month 3:**
- 30 bookings × £300 avg = £9K volume
- 5% fee = £450 revenue

**Month 6:**
- 100 bookings × £300 avg = £30K volume
- 5% fee = £1,500 revenue

**Month 12:**
- 500 bookings × £300 avg = £150K volume
- 5% fee = £7,500 revenue

**Year 1 total: ~£30K from bookings**

---

## 11. Success Metrics

### Phase 1 (Beta)
- 10 DJs signed up
- 5 organizers
- 5 completed bookings
- 0 disputes

### Phase 2 (Launch)
- 200 DJs
- 100 organizers
- 100 bookings/month
- < 5% dispute rate
- 4.5+ avg rating

### Phase 3 (Scale)
- 1,000 DJs
- 500 organizers
- 500 bookings/month
- £150K+ monthly volume
- Network effects visible

---

## 12. Next Steps

1. **Week 1-2:** Smart contract development
2. **Week 3-4:** Backend API + database
3. **Week 5-6:** Frontend marketplace UI
4. **Week 7:** Beta testing with 10 DJs
5. **Week 8:** Public launch

🎧
