import crypto from 'crypto';

// auth.ts reads HMAC_SECRET at module load, so set it before requiring the
// module. We require lazily inside beforeAll to guarantee ordering.
const HMAC_SECRET = 'test-hmac-secret-value';

type Authenticate = (req: any, res: any, next: () => void) => Promise<void> | void;
let authenticate: Authenticate;

// Mirror the frontend signedFetch user-context signing exactly. If this and
// auth.ts ever drift, these tests fail — that's the whole point.
function signUserContext(method: string, fullPath: string, id: string, email: string, role: string, ts: string) {
  const payload = `${method.toUpperCase()}:${fullPath}:${id}:${email}:${role}:${ts}`;
  return crypto.createHmac('sha256', HMAC_SECRET).update(payload).digest('hex');
}

function makeRes() {
  const res: any = { statusCode: 0, body: undefined };
  res.status = (code: number) => { res.statusCode = code; return res; };
  res.json = (payload: unknown) => { res.body = payload; return res; };
  return res;
}

// Express rewrites req.path to the router-relative path inside a mounted
// router; req.originalUrl keeps the full path the client actually signed.
function makeReq(opts: { method: string; originalUrl: string; path?: string; headers: Record<string, string> }) {
  return {
    method: opts.method,
    originalUrl: opts.originalUrl,
    path: opts.path ?? '/',
    url: opts.path ?? '/',
    headers: opts.headers,
  } as any;
}

async function run(req: any) {
  const res = makeRes();
  let nextCalled = false;
  await authenticate(req, res, () => { nextCalled = true; });
  return { res, nextCalled, req };
}

describe('auth.authenticate — HMAC user-context verification', () => {
  beforeAll(() => {
    process.env.HMAC_SECRET = HMAC_SECRET;
    authenticate = require('./auth').authenticate;
  });

  it('accepts a signature computed over the FULL request path', async () => {
    const ts = Date.now().toString();
    const fullPath = '/api/provision';
    const sig = signUserContext('POST', fullPath, 'u1', 'a@b.com', 'user', ts);

    const { nextCalled, req } = await run(makeReq({
      method: 'POST',
      originalUrl: fullPath,
      path: '/', // router-relative — what req.path would be inside the router
      headers: {
        'x-user-id': 'u1',
        'x-user-email': 'a@b.com',
        'x-user-role': 'user',
        'x-user-signature': sig,
        'x-user-signature-timestamp': ts,
      },
    }));

    expect(nextCalled).toBe(true);
    expect(req.userId).toBe('u1');
    expect(req.userEmail).toBe('a@b.com');
    expect(req.userRole).toBe('user');
  });

  it('rejects a signature computed over the stripped router path (/)', async () => {
    const ts = Date.now().toString();
    // Signing over '/' (the stripped path) must NOT verify — the contract is
    // the full path. This guards against regressing back to req.path.
    const sig = signUserContext('POST', '/', 'u1', 'a@b.com', 'user', ts);

    const { res, nextCalled } = await run(makeReq({
      method: 'POST',
      originalUrl: '/api/provision',
      path: '/',
      headers: {
        'x-user-id': 'u1',
        'x-user-email': 'a@b.com',
        'x-user-role': 'user',
        'x-user-signature': sig,
        'x-user-signature-timestamp': ts,
      },
    }));

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(401);
    expect(res.body.code).toBe('INVALID_SIGNATURE');
  });

  it('ignores the query string when verifying the path', async () => {
    const ts = Date.now().toString();
    const sig = signUserContext('GET', '/api/metrics/u1/summary', 'u1', 'a@b.com', 'user', ts);

    const { nextCalled } = await run(makeReq({
      method: 'GET',
      originalUrl: '/api/metrics/u1/summary?window=7d',
      path: '/u1/summary',
      headers: {
        'x-user-id': 'u1',
        'x-user-email': 'a@b.com',
        'x-user-role': 'user',
        'x-user-signature': sig,
        'x-user-signature-timestamp': ts,
      },
    }));

    expect(nextCalled).toBe(true);
  });

  it('rejects when the signature header is missing', async () => {
    const { res, nextCalled } = await run(makeReq({
      method: 'POST',
      originalUrl: '/api/provision',
      headers: { 'x-user-id': 'u1', 'x-user-email': 'a@b.com' },
    }));

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(401);
    expect(res.body.code).toBe('SIGNATURE_REQUIRED');
  });

  it('rejects an expired timestamp', async () => {
    const ts = (Date.now() - 6 * 60 * 1000).toString(); // 6 min ago
    const sig = signUserContext('POST', '/api/provision', 'u1', 'a@b.com', 'user', ts);

    const { res, nextCalled } = await run(makeReq({
      method: 'POST',
      originalUrl: '/api/provision',
      headers: {
        'x-user-id': 'u1',
        'x-user-email': 'a@b.com',
        'x-user-role': 'user',
        'x-user-signature': sig,
        'x-user-signature-timestamp': ts,
      },
    }));

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(401);
    expect(res.body.code).toBe('SIGNATURE_EXPIRED');
  });
});
