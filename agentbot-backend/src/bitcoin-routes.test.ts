import express from 'express';
import request from 'supertest';

jest.mock('pg', () => {
  const mockQuery = jest.fn();
  const MockPool = jest.fn().mockImplementation(() => ({ query: mockQuery }));
  (MockPool as any).__mockQuery = mockQuery;
  return { Pool: MockPool };
});

jest.mock('./services/wallet', () => ({
  WalletService: {
    createAgentWallet: jest.fn(),
    transferUSDC: jest.fn(),
    getBalance: jest.fn(),
  },
}));

jest.mock('./services/bus', () => ({
  AgentBusService: {
    verifyMessage: jest.fn(),
    deliverMessage: jest.fn(),
  },
}));

jest.mock('./services/negotiation', () => ({
  NegotiationService: {
    handleBookingMessage: jest.fn(),
  },
}));

jest.mock('./services/amplification', () => ({
  AmplificationService: {
    handleAmplificationMessage: jest.fn(),
  },
}));

jest.mock('./services/bitcoin-wallet', () => ({
  BitcoinWalletService: {
    getBackendInfo: jest.fn().mockResolvedValue({ chain: 'BTC', status: 'ok' }),
    listWallets: jest.fn().mockResolvedValue([{ id: 1, agentId: 'agent_7', label: 'Primary', network: 'btc', createdAt: '2026-01-01T00:00:00Z' }]),
    registerWatchOnlyWallet: jest.fn().mockResolvedValue({ id: 1, agentId: 'agent_7', label: 'Primary', network: 'btc' }),
    getUnusedAddress: jest.fn().mockResolvedValue({ address: 'bc1qexample' }),
    getBalance: jest.fn().mockResolvedValue({ confirmed: '0.1', unconfirmed: '0.0' }),
    getTransactions: jest.fn().mockResolvedValue({ transactions: [] }),
  },
}));

const { Pool } = require('pg');
const mockQuery = Pool.__mockQuery as jest.Mock;

describe('Bitcoin headless wallet routes', () => {
  const INTERNAL_API_KEY = 'test-key';

  beforeAll(() => {
    process.env.INTERNAL_API_KEY = INTERNAL_API_KEY;
  });

  beforeEach(() => {
    mockQuery.mockReset();
  });

  const makeApp = () => {
    const router = require('./underground').default;
    const app = express();
    app.use(express.json());
    app.use('/api/underground', router);
    return app;
  };

  it('requires auth for bitcoin backend info', async () => {
    const app = makeApp();
    const res = await request(app).get('/api/underground/bitcoin/backend/info');
    expect(res.status).toBe(401);
  });

  it('registers a watch-only bitcoin wallet for an owned agent', async () => {
    const app = makeApp();

    const res = await request(app)
      .post('/api/underground/bitcoin/wallets')
      .set('Authorization', `Bearer ${INTERNAL_API_KEY}`)
      .set('x-user-id', 'user_42')
      .send({
        agentId: 'agent_7',
        derivationScheme: 'xpub6CUGRU...',
        label: 'Primary',
      });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 1, agentId: 'agent_7', label: 'Primary', network: 'btc' });
  });

  it('rejects bitcoin wallet registration without agentId', async () => {
    const app = makeApp();

    const res = await request(app)
      .post('/api/underground/bitcoin/wallets')
      .set('Authorization', `Bearer ${INTERNAL_API_KEY}`)
      .set('x-user-id', 'user_42')
      .send({
        derivationScheme: 'xpub6CUGRU...',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('agentId is required');
  });

  it('lists bitcoin wallets for the authenticated user', async () => {
    const app = makeApp();

    const res = await request(app)
      .get('/api/underground/bitcoin/wallets')
      .set('Authorization', `Bearer ${INTERNAL_API_KEY}`)
      .set('x-user-id', '42');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].network).toBe('btc');
  });
});
