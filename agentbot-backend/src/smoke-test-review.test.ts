import request from 'supertest';
import app from './index';
import { WalletService } from './services/wallet';
import { AgentBusService } from './services/bus';
import { AIService } from './services/ai';
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
      const res = await request(app).get('/api/openclaw/version');
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
      expect(res.body.error).toBe('Invalid message signature');
    });
  });

  describe('AI Tiers & OpenRouter Integration', () => {
    it('should have AIService with tiered configuration', () => {
      expect(AIService.prompt).toBeDefined();
    });

    it('should return official model library', async () => {
      const res = await request(app)
        .get('/api/underground/models/library')
        .set('Authorization', `Bearer ${INTERNAL_API_KEY}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((m: any) => m.id === 'deepseek-r1:32b')).toBe(true);
    });

    it('should list installed models', async () => {
      const res = await request(app)
        .get('/api/underground/models/installed')
        .set('Authorization', `Bearer ${INTERNAL_API_KEY}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Database Schema Integrity', () => {
    it('should have updated init-db.sql with Underground tables', async () => {
      const fs = require('fs').promises;
      const schema = await fs.readFile('../init-db.sql', 'utf8');
      expect(schema).toContain('CREATE TABLE IF NOT EXISTS events');
      expect(schema).toContain('CREATE TABLE IF NOT EXISTS treasury_transactions');
      expect(schema).toContain('CREATE TABLE IF NOT EXISTS royalty_splits');
    });
  });
});
