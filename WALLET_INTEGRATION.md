# Crypto Wallet Integration

## Features Added

### Agent Wallets
- Each user can create a crypto wallet for their agent
- Powered by Coinbase Developer Platform (CDP) SDK
- Supports Base Sepolia testnet and Base mainnet
- Secure wallet management with MPC technology

### Capabilities
- **Create Wallet**: One-click wallet creation for agents
- **Send/Receive**: Transfer crypto between wallets
- **Balance Tracking**: Real-time balance display
- **Gasless Transfers**: Send USDC without holding ETH for gas
- **Trading**: Swap between assets (ETH ↔ USDC)

## Setup

### 1. Get CDP API Keys

1. Go to [CDP Portal](https://portal.cdp.coinbase.com/)
2. Create a new API key
3. Download the JSON file with your credentials

### 2. Add Environment Variables

Add to `.env.local`:

```bash
CDP_API_KEY_NAME="your-api-key-name"
CDP_API_KEY_PRIVATE_KEY="-----BEGIN EC PRIVATE KEY-----\n...\n-----END EC PRIVATE KEY-----"
```

Or use the JSON file path:
```bash
CDP_API_KEY_FILE="/path/to/cdp_api_key.json"
```

### 3. Deploy

The wallet feature will appear in the dashboard once CDP keys are configured.

## Usage

### For Users
1. Go to Dashboard
2. Find "Agent Wallet" card
3. Click "Create Wallet"
4. Your agent now has a crypto wallet!

### For Agents
Agents can:
- Accept payments from users
- Send crypto autonomously
- Trade assets based on commands
- Monitor blockchain events

## Security

- Private keys never exposed to frontend
- Wallet seeds encrypted with CDP API key
- MPC technology for key management
- Server-side only operations

## Next Steps

- [ ] Add wallet verification badge
- [ ] Implement send/receive UI
- [ ] Add transaction history
- [ ] Enable trading interface
- [ ] Webhook integration for real-time updates
- [ ] Multi-chain support (Ethereum, Solana)

## Documentation

- [CDP SDK Docs](https://docs.cdp.coinbase.com/sdks)
- [Wallet API](https://docs.cdp.coinbase.com/wallet-api/docs/welcome)
- [OnchainKit](https://onchainkit.xyz/)
