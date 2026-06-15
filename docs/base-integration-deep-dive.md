# Base Integration Deep Dive — Full Guide

**Complete reference for NFT deployment, CDP billing, onchain notifications, and Base MCP integration.**

By Eskyee · RaveCulture · June 2026

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [NFT Contract Deployment (ERC-721)](#2-nft-contract-deployment)
3. [CDP Billing & Paymaster Setup](#3-cdp-billing--paymaster-setup)
4. [Onchain Notifications System](#4-onchain-notifications-system)
5. [Base MCP Integration](#5-base-mcp-integration)
6. [Production Checklist](#6-production-checklist)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        AGENTBOT ON BASE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │
│  │  NFT     │    │  CDP     │    │  Webhook │    │  Base    │ │
│  │  Mint    │    │  Trade   │    │  Events  │    │  MCP     │ │
│  │  API     │    │  Swap    │    │  System  │    │  Server  │ │
│  └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘ │
│       │               │               │               │        │
│       ▼               ▼               ▼               ▼        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Base Chain (L2)                       │   │
│  │  ERC-721 Wristband NFT  ·  USDC/ETH Swaps  ·  Events  │   │
│  └─────────────────────────────────────────────────────────┘   │
│       │               │               │               │        │
│       ▼               ▼               ▼               ▼        │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │
│  │  CDP     │    │  CDP     │    │  CDP     │    │  Base    │ │
│  │  Pay-    │    │  Trade   │    │  Webhooks│    │  Wallet  │ │
│  │  master  │    │  API     │    │  API     │    │  Sign-   │ │
│  │  (gas-   │    │  (swap   │    │  (event  │    │  off     │ │
│  │   less)  │    │   exec)  │    │   notify)│    │  (MCP)   │ │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘ │
│                                                                 │
│  Builder Code: bc_4k0319ta (ERC-8021 attribution)               │
│  Base App ID:  6a2206092736fd92ff84d477                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. NFT Contract Deployment

### 2.1 The Smart Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title BaseFMDigitalWristband
 * @notice ERC-721 NFT for baseFM event access
 * @dev Supports gasless minting via CDP Paymaster
 *
 * Deployed on: Base Mainnet
 * Network:     Base (L2, OP Stack)
 */
contract BaseFMDigitalWristband is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    uint256 private _nextTokenId;
    uint256 public constant MAX_SUPPLY = 10_000;
    uint256 public mintPrice = 0.001 ether;

    string private _baseTokenURI;

    event WristbandMinted(address indexed to, uint256 indexed tokenId, string tokenURI);
    event BaseURIUpdated(string newBaseURI);

    constructor(
        string memory name,
        string memory symbol,
        string memory baseURI,
        address initialOwner
    ) ERC721(name, symbol) Ownable(initialOwner) {
        _baseTokenURI = baseURI;
    }

    /**
     * @notice Mint a wristband NFT
     * @dev Can be called by anyone. Paymaster sponsors gas for allowlisted users.
     */
    function mintWristband(
        address to,
        string calldata tokenURI
    ) external payable nonReentrant returns (uint256) {
        require(to != address(0), "Invalid recipient");
        require(_nextTokenId < MAX_SUPPLY, "Max supply reached");
        require(msg.value >= mintPrice, "Insufficient payment");

        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);

        // Store custom URI
        if (bytes(tokenURI).length > 0) {
            _setTokenURI(tokenId, tokenURI);
        }

        emit WristbandMinted(to, tokenId, tokenURI);
        return tokenId;
    }

    /**
     * @notice Gasless mint for allowlisted addresses (sponsored by Paymaster)
     */
    function gaslessMint(
        address to,
        string calldata tokenURI
    ) external returns (uint256) {
        require(to != address(0), "Invalid recipient");
        require(_nextTokenId < MAX_SUPPLY, "Max supply reached");

        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);

        if (bytes(tokenURI).length > 0) {
            _setTokenURI(tokenId, tokenURI);
        }

        emit WristbandMinted(to, tokenId, tokenURI);
        return tokenId;
    }

    function setMintPrice(uint256 newPrice) external onlyOwner {
        mintPrice = newPrice;
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");
        payable(owner()).transfer(balance);
    }

    // Required overrides
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
```

### 2.2 Remix Deployment (Step-by-Step)

1. **Open Remix IDE:** [remix.ethereum.org](https://remix.ethereum.org)
2. **Create file:** `contracts/BaseFMDigitalWristband.sol` — paste the contract above
3. **Compile:** Solidity compiler → version `0.8.20+` → Compile `BaseFMDigitalWristband`
4. **Connect wallet:** MetaMask → switch to **Base Mainnet**
   - Network: Base Mainnet
   - Chain ID: 8453
   - RPC: `https://mainnet.base.org`
   - Explorer: `https://basescan.org`
5. **Deploy tab:**
   - Environment: `Injected Provider - MetaMask`
   - Contract: `BaseFMDigitalWristband`
   - Constructor args:
     - `name`: `"baseFM Digital Wristband"`
     - `symbol`: `"bfmw"`
     - `baseURI`: `"https://agentbot.sh/api/wristband/metadata/"`
     - `initialOwner`: your wallet address
6. **Click Deploy** → MetaMask pops up → Confirm
7. **Verify on BaseScan:**
   - Go to `basescan.org` → paste contract address
   - Click "Contract" → "Verify and Publish"
   - Compiler     0.8.34+commit.80d5c536`
   - Optimization: Yes, 200 runs
   - Paste source code → Verify

### 2.3 Deployment Parameters

| Parameter | Value |
|-----------|-------|
| Network | Base Mainnet (Chain ID: 8453) |
| Compiler | Solidity 0.8.34+ |
| Optimizer | Yes, 200 runs |
| License | MIT |
| Gas estimate | ~0.003 ETH (~$0.50 on Base) |

### 2.4 Agentbot Integration

After deploying, update the environment variable:

```bash
# Add to Vercel env
vercel env add WRISTBAND_CONTRACT_ADDRESS production
# Enter your new contract address: 0x...
```

The mint API route (`/api/wristband/mint`) reads from `process.env.WRISTBAND_CONTRACT_ADDRESS`.

### 2.5 ABI for Frontend

```typescript
// web/app/lib/wristband-abi.ts
export const WRISTBAND_ABI = [
  {
    name: 'mintWristband',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenURI', type: 'string' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'gaslessMint',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenURI', type: 'string' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'WristbandMinted',
    type: 'event',
    inputs: [
      { name: 'to', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'tokenURI', type: 'string', indexed: false },
    ],
  },
] as const;
```

### 2.6 Wagmi Write Hook (Frontend)

```typescript
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { WRISTBAND_ABI } from '@/app/lib/wristband-abi'

export function useMintWristband() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const mint = (to: `0x${string}`, tokenURI: string) => {
    writeContract({
      address: process.env.NEXT_PUBLIC_WRISTBAND_CONTRACT as `0x${string}`,
      abi: WRISTBAND_ABI,
      functionName: 'mintWristband',
      args: [to, tokenURI],
      value: parseEther('0.001'), // mint price
    })
  }

  return { mint, isPending, isConfirming, isSuccess, error, hash }
}
```

---

## 3. CDP Billing & Paymaster Setup

### 3.1 What Is the CDP Paymaster?

The Coinbase Developer Platform Paymaster is a **fully-managed gas sponsorship service**. It combines a Paymaster and Bundler into a single API endpoint, allowing your dApp to sponsor gas fees for users.

```
┌────────────────────────────────────────────────────────┐
│                   GASLESS FLOW                         │
│                                                        │
│  User (no ETH) ──► Agentbot ──► CDP Paymaster ──► Base│
│                                                        │
│  1. User triggers mint/swap                           │
│  2. Agentbot creates UserOp with PaymasterRequest      │
│  3. Paymaster verifies: "Is this user allowlisted?"    │
│  4. Paymaster signs: "I'll pay the gas"                │
│  5. Bundler submits to Base chain                      │
│  6. User gets NFT/token without holding ETH            │
│                                                        │
│  Billing: Monthly invoice (gas + 7% fee)               │
│  Limit:   $15,000/month (increase via request)         │
└────────────────────────────────────────────────────────┘
```

### 3.2 Step-by-Step CDP Setup

#### Step 1: Create CDP Account

1. Go to [cdp.coinbase.com](https://cdp.coinbase.com)
2. Sign up / log in with your Coinbase account
3. Create a new project (e.g., "Agentbot Base")

#### Step 2: Enable Billing

1. Go to **Settings → Billing**
2. Add a payment method (credit card or crypto)
3. This is **required** — Paymaster won't work without billing

> ⚠️ Without billing, you'll see: *"No billing attached to account for mainnet sponsorship"*

#### Step 3: Create API Keys

1. Go to **API Keys** → **Create Key**
2. Name: `agentbot-paymaster`
3. Copy both:
   - **Key Name** (UUID): `e729d6f2-8b2c-4f78-8c20-49c281e377ed`
   - **Key Private Key**: (download or copy immediately — shown once)

#### Step 4: Configure Paymaster

1. Go to **Paymaster** → **Configuration**
2. Select **Base Mainnet**
3. Toggle **Enable Paymaster**
4. Add your NFT contract to the **Allowlist Contracts**:
   - Enter contract address (e.g., `0x66519FCAee1Ed65bc9e0aCc25cCD900668D3eD49`)
   - Add methods: `mintWristband`, `gaslessMint`
5. Copy the **RPC URL**:
   ```
   https://api.developer.coinbase.com/rpc/v1/base/YOUR_API_KEY
   ```

#### Step 5: Test on Sepolia First

```bash
# Switch Paymaster config to Base Sepolia (testnet)
# Get testnet ETH from https://www.alchemy.com/faucets/base-sepolia
# Deploy contract on Sepolia
# Test gasless mint before mainnet
```

### 3.3 Smart Account Requirement

Gas sponsorship **only works with Smart Accounts (ERC-4337)**, not EOAs.

```typescript
// ✅ Smart Account — eligible for Paymaster
import { toCoinbaseSmartAccount } from 'viem/account-abstraction'

const smartAccount = await toCoinbaseSmartAccount({
  client,
  owners: [walletClient],
})

// ❌ EOA (MetaMask default) — NOT eligible for Paymaster
// Users must upgrade to Smart Wallet in Coinbase Wallet
```

### 3.4 Paymaster Proxy (Recommended)

Never expose your CDP API key on the frontend. Build a backend proxy:

```typescript
// web/app/api/paymaster/proxy/route.ts
import { NextRequest, NextResponse } from 'next/server'

const CDP_PAYMASTER_URL = process.env.CDP_PAYMASTER_RPC!

export async function POST(req: NextRequest) {
  const body = await req.json()

  // Optional: validate the request before proxying
  const { method, params } = body
  if (method === 'pm_sponsorTransaction') {
    // Add your validation logic here
    // e.g., check user is on allowlist, rate limit, etc.
  }

  const response = await fetch(CDP_PAYMASTER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await response.json()
  return NextResponse.json(data)
}
```

### 3.5 Billing Costs

| Item | Cost |
|------|------|
| Gas sponsorship | Actual gas + 7% fee |
| Monthly limit | $15,000 (default) |
| Testnet | Unlimited, free |
| Increase limit | Request via CDP support |
| Payment | Credit card or crypto via Coinbase Commerce |

### 3.6 Monitoring

```typescript
// Check Paymaster balance and usage via CDP API
const response = await fetch('https://api.cdp.coinbase.com/v2/paymaster', {
  headers: {
    'Authorization': `Bearer ${CDP_API_KEY}`,
  },
})
const { data } = await response.json()
console.log('Paymaster status:', data)
```

---

## 4. Onchain Notifications System

### 4.1 Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                  NOTIFICATION PIPELINE                        │
│                                                              │
│  Base Chain                                                  │
│     │                                                        │
│     ▼                                                        │
│  Smart Contract emits event                                  │
│  e.g., WristbandMinted(to, tokenId, tokenURI)               │
│     │                                                        │
│     ▼                                                        │
│  CDP Webhooks (Onchain Activity)                             │
│  - Monitors contract events                                  │
│  - Sub-second delivery                                       │
│  - Filters by contract address + event signature             │
│     │                                                        │
│     ▼                                                        │
│  Agentbot Webhook Handler                                    │
│  /api/webhooks/cdp                                           │
│     │                                                        │
│     ├──► Push notification (browser/mobile)                  │
│     ├──► Discord bot message                                 │
│     ├──► Telegram notification                               │
│     ├──► Email (Resend)                                      │
│     └──► Database log (usage_logs / notifications)           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 CDP Onchain Activity Webhooks

#### Setup in CDP Portal

1. Go to **Webhooks** → **Onchain Activity**
2. Click **Create Webhook**
3. Configure:
   - **Network:** Base Mainnet
   - **Contract Address:** Your NFT contract
   - **Events:** `WristbandMinted` (select from ABI or enter signature)
   - **Webhook URL:** `https://agentbot.sh/api/webhooks/cdp`
   - **Secret:** Generate and save (used for HMAC verification)
4. Save → Copy the webhook secret to vault

#### Webhook Handler

```typescript
// web/app/api/webhooks/cdp/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'

const WEBHOOK_SECRET = process.env.CDP_WEBHOOK_SECRET!

function verifySignature(payload: string, signature: string): boolean {
  const expected = createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex')
  return expected === signature
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-cdp-signature') || ''

  // Verify webhook authenticity
  if (!verifySignature(body, signature)) {
    console.error('Invalid webhook signature')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const event = JSON.parse(body)

  switch (event.eventType) {
    case 'transaction': {
      const { contractAddress, transactionHash, logs } = event.data

      // Parse WristbandMinted events from logs
      for (const log of logs) {
        if (log.topics[0] === 'WristbandMinted(address,uint256,string)') {
          const to = '0x' + log.topics[1].slice(26)
          const tokenId = BigInt(log.topics[2]).toString()

          // Send notifications
          await Promise.all([
            notifyDiscord(`🎵 New wristband minted! #${tokenId} → ${to}`),
            notifyTelegram(`🎵 Wristband #${tokenId} minted for ${sliceAddress(to)}`),
            logToDatabase({ type: 'wristband_mint', to, tokenId, txHash: transactionHash }),
          ])
        }
      }
      break
    }

    case 'token_transfer': {
      // Handle ERC-20 transfers (USDC swaps, etc.)
      console.log('Token transfer:', event.data)
      break
    }
  }

  return NextResponse.json({ received: true })
}

