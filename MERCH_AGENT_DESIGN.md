# Merch Agent - Design Document

## Executive Summary

The Merch Agent automates pre-order campaigns, inventory tracking, and fulfillment for underground collectives selling vinyl, cassettes, t-shirts, and physical goods. USDC payments, auto-trigger production at thresholds, shipping integration, transparent inventory. Low complexity, high demand, recurring revenue.

**Key Features:**
- Pre-order campaigns in USDC
- Auto-trigger production (50+ units)
- Inventory tracking
- Shipping integration (Printful, Shippo)
- Design templates
- Revenue splits (if collaborative)

**Target Users:**
- Record labels (vinyl, cassettes)
- Collectives (t-shirts, hoodies)
- Artists (limited editions)
- Event organizers (event merch)

---

## 1. Technical Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                  User Interface                          │
│  - Merch Store (browse, purchase)                       │
│  - Campaign Dashboard (manage campaigns)                 │
│  - Design Studio (templates)                             │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│              Backend Services                            │
│  - Campaign Management API                               │
│  - Payment Processing                                    │
│  - Inventory Tracking                                    │
│  - Fulfillment Integration (Printful, Shippo)           │
│  - Notification Service                                  │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│           Blockchain Layer (Base)                        │
│  - MerchPayment Smart Contract                          │
│  - USDC Token Contract                                   │
└──────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- Next.js 16 (store UI)
- TailwindCSS
- Canvas API (design preview)

**Backend:**
- Node.js / TypeScript
- PostgreSQL (campaigns, orders)
- S3 (design files)
- Printful API (print-on-demand)
- Shippo API (shipping)

**Blockchain:**
- Base (USDC payments)
- Smart contracts (escrow, splits)

---

## 2. Database Schema

```sql
-- Merch campaigns
CREATE TABLE merch_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  product_type TEXT NOT NULL, -- vinyl, cassette, tshirt, hoodie
  design_url TEXT,
  price DECIMAL(10, 2) NOT NULL,
  goal_quantity INTEGER NOT NULL, -- Auto-trigger at this number
  current_quantity INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active', -- active, funded, production, shipped, completed
  deadline TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Orders
CREATE TABLE merch_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES merch_campaigns(id),
  buyer_wallet TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  size TEXT, -- For apparel
  shipping_address JSONB NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  tx_hash TEXT,
  status TEXT DEFAULT 'pending', -- pending, paid, shipped, delivered
  tracking_number TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Inventory
CREATE TABLE merch_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES merch_campaigns(id),
  size TEXT,
  quantity INTEGER NOT NULL,
  reserved INTEGER DEFAULT 0,
  available INTEGER GENERATED ALWAYS AS (quantity - reserved) STORED
);

-- Production batches
CREATE TABLE production_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES merch_campaigns(id),
  quantity INTEGER NOT NULL,
  cost DECIMAL(10, 2) NOT NULL,
  supplier TEXT,
  status TEXT DEFAULT 'pending', -- pending, production, shipped, received
  estimated_delivery DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_campaigns_status ON merch_campaigns(status);
CREATE INDEX idx_orders_campaign ON merch_orders(campaign_id);
CREATE INDEX idx_orders_status ON merch_orders(status);
```

---

## 3. API Specification

### Base URL
```
https://agentbot.raveculture.xyz/api/merch
```

### Endpoints

#### POST /api/merch/campaigns/create
Create pre-order campaign

**Request:**
```json
{
  "name": "Warehouse Rave 2026 Tee",
  "description": "Limited edition event tee",
  "productType": "tshirt",
  "designUrl": "https://...",
  "price": 25,
  "goalQuantity": 50,
  "deadline": "2026-03-31T23:59:59Z",
  "sizes": ["S", "M", "L", "XL"],
  "shippingRegions": ["UK", "EU", "US"]
}
```

**Response:**
```json
{
  "success": true,
  "campaignId": "uuid",
  "storeUrl": "https://agentbot.raveculture.xyz/merch/uuid"
}
```

#### GET /api/merch/campaigns/{id}
Get campaign details

**Response:**
```json
{
  "id": "uuid",
  "name": "Warehouse Rave 2026 Tee",
  "description": "...",
  "productType": "tshirt",
  "designUrl": "https://...",
  "price": 25,
  "goalQuantity": 50,
  "currentQuantity": 32,
  "percentFunded": 64,
  "status": "active",
  "deadline": "2026-03-31T23:59:59Z",
  "daysLeft": 35
}
```

#### POST /api/merch/orders/create
Place order

**Request:**
```json
{
  "campaignId": "uuid",
  "quantity": 2,
  "size": "L",
  "shippingAddress": {
    "name": "John Doe",
    "street": "123 Main St",
    "city": "London",
    "postcode": "SW1A 1AA",
    "country": "UK"
  }
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "uuid",
  "amount": 50,
  "paymentAddress": "0x...",
  "expiresAt": "2026-02-24T19:00:00Z"
}
```

#### POST /api/merch/campaigns/{id}/trigger-production
Manually trigger production (if goal reached)

**Response:**
```json
{
  "success": true,
  "batchId": "uuid",
  "quantity": 50,
  "estimatedCost": 500,
  "estimatedDelivery": "2026-03-15"
}
```

#### GET /api/merch/orders/{id}/tracking
Get shipping tracking

**Response:**
```json
{
  "orderId": "uuid",
  "status": "shipped",
  "trackingNumber": "1Z999AA10123456784",
  "carrier": "UPS",
  "estimatedDelivery": "2026-03-05",
  "trackingUrl": "https://..."
}
```

---

## 4. User Flows

