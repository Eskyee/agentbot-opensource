# Base / Coinbase L2

Base is Coinbase's Layer 2 blockchain. Agentbot is crypto-native and built on Base from day one.

## Integration points
- **Auth:** Base Account SDK (`@base-org/account`) + SIWE + NextAuth
- **Wallet connect:** `@base-org/account-ui` (must load with `dynamic({ ssr: false })`)
- **Basenames:** ENS-style names on Base — `GET /api/basename?address=0x...` + `useBasename` hook
- **$AGENTBOT token:** Token page exists in the app
- **Wallet address:** 0xd8fd0e1dce89beaab924ac68098ddb17613db56f

## OnchainKit
SDK for building onchain apps. Used for Identity, Wallet, Transaction, and Swap components. Always wrap with `OnchainKitProvider` at the app root.

## Why Base
Crypto-native operations, low fees, Coinbase ecosystem, wallet infrastructure out of the box.
