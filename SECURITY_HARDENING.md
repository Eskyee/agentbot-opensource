# 🛡️ AgentBot Security Hardening - Complete Guide

**Date:** 2026-03-07  
**Status:** ✅ **PRODUCTION HARDENED**

---

## Security Protections Implemented

### 1. **Rate Limiting** ✅
**Protection Against:** DDoS, brute force, resource exhaustion

```
- 60 requests/minute per IP
- 1000 requests/hour per IP
- 5 auth attempts/15 minutes per IP
- Adaptive blocking after threshold
```

**Location:** `app/lib/security-middleware.ts`

**How it works:**
- Tracks requests by IP (SHA256 hashed)
- Automatic rate limit headers (429 status)
- Retry-After response header
- Exponential backoff for clients

---

### 2. **SQL Injection Prevention** ✅
**Protection Against:** SQL injection, database attacks

```
Pattern Detection:
- UNION/SELECT/INSERT/DELETE/DROP keywords
- SQL comments (--,  /*, */)
- String quote escaping
- OR 1=1 patterns
- Parameterized queries via Prisma ORM
```

**Location:** `app/lib/security-middleware.ts`

**Coverage:**
- Query parameters ✅
- JSON body payloads ✅
- Headers ✅
- URL paths ✅

---

### 3. **XSS Prevention** ✅
**Protection Against:** Cross-site scripting, malicious scripts

```
Pattern Detection:
- <script> tags
- javascript: protocol
- Event handlers (onclick, onload, etc)
- <iframe>, <object>, <embed> tags
- HTML encoding in responses
```

**Location:** `app/lib/security-middleware.ts`

**Enforcement:**
- CSP headers set ✅
- X-XSS-Protection header ✅
- X-Frame-Options: DENY ✅
- Content-Type enforcement ✅

---

### 4. **Bot Detection** ✅
**Protection Against:** Automated attacks, scrapers, crawlers

```
Suspicious User Agents Detected:
- bot, crawler, spider, scraper
- curl, wget (CLI tools)
- python, java, perl, php, ruby, go (Programming languages)
- SQL keywords in user agent
```

**Location:** `app/lib/security-middleware.ts`

**Action:** Logged and monitored, can auto-block

---

### 5. **Request Validation** ✅
**Protection Against:** Oversized payloads, malformed requests

```
Limits:
- Max request body: 10MB
- Max query string: 2048 characters
- Max JSON payload: 1MB
- Request timeout: 30 seconds
- Content-Type validation: JSON only
```

**Location:** `app/lib/security-middleware.ts`

---

### 6. **Authentication Hardening** ✅
**Protection Against:** Unauthorized access, credential stuffing

```
Features:
- NextAuth.js with JWT tokens
- Session validation on every request
- Secure cookie flags (HttpOnly, Secure, SameSite)
- CSRF token validation
- Failed auth attempt tracking
```

**Auth Cookies (Production):**
- `__Secure-next-auth.session-token` - HttpOnly, Secure, SameSite=Lax
- `__Host-next-auth.csrf-token` - HttpOnly, Secure, SameSite=Lax
- Max age: 30 days

**Location:** `app/api/auth/[...nextauth]/route.ts`

---

### 7. **Security Headers** ✅
**Protection Against:** MIME sniffing, clickjacking, data exfiltration

```
Headers Added:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security: max-age=31536000
- Content-Security-Policy: Multiple directives
- Referrer-Policy: strict-origin-when-cross-origin
```

**Location:** Every response in `security-middleware.ts`

---

### 8. **IP Blocking & Reputation** ✅
**Protection Against:** Repeat attackers, known bad IPs

```
Auto-Blocking Conditions:
- 3+ suspicious activities from single IP
- 1-hour block duration
- Blocks: injections, rate limits, bot activity
- Whitelist support (future)
```

**Location:** `app/lib/security-middleware.ts`

---

### 9. **Input Sanitization** ✅
**Protection Against:** Injection attacks, malformed data

