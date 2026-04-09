# Liquid Wallet Kit (LWK) on Railway

## What is LWK?

The Liquid Wallet Kit is Blockstream's toolkit for building Bitcoin/Liquid wallets with:
- Multi-signature support (2-of-2, 2-of-3, etc.)
- Blockstream Jade hardware wallet support
- Software signers for automated custody
- Asset issuance (Liquid assets, tokens)
- No need to run your own node (uses Blockstream Electrum)

**GitHub:** https://github.com/Blockstream/lwk (105 ⭐, 45 forks)
**Docs:** https://blockstream.github.io/lwk/book
**Official Liquid node guide:** https://help.blockstream.com/hc/en-us/articles/900002026026-Set-up-a-Liquid-node

## Docker on Railway

Use the official Blockstream LWK image:

```dockerfile
FROM blockstream/lwk:latest

ENV ELECTRUM_URL=https://liquid.blockstream.info

CMD ["lwk_cli", "--help"]
```

Or deploy from GitHub:
1. Create new service on Railway
2. Connect to https://github.com/Blockstream/lwk
3. Dockerfile: use `blockstream/lwk:latest`

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

## When You Need a Full Liquid Node

LWK does not require you to run a full Liquid node for normal wallet operations. It can use Blockstream Electrum.

If you want your own validating Liquid infrastructure instead of the lightweight LWK path, use Blockstream's official guide:

- https://help.blockstream.com/hc/en-us/articles/900002026026-Set-up-a-Liquid-node

That guide walks through installing Elements Core, choosing a data directory, syncing the Liquid chain, and understanding optional Bitcoin-node-backed peg-in validation.

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
