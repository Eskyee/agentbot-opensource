# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please send an email to the maintainers. All security vulnerabilities will be promptly addressed.

Please include the following:
- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Any suggested fixes (optional)

## Security Best Practices

When deploying Agentbot:

1. **Never commit API keys** - Use environment variables
2. **Restrict database access** - Use strong passwords and limit network access
3. **Enable HTTPS** - Always use TLS in production
4. **Monitor access logs** - Watch for unusual activity
5. **Keep dependencies updated** - Regularly update npm packages

## Agent Sandbox

Each agent runs in an isolated Docker container with:
- No persistent network access
- Limited file system permissions
- Resource limits (CPU/memory)
- No access to host system

## AI Provider Keys

Users provide their own AI API keys. Agentbot does not store or have access to these keys beyond the agent runtime.
