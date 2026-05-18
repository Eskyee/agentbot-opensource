# Agentbot Security White Paper

**Version:** 1.0  
**Date:** April 9, 2026  
**Classification:** Public

---

## Executive Summary

Agentbot is an open-source, multi-tenant AI agent platform. This document details our security architecture, data handling practices, and compliance posture.

## Architecture Security

### Multi-Tenant Isolation
- Each user gets a Docker-isolated agent instance
- No shared memory between tenants
- Per-user database schemas with row-level security
- Network isolation between agent containers

### Authentication
- **Primary:** NextAuth.js with JWT sessions
- **Passkeys:** WebAuthn passwordless authentication
- **Wallet:** Base wallet signature verification (SIWE)
- **API:** Bearer token with rate limiting

### Data Protection
- **Encryption at rest:** AES-256-GCM for sensitive data
- **Encryption in transit:** TLS 1.3 for all connections
- **Key management:** Per-user encryption keys
- **Token encryption:** AES-256-GCM for stored API keys

### Infrastructure
- **Hosting:** Railway (SOC 2 compliant)
- **Database:** Neon Postgres (encrypted, automated backups)
- **CDN:** Vercel (Edge Network, DDoS protection)
- **Monitoring:** Health checks every 15 seconds

## AI Model Security

### BYOK (Bring Your Own Key)
- Users provide their own AI API keys
- Keys encrypted at rest, never logged
- Zero markup on token usage
- Direct provider communication (no proxy interception)

### Model Isolation
- Agent instances don't share model context
- No cross-tenant data leakage
- Conversation history isolated per user

## Onchain Security

### Payment Protocol (x402)
- Micropayments settled on Base blockchain
- No custody of user funds
- Smart contract audited (Ethereum Foundation standard)
- Rate limits and payment caps per agent

### Wallet Security
- Non-custodial — users control their keys
- CDP wallet integration for platform operations
- No private keys stored on servers

## Operational Security

### Access Control
- Role-based access (Owner, Editor, Viewer)
- Railway project protection (staging-first policy)
- Git commit signing for production changes

### Monitoring
- Real-time health checks (6 services)
- Night Watch automated monitoring (every 4 hours)
- Failed auth attempt logging
- Rate limiting on all endpoints

### Incident Response
- Automated alerts for service degradation
- Rollback procedures documented
- Volume backups for persistent data

## Compliance

### Data Privacy
- GDPR-compliant data handling
- User data deletion on request
- No data selling or sharing
- Transparent data collection

### Open Source
- MIT license — fully auditable
- Community security reviews welcome
- Responsible disclosure program

## Contact

For security concerns: security@agentbot.sh  
For responsible disclosure: Use GitHub Security Advisories

---

*This document is updated quarterly. Last review: April 9, 2026.*
