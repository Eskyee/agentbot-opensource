# NFT Contract Deployment Guide — Remix IDE

**Step-by-step guide to deploy your BaseFMDigitalWristband ERC-721 contract on Base Mainnet.**

## Prerequisites

- [MetaMask](https://metamask.io) browser extension installed
- ~0.005 ETH on Base Mainnet (~$0.80) for deployment gas
- The contract source code (`contracts/BaseFMDigitalWristband.sol`)

## Step 1: Get Base Mainnet ETH

You need a small amount of ETH on Base for deployment gas:

```bash
# Option 1: Bridge from Ethereum Mainnet
# Go to https://bridge.base.org
# Bridge 0.01 ETH from Ethereum → Base

# Option 2: If you have ETH on Coinbase
# Send ETH to your wallet, select "Base" network

# Option 3: Use a faucet (testnet only)
# For Base Sepolia: https://www.alchemy.com/faucets/base-sepolia
```

## Step 2: Add Base Mainnet to MetaMask

```bash
# Base Mainnet parameters (auto-adds if you visit bridge.base.org)
Network Name:     Base Mainnet
Chain ID:         8453
Currency Symbol:  ETH
RPC URL:          https://mainnet.base.org
Explorer:         https://basescan.org
```

## Step 3: Open Remix IDE

1. Go to [remix.ethereum.org](https://remix.ethereum.org)
2. You'll see the default workspace

## Step 4: Create the Contract File

1. In the left sidebar, click **"contracts"** folder
2. Right-click → **New File**
3. Name it: `BaseFMDigitalWristband.sol`
4. Paste the full contract code from `contracts/BaseFMDigitalWristband.sol`

## Step 5: Compile the Contract

1. Click the **Solidity Compiler** icon (left sidebar, 3rd icon)
2. Set compiler version: **0.8.20+commit.a1b79de6**
3. Enable optimization: **Yes** (200 runs)
4. Click **"Compile BaseFMDigitalWristband.sol"**
5. Wait for ✅ green checkmark

### Compiler Settings

```
Compiler:     0.8.20+commit.a1b79de6
EVM Version:  default
Optimization: Yes
Runs:         200
License:      MIT
```

## Step 6: Deploy to Base Mainnet

1. Click the **Deploy** icon (left sidebar, 4th icon)
2. Under "Environment", select: **"Injected Provider - MetaMask"**
   - MetaMask will pop up asking to connect
   - Click **Connect**
3. Verify you're on **Base Mainnet** (Chain ID: 8453) in MetaMask
4. Under "Contract", select: **BaseFMDigitalWristband**
5. Fill in constructor arguments:

```
name:          "baseFM Digital Wristband"
symbol:        "bfmw"
baseURI:       "https://agentbot.sh/api/wristband/metadata/"
initialOwner:  YOUR_WALLET_ADDRESS (auto-filled by MetaMask)
```

6. Click **"transact"**
7. MetaMask pops up → Review gas fee (~0.003 ETH) → **Confirm**
8. Wait for transaction confirmation (usually 2-5 seconds on Base)

## Step 7: Verify on BaseScan

1. Go to [basescan.org](https://basescan.org)
2. Search for your contract address (from Remix deployment output)
3. Click **"Contract"** tab → **"Verify and Publish"**
4. Fill in:

```
Contract Address:     YOUR_CONTRACT_ADDRESS
Compiler:             Solidity (select exact version used)
EVM Version:          default
Optimization:         Yes (200 runs)
License:              MIT
```

5. Paste the full contract source code
6. Click **"Verify and Publish"**
7. Wait 10-30 seconds for verification

## Step 8: Update Agentbot Environment

After deployment, add the contract address to Vercel:

```bash
cd /Users/raveculture/agentbot

# Add to Vercel production env
vercel env add WRISTBAND_CONTRACT_ADDRESS production
# Enter your contract address: 0x...

# Redeploy to pick up new env var
vercel --yes --prod
```

## Step 9: Update Paymaster Allowlist

1. Go to [cdp.coinbase.com](https://cdp.coinbase.com) → **Paymaster** → **Configuration**
2. Select **Base Mainnet**
3. Under **Allowlist Contracts**, add:
   - Contract address: `0x...` (your deployed address)
   - Methods: `mintWristband`, `gaslessMint`, `batchMint`
4. Save

## Step 10: Test Mint

```bash
# Test paid mint (via wagmi)
# Connect wallet to agentbot.sh/wristband
# Click "Mint Wristband"
# Confirm transaction in MetaMask

# Test gasless mint (via Paymaster)
# Must have billing set up in CDP Portal
# Connect smart wallet → click "Mint" → no gas fee
```

## Troubleshooting

| Error | Fix |
|-------|-----|
| "Insufficient funds" | Get more Base ETH from bridge.base.org |
| "Max supply reached" | Contract deployed with MAX_SUPPLY=10000, shouldn't happen |
| "Invalid recipient" | Check the `to` address is valid (0x...) |
| Verification fails | Make sure compiler version matches exactly |
| Paymaster error | Add billing in CDP Portal → Billing |

## Contract Address Format

After deployment, your contract address will look like:
```
0x66519FCAee1Ed65bc9e0aCc25cCD900668D3eD49
```

Always verify on BaseScan before sharing.

## Gas Costs (Base Mainnet)

| Action | Estimated Gas |
|--------|---------------|
| Deploy contract | ~0.003 ETH (~$0.50) |
| mintWristband | ~0.001 ETH (~$0.15) |
| gaslessMint | Free (Paymaster sponsored) |
| batchMint (10) | ~0.005 ETH (~$0.80) |
| setMintPrice | ~0.0005 ETH (~$0.08) |
| withdraw | ~0.001 ETH (~$0.15) |

---

## Quick Reference

| Parameter | Value |
|-----------|-------|
| Network | Base Mainnet (Chain ID: 8453) |
| Compiler | Solidity 0.8.20 |
| Optimizer | Yes, 200 runs |
| License | MIT |
| Max Supply | 10,000 |
| Default Mint Price | 0.001 ETH |
| Base URI | `https://agentbot.sh/api/wristband/metadata/` |
| Explorer | `https://basescan.org` |
| RPC | `https://mainnet.base.org` |