// Notification helpers
async function notifyDiscord(message: string) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl) return

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: message }),
  })
}

async function notifyTelegram(message: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!botToken || !chatId) return

  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: message }),
  })
}

async function logToDatabase(data: Record<string, unknown>) {
  // Log to your database for analytics
  console.log('Onchain event:', data)
}

function sliceAddress(addr: string): string {
  return addr.slice(0, 6) + '...' + addr.slice(-4)
}
```

### 4.3 Alternative: Polling-Based Notifications

If CDP webhooks aren't available, poll with viem:

```typescript
// web/app/lib/watch-contract-events.ts
import { createPublicClient, http, parseAbiItem } from 'viem'
import { base } from 'viem/chains'

const client = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL),
})

// Watch for WristbandMinted events
const unwatch = client.watchEvent({
  address: process.env.WRISTBAND_CONTRACT as `0x${string}`,
  event: parseAbiItem(
    'event WristbandMinted(address indexed to, uint256 indexed tokenId, string tokenURI)'
  ),
  onLogs(logs) {
    for (const log of logs) {
      console.log(`Minted #${log.args.tokenId} → ${log.args.to}`)
      // Trigger notifications...
    }
  },
  onError(error) {
    console.error('Event watch error:', error)
  },
})

// Clean up
// unwatch()
```

### 4.4 Notification Channels

| Channel | Setup | Best For |
|---------|-------|----------|
| **Discord** | Webhook URL in channel settings | Community updates |
| **Telegram** | Bot API + chat ID | DM alerts, group posts |
| **Email** | Resend API | Transaction receipts |
| **Push Protocol** | Push Nodes | Decentralized notifications |
| **In-App** | WebSocket/SSE | Real-time dashboard |
| **Browser Push** | Service Worker + Push API | Desktop/mobile alerts |

### 4.5 Browser Push Notifications

```typescript
// web/app/lib/push-notifications.ts