### Flow 1: Create Merch Campaign

```
1. User clicks "Create Merch Campaign"
2. Select product type
   - Vinyl (12", 7")
   - Cassette
   - T-shirt
   - Hoodie
   - Sticker pack
3. Upload design or use template
4. Set details:
   - Name, description
   - Price (USDC)
   - Goal quantity (auto-trigger)
   - Deadline
   - Sizes (if apparel)
5. Preview store page
6. Publish campaign
7. Share link with community
```

### Flow 2: Customer Orders Merch

```
1. Customer visits store link
2. Browse available merch
3. Select item, size, quantity
4. Enter shipping address
5. Pay in USDC
6. Receive confirmation
7. Track order status
8. Receive shipment
```

### Flow 3: Auto-Trigger Production

```
1. Campaign reaches goal (50 units)
2. System auto-triggers production
3. Printful API called with:
   - Design file
   - Quantity
   - Sizes breakdown
4. Production starts
5. Creator notified
6. Customers notified: "In production!"
7. Estimated delivery: 2-3 weeks
```

### Flow 4: Fulfillment

```
1. Production completes
2. Items shipped to creator OR
3. Direct-to-customer (Printful)
4. Tracking numbers generated
5. Customers notified
6. Status: "Shipped"
7. Delivery confirmation
8. Campaign marked "Completed"
```

---

## 5. Product Types & Pricing

### Vinyl
- **12" LP:** £15-25 retail, £8-12 production
- **7" Single:** £8-12 retail, £4-6 production
- **Minimum order:** 100 units
- **Production time:** 8-12 weeks
- **Supplier:** Optimal Media, MPO

### Cassettes
- **Standard:** £5-10 retail, £2-3 production
- **Minimum order:** 50 units
- **Production time:** 2-4 weeks
- **Supplier:** National Audio Company, Duplication.ca

### T-Shirts
- **Standard tee:** £20-30 retail, £8-12 production
- **Sizes:** XS-3XL
- **Minimum order:** 25 units
- **Production time:** 1-2 weeks
- **Supplier:** Printful, Printify

### Hoodies
- **Standard hoodie:** £40-60 retail, £20-30 production
- **Sizes:** XS-3XL
- **Minimum order:** 25 units
- **Production time:** 1-2 weeks
- **Supplier:** Printful, Printify

### Stickers
- **Pack of 5:** £5-8 retail, £1-2 production
- **Minimum order:** 100 packs
- **Production time:** 1 week
- **Supplier:** StickerMule, Sticker App

---

## 6. Design Templates

### Pre-made Templates

**1. Event Poster Tee**
- Front: Event poster design
- Back: Date + location
- Customizable: Colors, fonts

**2. Label Logo Hoodie**
- Front: Small logo
- Back: Large logo
- Customizable: Logo upload

**3. Vinyl Sleeve**
- Front: Album art
- Back: Tracklist
- Customizable: Art upload

**4. Cassette J-Card**
- Front: Album art
- Inside: Tracklist, credits
- Customizable: Full design

### Design Studio Features

- Upload custom designs
- Text editor (fonts, colors)
- Logo placement
- Preview on mockups
- Export print-ready files

---

## 7. Shipping Integration

### Printful Integration

**Pros:**
- Print-on-demand (no inventory)
- Direct-to-customer shipping
- Global fulfillment
- API integration

**Cons:**
- Higher per-unit cost
- Less control over quality

**Use case:** T-shirts, hoodies, stickers

### Shippo Integration

**Pros:**
- Compare carrier rates
- Generate labels
- Tracking integration
- Bulk shipping

**Cons:**
- Requires inventory management
- Manual fulfillment

**Use case:** Vinyl, cassettes (bulk orders)

### Shipping Costs

**UK:**
- Standard: £3-5
- Express: £8-12

**EU:**
- Standard: £8-12
- Express: £15-20

**US:**
- Standard: £10-15
- Express: £20-30

**Rest of World:**
- Standard: £12-20
- Express: £25-40

---

## 8. Revenue Model

### Platform Fees
- **5% of sales** (covers payment processing, platform)
- **No upfront costs** for creators
- **No listing fees**

### Revenue Projections

**Month 3:**
- 10 campaigns × 50 units × £20 avg = £10K volume
- 5% fee = £500 revenue

**Month 6:**
- 30 campaigns × 50 units × £20 avg = £30K volume
- 5% fee = £1,500 revenue

**Month 12:**
- 100 campaigns × 50 units × £20 avg = £100K volume
- 5% fee = £5,000 revenue

**Year 1 total: ~£20K from merch**

---

## 9. Success Metrics

### Phase 1 (Beta)
- 5 campaigns launched
- 250 units sold
- £5K volume
- 0 fulfillment issues

### Phase 2 (Launch)
- 30 campaigns
- 1,500 units sold
- £30K volume
- < 2% return rate

### Phase 3 (Scale)
- 100 campaigns
- 5,000 units sold
- £100K volume
- Automated fulfillment

---

## 10. Integration with Other Agents

### Royalty-Split Agent
- Merch sales auto-split to collective members
- Transparent revenue distribution
- Example: 60% creator, 30% label, 10% designer

### Event Agent
- Event merch campaigns
- Pre-order before event
- Pickup at venue OR ship after

### Community Treasury
- Merch profits go to collective treasury
- Transparent accounting
- Fund future events

---

## 11. Next Steps

1. **Week 1:** Database schema + API
2. **Week 2:** Printful integration
3. **Week 3:** Store UI + design studio
4. **Week 4:** Beta test with 5 campaigns
5. **Week 5:** Public launch

🎧
