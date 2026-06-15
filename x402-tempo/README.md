# x402-Tempo Integration

## Overview

HTTP gateway service for Agentbot agents to access x402-Tempo payment services through borg-0's proven x402-node, with colony-based fitness scoring and dynamic pricing.

## Architecture

```
Agentbot Agents → x402-Gateway → x402-Node (borg-0) → Tempo Network
       ↓               ↓               ↓
   Colony Join    Fitness Score    Payment
       ↓               ↓               ↓
   borg-0's        Dynamic       pathUSD
   Colony          Pricing       Transactions
```

## Key Decisions (2026-03-22)

1. **Gateway Deployment**: Separate service (not sidecar)
2. **Soul Integration**: HTTP to x402-node (not FFI/NAPI)
3. **Colony Fitness**: Agentbot agents feed into borg-0's colony
4. **Pricing**: Dynamic by fitness score

## Services

### x402-Gateway
- **Location**: `/x402-tempo/x402-gateway/`
- **Purpose**: HTTP gateway for Agentbot ↔ x402-Tempo
- **Status**: Skeleton complete, ready for implementation

### Integration Points
- **x402-Node**: borg-0's proven HTTP service
- **Colony**: borg-0's established colony
- **Tempo**: pathUSD transactions with fee sponsorship
- **Agentbot**: Multi-tenant agent platform

## Environment

- **Tempo**: 1,000,000 pathUSD funded
- **Base**: 0.434 USDC (top up needed for Base gas)
- **Colony**: Join borg-0's established colony
- **Pricing**: Dynamic tiers based on fitness

## Next Steps

1. **Week 1**: Gateway service implementation
2. **Week 2**: Colony integration and fitness scoring
3. **Week 3**: Agentbot agent provisioning

## Links

- [PROGRESS.md](./PROGRESS.md) - Implementation progress
- [x402-Gateway](./x402-gateway/) - Gateway service
- [Tempo Network](https://rpc.moderato.tempo.xyz) - Transaction network
- [borg-0 Colony](https://github.com/AllYourBase/borg) - Reference colony