```
Validation:
- SQL injection detection in all inputs
- XSS payload detection in all inputs
- Email format validation
- API key format validation
- File upload validation (future)
```

**Location:** All secure route handlers

---

### 10. **Security Monitoring & Logging** ✅
**Protection Against:** Undetected attacks, incident response delays

```
Events Logged:
- Rate limit violations
- Bot detection
- Injection attempts
- Auth failures
- Suspicious activities
- Blocked IPs

Log Format:
- JSON for easy parsing
- Timestamp (ISO 8601)
- IP (hashed for privacy)
- User agent
- Request path
- Details & context
```

**Locations:** 
- `app/lib/security-monitor.ts` (in-memory + file)
- `/api/admin/security` (dashboard)

---

### 11. **API Security Wrapper** ✅
**Protection Against:** Inconsistent security application

```
Preset Combinations:

SecureRoute.public(handler)
  - Rate limiting
  - Request validation
  - Injection prevention

SecureRoute.protected(handler)
  - All above + Auth required
  - Failed auth tracking

SecureRoute.mutation(handler)
  - All above + POST only
  - For state-changing operations

SecureRoute.json(handler)
  - All above + JSON validation
  - For JSON APIs

SecureRoute.sensitive(handler)
  - Maximum security
  - Auth + POST + JSON + Injection
  - For critical operations
```

**Location:** `app/lib/secure-route.ts`

---

## Attack Vectors Covered

| Attack Type | Protection | Status |
|------------|-----------|--------|
| **DDoS** | Rate limiting, request throttling | ✅ |
| **SQL Injection** | Pattern detection, parameterized queries | ✅ |
| **XSS** | CSP headers, payload detection | ✅ |
| **CSRF** | CSRF tokens, SameSite cookies | ✅ |
| **Brute Force** | Auth attempt limiting, IP tracking | ✅ |
| **Bot Attacks** | User agent detection, behavior analysis | ✅ |
| **MITM** | HTTPS only, HSTS headers | ✅ |
| **Clickjacking** | X-Frame-Options: DENY | ✅ |
| **MIME Sniffing** | X-Content-Type-Options: nosniff | ✅ |
| **Oversized Payloads** | Request size limiting | ✅ |
| **Slow Attacks** | Request timeout enforcement | ✅ |
| **Header Injection** | Validation, sanitization | ✅ |
| **Open Redirect** | URL validation | ⏳ (Ready for implementation) |
| **XXE** | Not applicable (JSON only) | ✅ |
| **Credential Stuffing** | Rate limiting + 2FA | ✅ (Rate limiting) |

---

## Configuration

### Environment Variables

```bash
# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_PER_HOUR=1000
AUTH_ATTEMPTS_LIMIT=5

# Request Validation
MAX_REQUEST_SIZE_MB=10
MAX_BODY_LENGTH_MB=1
REQUEST_TIMEOUT_MS=30000

# Security Features
ENABLE_DDOS_PROTECTION=true
ENABLE_BOT_DETECTION=true
ENABLE_IP_BLOCKING=true

# Admin Emails (for security dashboard)
ADMIN_EMAILS=admin@agentbot.raveculture.xyz

# Logging
LOG_DIR=/var/log/agentbot
SECURITY_LOG_ENABLED=true
```

**Location:** `.env.security`

---

## Usage Examples

### Protecting a Route (Auth + Validation)

```typescript
import { SecureRoute } from '@/app/lib/secure-route'

async function POST(req: NextRequest) {
  // Your business logic
  return NextResponse.json({ success: true })
}

export const POST_secure = SecureRoute.sensitive(POST)
export { POST_secure as POST }
```

### Manual Security Checks

```typescript
import { SecurityMiddleware } from '@/app/lib/security-middleware'

const ip = SecurityMiddleware.getClientIP(req)

// Check for SQL injection
if (SecurityMiddleware.containsSQLInjection(userInput)) {
  // Block request
}

// Check rate limit
if (SecurityMiddleware.isRateLimited(ip)) {
  // Return 429 Too Many Requests
}

// Record suspicious activity
SecurityMiddleware.logSuspiciousActivity(ip, 'ATTACK_TYPE', { details })
```

