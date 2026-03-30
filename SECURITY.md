# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Agentbot, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, email: **security@yourdomain.com**

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will acknowledge receipt within 48 hours and aim to provide a fix within 7 days for critical issues.

## Security Measures

- All API endpoints require Bearer token authentication
- Docker containers run with resource limits (memory, CPU)
- Secrets are never logged or returned in API responses
- Timing-safe comparison for API key verification
- Rate limiting on all endpoints
- Input validation and sanitization

## Supported Versions

| Version | Supported |
|---------|-----------|
| main    | ✅        |
| older   | ❌        |