// Register service worker
export async function registerPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications not supported')
    return
  }

  const registration = await navigator.serviceWorker.register('/sw.js')

  // Request permission
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return

  // Subscribe to push
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: process.env.NEXT_PUBLIC_VAPID_KEY,
  })

  // Send subscription to backend
  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription),
  })
}

// Send notification when event fires
export function notifyWristbandMinted(tokenId: string, txHash: string) {
  new Notification('🎵 Wristband Minted!', {
    body: `Your digital wristband #${tokenId} is ready!\nView on BaseScan →`,
    icon: '/icons/icon-192x192.png',
    tag: `mint-${tokenId}`,
  })
}
```

---

## 5. Base MCP Integration

### 5.1 What Is Base MCP?

Base MCP (Model Context Protocol) connects AI agents directly to Base Account smart wallets. It allows AI models to:

- Check wallet balances
- Swap tokens
- Sign messages
- Execute DeFi transactions
- All via natural language

**Key property:** Non-custodial. The MCP server never holds private keys. Every transaction requires user sign-off.

### 5.2 Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    BASE MCP STACK                         │
│                                                          │
│  ┌────────────┐     ┌────────────┐     ┌──────────────┐ │
│  │  AI Agent  │────►│  MCP       │────►│  Base Account│ │
│  │  (Atlas)   │     │  Server    │     │  Smart Wallet│ │
│  │            │     │            │     │              │ │
│  │  "Check    │     │  Translates│     │  Signs &     │ │
│  │   balance" │     │  natural   │     │  executes    │ │
│  │            │     │  language  │     │  on-chain    │ │
│  └────────────┘     │  → calls   │     └──────────────┘ │
│                     └────────────┘                       │
│                           │                              │
│                     ┌─────▼─────┐                        │
│                     │  Base     │                        │
│                     │  Chain    │                        │
│                     │  (L2)     │                        │
│                     └───────────┘                        │
│                                                          │
│  Security: User must approve every tx in wallet UI      │
│  Keys:     Never leave the user's device                │
│  Auth:     OAuth / Wallet connection                    │
└──────────────────────────────────────────────────────────┘
```

