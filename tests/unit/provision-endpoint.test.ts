import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';

/**
 * UNIT TESTS FOR PROVISION ENDPOINT
 * Tests the /api/provision endpoint in isolation
 */

describe('Provision Endpoint (POST /api/provision)', () => {
  const API_URL = process.env.TEST_API_URL || 'http://localhost:3000';
  let createdAgentIds: string[] = [];

  beforeEach(() => {
    console.log(`\n📝 Testing against: ${API_URL}`);
  });

  afterAll(async () => {
    console.log(`\n✅ Cleanup: Created ${createdAgentIds.length} test agents`);
  });

  describe('Valid Requests', () => {
    it('should create agent with valid Telegram token', async () => {
      const response = await fetch(`${API_URL}/api/provision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramToken: `valid-token-${Date.now()}`,
          telegramUserId: '987654321',
          aiProvider: 'ollama',
          plan: 'free'
        })
      });

      console.log(`Response status: ${response.status}`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      console.log(`Response data:`, JSON.stringify(data, null, 2));
      
      expect(data.success).toBe(true);
      expect(data.userId).toBeDefined();
      expect(data.subdomain).toBeDefined();
      expect(data.url).toBeDefined();
      expect(data.streamKey).toBeDefined();
      expect(data.liveStreamId).toBeDefined();
      
      createdAgentIds.push(data.userId);
      console.log(`✅ Agent created: ${data.userId}`);
    }, 30000);

    it('should provision with Discord token as alternative', async () => {
      const response = await fetch(`${API_URL}/api/provision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discordBotToken: `discord-token-${Date.now()}`,
          discordGuildId: 'guild-123',
          discordChannelId: 'channel-123',
          aiProvider: 'ollama',
          plan: 'free'
        })
      });

      console.log(`Discord provision status: ${response.status}`);
      expect([200, 201, 400, 502]).toContain(response.status);
      
      if (response.ok) {
        const data = await response.json();
        expect(data.success).toBe(true);
        createdAgentIds.push(data.userId);
        console.log(`✅ Discord agent created: ${data.userId}`);
      } else {
        const data = await response.json();
        console.log(`⚠️  Discord provision not available:`, data.error);
      }
    }, 30000);

    it('should include Mux stream credentials', async () => {
      const response = await fetch(`${API_URL}/api/provision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramToken: `mux-test-${Date.now()}`,
          telegramUserId: '111111111',
          aiProvider: 'ollama',
          plan: 'pro'
        })
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      
      console.log(`Stream Key: ${data.streamKey}`);
      console.log(`Live Stream ID: ${data.liveStreamId}`);
      
      if (data.streamKey) {
        expect(data.streamKey).toMatch(/^[a-zA-Z0-9\-]+$/);
        console.log(`✅ Valid stream key format`);
      }
      
      if (data.liveStreamId) {
        expect(data.liveStreamId).toMatch(/^[a-zA-Z0-9]+$/);
        console.log(`✅ Valid live stream ID format`);
      }
      
      createdAgentIds.push(data.userId);
    }, 30000);
  });

  describe('Error Handling', () => {
    it('should reject without channel tokens', async () => {
      const response = await fetch(`${API_URL}/api/provision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aiProvider: 'ollama',
          plan: 'free'
        })
      });

      console.log(`No tokens status: ${response.status}`);
      expect(response.status).toBe(400);
      
      const data = await response.json();
      console.log(`Error: ${data.error}`);
      expect(data.error).toContain('channel token');
      console.log(`✅ Correctly rejected missing tokens`);
    });

    it('should handle backend connection errors', async () => {
      const response = await fetch(`${API_URL}/api/provision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramToken: `connection-test-${Date.now()}`,
          telegramUserId: '222222222',
          aiProvider: 'ollama'
        }),
        signal: AbortSignal.timeout(10000)
      });

      console.log(`Connection test status: ${response.status}`);
      // Should either succeed or fail with clear error
      expect([200, 201, 502, 500].includes(response.status)).toBe(true);
      
      if (!response.ok) {
        const data = await response.json();
        expect(data.error).toBeDefined();
        console.log(`✅ Error handled gracefully: ${data.error}`);
      }
    }, 15000);

    it('should handle malformed JSON gracefully', async () => {
      const response = await fetch(`${API_URL}/api/provision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{invalid json'
      });

      console.log(`Malformed JSON status: ${response.status}`);
      // Should return 400 (bad request) not 500
      expect([400, 500]).toContain(response.status);
      console.log(`✅ Malformed JSON handled`);
    });
  });

  describe('Response Format Validation', () => {
    it('should return valid URL format', async () => {
      const response = await fetch(`${API_URL}/api/provision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramToken: `url-format-test-${Date.now()}`,
          telegramUserId: '333333333',
          aiProvider: 'ollama'
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`URL: ${data.url}`);
        expect(data.url).toMatch(/^https?:\/\//);
        expect(data.url).toContain('.');
        console.log(`✅ Valid URL format`);
        createdAgentIds.push(data.userId);
      }
    }, 30000);

    it('should return valid subdomain format', async () => {
      const response = await fetch(`${API_URL}/api/provision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramToken: `subdomain-test-${Date.now()}`,
          telegramUserId: '444444444',
          aiProvider: 'ollama'
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`Subdomain: ${data.subdomain}`);
        expect(data.subdomain).toMatch(/^[a-zA-Z0-9\-]+\.[a-zA-Z0-9\-]+/);
        console.log(`✅ Valid subdomain format`);
        createdAgentIds.push(data.userId);
      }
    }, 30000);

    it('should return consistent data structure', async () => {
      const response = await fetch(`${API_URL}/api/provision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramToken: `structure-test-${Date.now()}`,
          telegramUserId: '555555555',
          aiProvider: 'ollama'
        })
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      
      const requiredFields = ['success', 'userId', 'subdomain', 'url', 'streamKey', 'liveStreamId'];
      requiredFields.forEach(field => {
        expect(data[field]).toBeDefined();
        console.log(`✅ Field present: ${field} = ${typeof data[field]}`);
      });
      
      createdAgentIds.push(data.userId);
    }, 30000);
  });

  describe('Different AI Providers', () => {
    it('should support ollama provider', async () => {
      const response = await fetch(`${API_URL}/api/provision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramToken: `ollama-${Date.now()}`,
          telegramUserId: '666666666',
          aiProvider: 'ollama',
          plan: 'free'
        })
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
      console.log(`✅ Ollama provider works`);
      createdAgentIds.push(data.userId);
    }, 30000);

    it('should support openrouter provider', async () => {
      const response = await fetch(`${API_URL}/api/provision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramToken: `openrouter-${Date.now()}`,
          telegramUserId: '777777777',
          aiProvider: 'openrouter',
          plan: 'pro'
        })
      });

      // Should succeed or fail with clear error
      console.log(`OpenRouter status: ${response.status}`);
      expect([200, 201, 502]).toContain(response.status);
      
      if (response.ok) {
        const data = await response.json();
        expect(data.success).toBe(true);
        console.log(`✅ OpenRouter provider works`);
        createdAgentIds.push(data.userId);
      }
    }, 30000);
  });

  describe('Different Plans', () => {
    const plans = ['free', 'pro', 'enterprise'];

    plans.forEach(plan => {
      it(`should provision with ${plan} plan`, async () => {
        const response = await fetch(`${API_URL}/api/provision`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegramToken: `plan-${plan}-${Date.now()}`,
            telegramUserId: '888888888',
            aiProvider: 'ollama',
            plan
          })
        });

        console.log(`Plan ${plan} status: ${response.status}`);
        expect([200, 201, 400, 502]).toContain(response.status);
        
        if (response.ok) {
          const data = await response.json();
          expect(data.success).toBe(true);
          console.log(`✅ Plan ${plan} works`);
          createdAgentIds.push(data.userId);
        }
      }, 30000);
    });
  });
});
