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

- Never commit API keys or secrets to the repository
- Use environment variables for sensitive data
- Rotate API keys regularly
- Review the `SECURITY_AUDIT_REPORT.md` for our latest security assessment
