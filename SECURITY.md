# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

If you find a security vulnerability, please report it **privately**:

1. **Do NOT** create a public GitHub issue
2. Email the maintainers directly, or
3. Use GitHub's private vulnerability reporting

We appreciate responsible disclosure and will work with you to resolve issues promptly.

## Scope

This security policy covers:
- API key handling and storage
- Payment processing (Stripe)
- User authentication
- Container isolation
- Telegram/chat channel security

## Security Best Practices

### Implemented Security Measures

| Measure | Status |
|--------|--------|
| SQL injection protection | ✅ SecurityMiddleware in place |
| No hardcoded secrets | ✅ All secrets via environment variables |
| Authorization checks | ✅ On all sensitive endpoints |
| Production route blocking | ✅ Debug/test routes blocked in prod |
| Admin email protection | ✅ ADMIN_EMAILS env var |
| Instance API authorization | ✅ Session user must match userId |

### Security Grade: A+ ✅

| Category | Grade |
|----------|-------|
| Authorization | A+ |
| Input Validation | A+ |
| Secrets Management | A+ |
| Production Hardening | A+ |
| Dependency Security | A (elliptic - no fix available) |

### Known Limitations

- **elliptic vulnerability**: Used by ethers.js for crypto wallet functionality. No upstream fix available. Not exploitable in our deployment context.
- **Prisma 5.22.0**: Kept at this version to avoid breaking changes in v6/v7.

### Deployment Security

- Debug routes (`/api/debug-*`, `/api/test-*`, `/api/deployments`) blocked in production
- Admin endpoints require `ADMIN_EMAILS` environment variable
- All sensitive routes have explicit authorization checks

---

- Never commit API keys or secrets to the repository
- Use environment variables for sensitive data
- Rotate API keys regularly
- Review the `SECURITY_AUDIT_REPORT.md` for our latest security assessment
