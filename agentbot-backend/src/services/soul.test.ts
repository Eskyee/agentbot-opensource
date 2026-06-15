const mockPool = { query: jest.fn() };
jest.mock('../lib/db', () => ({ pool: mockPool }));
jest.mock('../lib/logger', () => ({ log: { info: jest.fn(), warn: jest.fn(), error: jest.fn() } }));

import { SoulService } from './soul';

describe('SoulService', () => {
  let service: SoulService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SoulService();
  });

  describe('getSoul', () => {
    it('should return null for unknown agent', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      const result = await service.getSoul('unknown');
      expect(result).toBeNull();
    });

    it('should return soul with defaults for agent without metadata', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ metadata: {} }] });
      const result = await service.getSoul('agent-1');
      expect(result).not.toBeNull();
      expect(result?.personality).toContain('helpful');
      expect(result?.voice).toContain('Professional');
    });

    it('should return soul with custom metadata', async () => {
      const customMetadata = {
        personality: 'A creative artist',
        voice: 'Warm and expressive',
        coreDirectives: ['Be creative', 'Express emotions'],
        systemPrompt: 'You are an artist',
      };
      mockPool.query.mockResolvedValueOnce({ rows: [{ metadata: customMetadata }] });
      const result = await service.getSoul('agent-1');
      expect(result?.personality).toBe('A creative artist');
      expect(result?.voice).toBe('Warm and expressive');
      expect(result?.coreDirectives).toEqual(['Be creative', 'Express emotions']);
    });

    it('should handle database errors gracefully', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('DB error'));
      const result = await service.getSoul('agent-1');
      expect(result).toBeNull();
    });
  });

  describe('generateSystemPrompt', () => {
    it('should generate prompt with defaults for unknown agent', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      const prompt = await service.generateSystemPrompt('unknown', 'Additional context');
      expect(prompt).toContain('unknown');
      expect(prompt).toContain('Additional context');
    });

    it('should generate prompt from soul metadata', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ metadata: { personality: 'Test personality', voice: 'Test voice', coreDirectives: ['Rule 1'], systemPrompt: 'Base prompt' } }] });
      const prompt = await service.generateSystemPrompt('agent-1');
      expect(prompt).toContain('IDENTITY');
      expect(prompt).toContain('Test personality');
      expect(prompt).toContain('VOICE & STYLE');
      expect(prompt).toContain('CORE DIRECTIVES');
      expect(prompt).toContain('Rule 1');
    });
  });

  describe('updateSoul', () => {
    it('should throw on invalid agentId', async () => {
      await expect(service.updateSoul('', {})).rejects.toThrow('agentId is required');
    });

    it('should update soul metadata', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ metadata: {} }] }); // getSoul
      mockPool.query.mockResolvedValueOnce({}); // update
      await service.updateSoul('agent-1', { personality: 'New personality' });
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('should throw on invalid coreDirectives', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ metadata: {} }] });
      await expect(service.updateSoul('agent-1', { coreDirectives: 'not-an-array' as any })).rejects.toThrow('coreDirectives must be an array');
    });
  });
});
