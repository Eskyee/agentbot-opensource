import request from 'supertest';
import { WalletService } from './services/wallet';
import { AgentBusService } from './services/bus';
import { AIService } from './services/ai';

// index.ts refuses to load (process.exit) without INTERNAL_API_KEY, so it must
// be set BEFORE importing the app.
if (!process.env.INTERNAL_API_KEY) {
  process.env.INTERNAL_API_KEY = 'test-key';
}
import app from './index';

describe('Agentbot Phase 1 Smoke Test', () => {
  const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'test-key';

  beforeAll(() => {
    process.env.INTERNAL_API_KEY = INTERNAL_API_KEY;
  });

  describe('Core Health & Versioning', () => {
    it('should return 200 OK from health check', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    it('should return OpenClaw runtime version', async () => {
      // /api/openclaw is now behind the Bearer gate — authenticate.
      const res = await request(app)
        .get('/api/openclaw/version')
        .set('Authorization', `Bearer ${INTERNAL_API_KEY}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('openclawVersion');
    });
  });

  describe('Underground Culture: Wallets & Treasury', () => {
    it('should have WalletService defined with core methods', () => {
      expect(WalletService.createAgentWallet).toBeDefined();
      expect(WalletService.transferUSDC).toBeDefined();
      expect(WalletService.getBalance).toBeDefined();
    });

    it('should require authentication for wallet endpoints', async () => {
      const res = await request(app).post('/api/underground/wallets');
      expect(res.status).toBe(401);
    });
  });

  describe('Underground Culture: Agent-to-Agent Bus', () => {
    it('should have AgentBusService with verification logic', () => {
      expect(AgentBusService.verifyMessage).toBeDefined();
      expect(AgentBusService.deliverMessage).toBeDefined();
    });

    it('should reject invalid signatures on the bus', async () => {
      const invalidMessage = {
        version: '1.0',
        messageId: 'test-id',
        timestamp: new Date().toISOString(),
        from: {
          agentId: 'agent-a',
          agentType: 'event',
          walletAddress: '0x123',
          signature: '0xinvalid'
        },
        to: { agentId: 'agent-b', agentType: 'talent' },
        action: 'test',
        payload: {}
      };

      const res = await request(app)
        .post('/api/underground/bus/send')
        .send(invalidMessage);
      
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid message');
    });
  });

  describe('AI Tiers & OpenRouter Integration', () => {
    it('should have AIService with tiered configuration', () => {
      expect(AIService.prompt).toBeDefined();
    });

    // SKIP: these assert a removed surface — there are no
    // /api/underground/models/{library,installed} routes (model discovery moved
    // to /api/ai/models, which returns a different shape and OpenRouter models,
    // not local ollama ids). Re-enable after rewriting against the current API.
    it.skip('should return official model library', async () => {
      const res = await request(app)
        .get('/api/underground/models/library')
        .set('Authorization', `Bearer ${INTERNAL_API_KEY}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((m: any) => m.id === 'deepseek-r1:32b')).toBe(true);
    });

    it.skip('should list installed models', async () => {
      const res = await request(app)
        .get('/api/underground/models/installed')
        .set('Authorization', `Bearer ${INTERNAL_API_KEY}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Database Schema Integrity', () => {
    it('should define Underground tables in the DB schema (db-init.ts)', async () => {
      // Schema now lives in src/services/db-init.ts (TS), not a top-level init-db.sql.
      const fs = require('fs').promises;
      const path = require('path');
      const schema = await fs.readFile(path.join(__dirname, 'services', 'db-init.ts'), 'utf8');
      expect(schema).toContain('CREATE TABLE IF NOT EXISTS events');
      expect(schema).toContain('CREATE TABLE IF NOT EXISTS treasury_transactions');
      expect(schema).toContain('CREATE TABLE IF NOT EXISTS royalty_splits');
    });
  });
});
