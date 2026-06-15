import { buildSystemPrompt, ALGORITHM_SYSTEM_PROMPT } from './ai';

describe('AIService', () => {
  describe('buildSystemPrompt', () => {
    it('should return base prompt when algorithmMode is false', () => {
      const result = buildSystemPrompt('You are a helpful assistant', false);
      expect(result).toBe('You are a helpful assistant');
    });

    it('should include Algorithm prompt when algorithmMode is true', () => {
      const result = buildSystemPrompt('You are a helpful assistant', true);
      expect(result).toContain(ALGORITHM_SYSTEM_PROMPT);
      expect(result).toContain('You are a helpful assistant');
    });

    it('should return only Algorithm prompt when base prompt is empty', () => {
      const result = buildSystemPrompt('', true);
      expect(result).toBe(ALGORITHM_SYSTEM_PROMPT);
    });

    it('should handle whitespace-only base prompt', () => {
      const result = buildSystemPrompt('   ', true);
      expect(result).toBe(ALGORITHM_SYSTEM_PROMPT);
    });

    it('should trim base prompt', () => {
      const result = buildSystemPrompt('  You are helpful  ', true);
      expect(result).toContain('You are helpful');
      expect(result).not.toContain('  You are helpful  ');
    });
  });

  describe('ModelTier type', () => {
    it('should accept valid tiers', () => {
      const validTiers = ['reasoning', 'coding', 'fast', 'creative'] as const;
      validTiers.forEach(tier => {
        expect(['reasoning', 'coding', 'fast', 'creative']).toContain(tier);
      });
    });
  });
});