### 5.3 Setup Guide

#### Step 1: Install Base MCP Server

```bash
# Clone the Base MCP server
git clone https://github.com/coinbase/base-mcp.git
cd base-mcp

# Install dependencies
npm install

# Build
npm run build
```

#### Step 2: Configure Claude Desktop (or other MCP client)

Add to your MCP client config:

```json
// ~/.config/claude/mcp_servers.json
{
  "mcpServers": {
    "base": {
      "command": "node",
      "args": ["/path/to/base-mcp/dist/index.js"],
      "env": {
        "BASE_NETWORK_ID": "8453",
        "CDP_API_KEY_NAME": "your-cdp-key-name",
        "CDP_API_KEY_PRIVATE_KEY": "your-cdp-private-key"
      }
    }
  }
}
```

#### Step 3: Connect Base Account

1. Open Claude Desktop (or your MCP client)
2. Say: *"Connect my Base account"*
3. The MCP server opens a wallet connection flow
4. User signs in via Coinbase Wallet or Base Account
5. Once connected, the agent can propose transactions

### 5.4 Available Tools

| Tool | Description | Example Prompt |
|------|-------------|----------------|
| `get_balance` | Check ETH/ERC-20 balances | "What's my USDC balance?" |
| `swap_tokens` | Swap via Uniswap/Base DEX | "Swap 10 USDC for ETH" |
| `send_token` | Transfer ERC-20 tokens | "Send 5 USDC to 0x..." |
| `sign_message` | Sign a message with wallet | "Sign this message for verification" |
| `read_contract` | Read smart contract state | "How many wristbands have been minted?" |
| `write_contract` | Write to smart contract | "Mint wristband #42" |
| `get_transaction` | Check tx status | "What happened with tx 0x...?" |

