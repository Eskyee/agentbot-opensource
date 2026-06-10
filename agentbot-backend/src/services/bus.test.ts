import { AgentBusService, AgentMessage } from './bus';

// Mock the database pool
jest.mock('../lib/db', () => ({
  pool: {
    query: jest.fn().mockResolvedValue({ rowCount: 1, rows: [] }),
  },
}));

// Mock the logger
jest.mock('../lib/logger', () => ({
  log: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('AgentBusService', () => {
  describe('verifyMessage', () => {
    const validMessage: AgentMessage = {
      version: '1.0',
      messageId: 'test-msg-001',
      timestamp: new Date().toISOString(),
      from: {
        agentId: 'agent-1',
        agentType: 'worker',
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        signature: '0xinvalid', // Would be a real signature in production
      },
      to: {
        agentId: 'agent-2',
        agentType: 'worker',
      },
      action: 'transfer',
      payload: { amount: 100, currency: 'USDC' },
    };

    it('should return false for invalid signature', async () => {
      const result = await AgentBusService.verifyMessage(validMessage);
      expect(result).toBe(false);
    });

    it('should return false with reason for invalid signature (detailed)', async () => {
      const result = await AgentBusService.verifyMessageDetailed(validMessage);
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('verify_error');
    });

    it('should reject messages with invalid timestamp', async () => {
      const msg = { ...validMessage, timestamp: 'not-a-date' };
      const result = await AgentBusService.verifyMessageDetailed(msg, { enforceTimestamp: true });
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('invalid_timestamp');
    });

    it('should reject expired messages when enforceTimestamp is true', async () => {
      const oldMessage = {
        ...validMessage,
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 min ago
      };
      const result = await AgentBusService.verifyMessageDetailed(oldMessage, { enforceTimestamp: true });
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('expired');
    });

    it('should accept messages within the replay window', async () => {
      const recentMessage = {
        ...validMessage,
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 min ago
      };
      // Will fail on signature, but should NOT fail on timestamp
      const result = await AgentBusService.verifyMessageDetailed(recentMessage, { enforceTimestamp: true });
      expect(result.reason).not.toBe('expired');
      expect(result.reason).not.toBe('invalid_timestamp');
    });

    it('should skip timestamp check when enforceTimestamp is false', async () => {
      const oldMessage = {
        ...validMessage,
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
      };
      const result = await AgentBusService.verifyMessageDetailed(oldMessage, { enforceTimestamp: false });
      // Should fail on signature, not timestamp
      expect(result.reason).not.toBe('expired');
    });
  });

  describe('claimNonce', () => {
    it('should return false for empty messageId', async () => {
      const result = await AgentBusService.claimNonce('', '0x1234');
      expect(result).toBe(false);
    });
  });
});
