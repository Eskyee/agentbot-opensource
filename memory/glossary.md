# Glossary — Decoder Ring

## Acronyms & Terms
| Term | Meaning |
|------|---------|
| **agentbot** | The platform / product name |
| **OpenClaw** | AI agent runtime that runs inside Docker containers |
| **underground** | The culture/music vertical of agentbot (src/underground.ts) |
| **bus** | Agent-to-agent message bus (AgentBusService) |
| **CDP** | Coinbase Developer Platform (wallet infrastructure) |
| **USDC** | USD Coin — stablecoin used for agent payments |
| **CGN** | Carrier-Grade NAT (100.64.0.0/10 — blocked in SSRF list) |
| **ULA** | Unique Local Address (IPv6 fc00::/7 — blocked in SSRF list) |
| **MED-06** | Security audit finding: exec() → spawn() shell injection fix |
| **CRIT-01** | Security audit finding: outer Bearer auth gate |
| **HIGH-04** | Security audit finding: SHA-256 API key hashing |
| **timingSafeEqual** | Node.js crypto function for constant-time string comparison |
| **fail-closed** | Security pattern: reject all requests when secret is not configured |
| **Home mode** | agentbot installation mode: self-hosted OpenClaw |
| **Link mode** | agentbot installation mode: connect existing OpenClaw instance |
| **provision** | Creating a new Docker container + Caddy route for a user |
| **heartbeat** | Periodic ping from agent to update last_seen timestamp |
| **dumb-init** | Minimal init system used as PID 1 in Docker containers |

## Plans
| Shorthand | Full Name | Price |
|-----------|-----------|-------|
| solo | Solo | £29/mo |
| collective | Collective | £69/mo |
| label | Label | £149/mo |
| network | Network | £499/mo |