### 5.5 Agentbot MCP Integration

Integrate Base MCP into Atlas's capabilities:

```typescript
// web/app/lib/mcp-base.ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

let mcpClient: Client | null = null

export async function getMCPClient(): Promise<Client> {
  if (mcpClient) return mcpClient

  const transport = new StdioClientTransport({
    command: 'node',
    args: ['/opt/base-mcp/dist/index.js'],
    env: {
      BASE_NETWORK_ID: '8453',
      CDP_API_KEY_NAME: process.env.CDP_API_KEY_NAME!,
      CDP_API_KEY_PRIVATE_KEY: process.env.CDP_API_KEY_PRIVATE_KEY!,
    },
  })

  mcpClient = new Client({ name: 'agentbot', version: '1.0.0' })
  await mcpClient.connect(transport)

  return mcpClient
}

// Atlas can call these tools
export async function checkBalance(address: string) {
  const client = await getMCPClient()
  return await client.callTool({
    name: 'get_balance',
    arguments: { address, network: 'base' },
  })
}

export async function swapTokens(
  from: string,
  to: string,
  amount: string,
) {
  const client = await getMCPClient()
  return await client.callTool({
    name: 'swap_tokens',
    arguments: { fromToken: from, toToken: to, amount },
  })
}
```

### 5.6 Security Model

