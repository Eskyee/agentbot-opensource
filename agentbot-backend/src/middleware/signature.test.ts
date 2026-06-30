import { Wallet } from 'ethers';
import { signatureGuard } from './signature';
import { canonicalJsonStringify } from '../utils/canonical-json';

// Focused unit test for signatureGuard's allowlist gating. Intentionally does
// NOT import the full Express app, so it runs independently of the app's
// (ESM-heavy) dependency graph.

type MockReq = {
  headers: Record<string, string>;
  method: string;
  path: string;
  body: unknown;
  userId?: string;
  userRole?: string;
};

function makeRes() {
  const res: any = { statusCode: 0, body: undefined };
  res.status = (code: number) => { res.statusCode = code; return res; };
  res.json = (payload: unknown) => { res.body = payload; return res; };
  return res;
}

async function signFor(wallet: Wallet, method: string, path: string, body: unknown, timestamp: number) {
  const hasBody = body && typeof body === 'object' && Object.keys(body as object).length > 0;
  const bodyStr = hasBody ? canonicalJsonStringify(body) : '';
  const message = `${method.toUpperCase()}:${path}:${bodyStr}:${timestamp}`;
  return wallet.signMessage(message);
}

async function runGuard(req: MockReq) {
  const res = makeRes();
  let nextCalled = false;
  await signatureGuard(req as any, res as any, () => { nextCalled = true; });
  return { res, nextCalled, req };
}

describe('signatureGuard — allowlist gating', () => {
  const wallet = Wallet.createRandom();

  afterEach(() => { delete process.env.AUTHORIZED_SIGNER_ADDRESSES; });

  it('does NOT promote a valid signature when the signer is not allowlisted', async () => {
    delete process.env.AUTHORIZED_SIGNER_ADDRESSES; // default-deny
    const ts = Date.now();
    const sig = await signFor(wallet, 'GET', '/api/openclaw/version', null, ts);

    const { nextCalled, req } = await runGuard({
      headers: {
        'x-agent-signature': sig,
        'x-agent-address': wallet.address,
        'x-agent-timestamp': String(ts),
      },
      method: 'GET',
      path: '/api/openclaw/version',
      body: {},
    });

    expect(nextCalled).toBe(true);          // falls through to the Bearer gate
    expect(req.userRole).toBeUndefined();   // NOT promoted to agent
    expect(req.userId).toBeUndefined();
  });

  it('promotes a valid signature when the signer IS allowlisted', async () => {
    process.env.AUTHORIZED_SIGNER_ADDRESSES = wallet.address;
    const ts = Date.now();
    const sig = await signFor(wallet, 'GET', '/api/openclaw/version', null, ts);

    const { nextCalled, req } = await runGuard({
      headers: {
        'x-agent-signature': sig,
        'x-agent-address': wallet.address,
        'x-agent-timestamp': String(ts),
      },
      method: 'GET',
      path: '/api/openclaw/version',
      body: {},
    });

    expect(nextCalled).toBe(true);
    expect(req.userRole).toBe('agent');
    expect(req.userId).toBe(wallet.address.toLowerCase());
  });

  it('rejects an expired timestamp regardless of allowlist', async () => {
    process.env.AUTHORIZED_SIGNER_ADDRESSES = wallet.address;
    const ts = Date.now() - 600_000;
    const sig = await signFor(wallet, 'GET', '/api/openclaw/version', null, ts);

    const { res, nextCalled } = await runGuard({
      headers: {
        'x-agent-signature': sig,
        'x-agent-address': wallet.address,
        'x-agent-timestamp': String(ts),
      },
      method: 'GET',
      path: '/api/openclaw/version',
      body: {},
    });

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(401);
    expect(res.body.code).toBe('TIMESTAMP_EXPIRED');
  });

  it('skips the guard entirely when no signature headers are present', async () => {
    const { res, nextCalled, req } = await runGuard({
      headers: {},
      method: 'GET',
      path: '/api/openclaw/version',
      body: {},
    });

    expect(nextCalled).toBe(true);
    expect(res.statusCode).toBe(0);
    expect(req.userRole).toBeUndefined();
  });
});
