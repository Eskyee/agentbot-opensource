# Liquid Wallet Kit (LWK) on Railway

## What is LWK?

The Liquid Wallet Kit is Blockstream's toolkit for building Bitcoin/Liquid wallets with:
- Multi-signature support (2-of-2, 2-of-3, etc.)
- Blockstream Jade hardware wallet support
- Software signers for automated custody
- Asset issuance (Liquid assets, tokens)
- No need to run your own node (uses Blockstream Electrum)

## Installation on Railway

The LWK CLI can be installed via:

```bash
cargo install lwk_cli
```

Or built from source:
```bash
git clone https://github.com/Blockstream/lwk.git
cd lwk
cargo build --release
```

## Quick Commands

### Signer Management
```bash
lwk_cli signer generate                    # Create software signer
lwk_cli signer load-software -s NAME --mnemonic "your words"  # Load signer
lwk_cli signer list                         # List loaded signers
lwk_cli signer xpub -s NAME --kind bip84   # Get xpub for multi-sig
```

### Wallet Operations
```bash
lwk_cli wallet multisig-desc --threshold 2 --keyorigin-xpub "xpub..."  # Create multi-sig
lwk_cli wallet load -d "descriptor" -w WALLET  # Load wallet
lwk_cli wallet address -w WALLET              # Get address
lwk_cli wallet balance -w WALLET              # Check balance
lwk_cli wallet send -w WALLET --recipient "addr:amount:asset"  # Send
```

### Asset Management
```bash
lwk_cli wallet issue -w WALLET --satoshi-asset 1000000  # Issue asset
lwk_cli wallet reissue -w WALLET --asset ASSET --satoshi-asset 500000  # Reissue
lwk_cli wallet burn -w WALLET --asset ASSET --satoshi-asset 100000  # Burn
```

## Environment Variables

For Railway deployment:
- `ELECTRUM_URL` - Optional custom Electrum server (default: Blockstream's)
- `LOG_LEVEL` - Debug, info, warn, error

## Agentbot Integration

To integrate with agentbot:
1. Deploy LWK as a service on Railway
2. Use RPC to communicate with agentbot agents
3. Agents can trigger wallet operations (send, receive, issue assets)

## Security Notes

- Multi-sig requires coordination between signers
- Hardware wallet (Jade) provides strongest security
- Keep mnemonics secure - they control the funds
- PSET workflow ensures no single party can move funds alone