```
┌──────────────────────────────────────────────────┐
│               SECURITY LAYERS                     │
│                                                  │
│  Layer 1: User Sign-Off                          │
│  └─ Every tx requires manual approval in wallet  │
│                                                  │
│  Layer 2: Non-Custodial                          │
│  └─ MCP server never sees private keys           │
│                                                  │
│  Layer 3: Transaction Limits                     │
│  └─ Set max value per tx in wallet settings      │
│                                                  │
│  Layer 4: Allowlisting                           │
│  └─ Only approved contracts can be called        │
│                                                  │
│  Layer 5: Audit Trail                            │
│  └─ All actions logged in wallet history         │
└──────────────────────────────────────────────────┘
```

---

## 6. Production Checklist

### NFT Contract
- [ ] Deploy ERC-721 on Base Mainnet
- [ ] Verify on BaseScan
- [ ] Set mint price (0.001 ETH or free for gasless)
- [ ] Add contract address to Vercel env
- [ ] Test mint flow end-to-end

### CDP Billing
- [ ] Add payment method in CDP Portal
- [ ] Enable Paymaster on Base Mainnet
- [ ] Allowlist NFT contract + methods
- [ ] Build Paymaster proxy (never expose API key)
- [ ] Test gasless mint on Sepolia first
- [ ] Set monthly budget alerts

### Notifications
- [ ] Set up CDP webhooks for contract events
- [ ] Configure webhook handler endpoint
- [ ] Set up Discord/Telegram notification channels
- [ ] Add HMAC signature verification
- [ ] Test with a live mint transaction
- [ ] Add rate limiting to webhook endpoint

### Base MCP
- [ ] Install Base MCP server
- [ ] Configure AI agent with MCP tools
- [ ] Connect Base Account wallet
- [ ] Test balance check + swap flows
- [ ] Add transaction confirmation UI
- [ ] Set up audit logging

### Builder Code
- [ ] Builder code `bc_4k0319ta` on all txs ✅
- [ ] Base App ID in meta tag ✅
- [ ] `dataSuffix` on wagmi config ✅

---

## Quick Reference

### Important Addresses

| Name | Address |
|------|---------|
| Agentbot Token | `0x986b41c76ab8b7350079613340ee692773b34ba3` |
| BaseFM Token | `0x9a43253a0eab813fbe008f8818b1339028f10ba3` |
| Atlas Wallet | `0xd8fd0e1dce89beaab924ac68098ddb17613db56f` |
| Eskyee Wallet | `0x5e05ffd981fc497a12fcce2c0d87767f1e794c30` |

### Important Config

| Config | Value |
|--------|-------|
| Builder Code | `bc_4k0319ta` |
| Base App ID | `6a2206092736fd92ff84d477` |
| Chain ID | 8453 (Mainnet), 84532 (Sepolia) |
| RPC URL | `https://mainnet.base.org` |
| Explorer | `https://basescan.org` |

### Useful Links

| Resource | URL |
|----------|-----|
| Base Docs | https://docs.base.org |
| CDP Portal | https://cdp.coinbase.com |
| Base MCP | https://github.com/coinbase/base-mcp |
| Remix IDE | https://remix.ethereum.org |
| BaseScan | https://basescan.org |
| CDP Paymaster Docs | https://docs.cdp.coinbase.com/paymaster |
| CDP Webhooks Docs | https://docs.cdp.coinbase.com/webhooks |

---

*Built with ❤️ by Agentbot · RaveCulture · June 2026*
