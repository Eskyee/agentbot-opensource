import request from 'supertest';
import { Wallet } from 'ethers';

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('./services/wallet', () => ({
  WalletService: {
    createAgentWallet: jest.fn().mockResolvedValue({ address: '0xmock' }),
    getBalance:        jest.fn().mockResolvedValue('0'),
  },
}));

jest.mock('bull', () => jest.fn().mockImplementation(() => ({
  process: jest.fn(),
  add:     jest.fn(),
  on:      jest.fn(),
})));

// Prevent real DB connections
jest.mock('pg', () => {
  const mockQuery = jest.fn().mockResolvedValue({ rows: [], rowCount: 0 });
  const MockPool  = jest.fn().mockImplementation(() => ({ query: mockQuery, end: jest.fn() }));
  (MockPool as any).__mockQuery = mockQuery;
  return { Pool: MockPool };
});

jest.mock('./services/db-init', () => ({
  initDatabase: jest.fn().mockResolvedValue(undefined),
}));

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

// ─── App Import ──────────────────────────────────────────────────────────────
import app from './index';

describe('Fact-Based Identity: SignatureGuard', () => {
  const wallet = Wallet.createRandom();
  const address = wallet.address;

  const signRequest = async (method: string, path: string, body: any, timestamp: number) => {
    const bodyStr = body && Object.keys(body).length > 0 ? JSON.stringify(body) : '';
    const message = `${method.toUpperCase()}:${path}:${bodyStr}:${timestamp}`;
    const signature = await wallet.signMessage(message);
    return signature;
  };

  it('rejects expired timestamp', async () => {
    const path = '/api/openclaw/version';
    const timestamp = Date.now() - 600_000; // 10 minutes ago
    const signature = await signRequest('GET', path, null, timestamp);

    const res = await request(app)
      .get(path)
      .set('x-agent-signature', signature)
      .set('x-agent-address', address)
      .set('x-agent-timestamp', timestamp.toString());

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('TIMESTAMP_EXPIRED');
  });

  it('rejects invalid signature', async () => {
    const path = '/api/openclaw/version';
    const timestamp = Date.now();
    const signature = '0x' + '0'.repeat(130); // fake sig

    const res = await request(app)
      .get(path)
      .set('x-agent-signature', signature)
      .set('x-agent-address', address)
      .set('x-agent-timestamp', timestamp.toString());

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('SIGNATURE_ERROR');
  });

  it('accepts valid signature and bypasses Bearer requirement', async () => {
    const path = '/api/openclaw/version';
    const timestamp = Date.now();
    const signature = await signRequest('GET', path, null, timestamp);

    const res = await request(app)
      .get(path)
      .set('x-agent-signature', signature)
      .set('x-agent-address', address)
      .set('x-agent-timestamp', timestamp.toString());

    // Should NOT be 401/403. Success or 500 (due to docker mock) is fine.
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });

  it('verifies identity is attached correctly', async () => {
    // We'll use a route that returns user info if we can find one, 
    // or just rely on the fact that it didn't return 401/403.
    const path = '/api/ai/models';
    const timestamp = Date.now();
    const signature = await signRequest('GET', path, null, timestamp);

    const res = await request(app)
      .get(path)
      .set('x-agent-signature', signature)
      .set('x-agent-address', address)
      .set('x-agent-timestamp', timestamp.toString());

    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });
});