### Monitoring Security

```typescript
import { securityMonitor } from '@/app/lib/security-monitor'

// Get all metrics
const metrics = securityMonitor.exportMetrics()

// Get alerts by type
const injections = securityMonitor.getAlertsByType('INJECTION')
const botAttempts = securityMonitor.getAlertsByType('BOT_DETECTED')

// Get alerts from IP
const ipAlerts = securityMonitor.getAlertsByIP('192.168.1.1')
```

---

## Monitoring Dashboard

**Endpoint:** `GET /api/admin/security`  
**Auth:** Admin only  
**Returns:**
```json
{
  "status": "ok",
  "security_metrics": {
    "metrics": {
      "rate_limits": 42,
      "bot_detections": 12,
      "injection_attempts": 3,
      "auth_failures": 8,
      "blocked_ips": 2
    },
    "recentAlerts": [...],
    "summary": {
      "totalEvents": 67,
      "rateLimit": 42,
      "botDetections": 12,
      "injectionAttempts": 3,
      "authFailures": 8,
      "blockedIPs": 2
    }
  }
}
```

---

## Logging

### Security Log File

**Location:** `/var/log/agentbot/security.log`  
**Format:** JSON (one per line)

**Example:**
```json
{"timestamp":"2026-03-07T12:30:45.123Z","type":"INJECTION","ip":"a1b2c3d4...","path":"/api/users","details":{"field":"email","pattern":"UNION SELECT"}}
{"timestamp":"2026-03-07T12:31:02.456Z","type":"RATE_LIMIT","ip":"e5f6g7h8...","path":"/api/auth/signin","details":{"reason":"Too many requests"}}
{"timestamp":"2026-03-07T12:32:15.789Z","type":"BOT_DETECTED","ip":"i9j0k1l2...","userAgent":"curl/7.64.1","path":"/api/agents"}
```

---

## Deployment Checklist

- [x] Security middleware installed
- [x] Rate limiting configured
- [x] Injection detection active
- [x] Bot detection active
- [x] Security headers set
- [x] Auth hardening enabled
- [x] Monitoring enabled
- [x] Admin dashboard ready
- [x] Logging to disk
- [x] Environment variables configured

---

## Future Enhancements

- [ ] 2FA (Two-factor authentication)
- [ ] Web Application Firewall (WAF)
- [ ] Advanced bot detection (ML-based)
- [ ] Geo-blocking by IP location
- [ ] Webhook alerts for critical events
- [ ] Integration with Sentry/DataDog
- [ ] CAPTCHA for suspicious traffic
- [ ] Request signing with API keys
- [ ] Encryption at rest
- [ ] PII detection and masking

---

## Security Best Practices

1. **Keep Dependencies Updated**
   ```bash
   npm audit
   npm audit fix
   npm update
   ```

2. **Rotate Secrets Regularly**
   - API keys every 90 days
   - Database credentials quarterly
   - Session tokens on login

3. **Monitor Logs Daily**
   - Check for injection attempts
   - Review rate limit violations
   - Monitor failed auth attempts

4. **Test Security**
   ```bash
   # SQL injection test
   curl 'https://api.example.com/users?id=1 OR 1=1'
   
   # XSS test
   curl 'https://api.example.com/search?q=<script>alert(1)</script>'
   
   # Rate limit test
   for i in {1..100}; do curl https://api.example.com/health; done
   ```

5. **Incident Response**
   - Immediately block malicious IPs
   - Review recent logs
   - Check for data exfiltration
   - Notify affected users
   - Post-incident review

---

## Support

For security issues, email: `security@agentbot.raveculture.xyz`

Do NOT open public issues for security vulnerabilities.

---

**Status:** 🛡️ **HARDENED FOR PRODUCTION**

All protection layers active and monitored.
