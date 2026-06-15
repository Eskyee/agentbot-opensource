import { pool } from '../lib/db';
import { log } from '../lib/logger';

export interface AgentSoul {
  agentId: string;
  personality: string;
  voice: string;
  coreDirectives: string[];
  systemPrompt: string;
  metadata: Record<string, unknown>;
}

/**
 * SoulService manages the "identity" and behavioral traits of an agent.
 * This standardizes the system prompt generation across different models and skills.
 */
export class SoulService {
  
  /**
   * Generates a complete system prompt for an agent based on its soul and requested context.
   */
  async generateSystemPrompt(agentId: string, additionalContext: string = ''): Promise<string> {
    const soul = await this.getSoul(agentId);
    if (!soul) {
      return `You are an AI agent with ID ${agentId}. ${additionalContext}`;
    }

    const directives = soul.coreDirectives.map(d => `- ${d}`).join('\n');
    
    return `
# IDENTITY
${soul.personality}

# VOICE & STYLE
${soul.voice}

# CORE DIRECTIVES
${directives}

# BASE SYSTEM PROMPT
${soul.systemPrompt}

# SESSION CONTEXT
${additionalContext}
`.trim();
  }

  /**
   * Retrieves an agent's soul from the database.
   */
  async getSoul(agentId: string): Promise<AgentSoul | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM agent_runtime_state WHERE agent_id = $1',
        [agentId]
      );

      if (result.rows.length === 0) return null;
      
      const row = result.rows[0];
      const metadata = row.metadata || {};
      
      return {
        agentId,
        personality: metadata.personality || 'A helpful and autonomous AI agent.',
        voice: metadata.voice || 'Professional, concise, and direct.',
        coreDirectives: metadata.coreDirectives || ['Always protect user privacy.', 'Be truthful and accurate.'],
        systemPrompt: metadata.systemPrompt || 'Execute tasks efficiently and provide clear feedback.',
        metadata
      };
    } catch (error) {
      log.error('SoulService', { error: { event: 'get_soul_failed', agentId, error: String(error) } })
      return null;
    }
  }

  /**
   * Updates an agent's soul metadata.
   */
  async updateSoul(agentId: string, soulUpdate: Partial<AgentSoul>): Promise<void> {
    if (!agentId || typeof agentId !== 'string') {
      throw new Error('agentId is required');
    }

    const current = await this.getSoul(agentId);
    const metadata: Record<string, unknown> = {
      ...(current?.metadata || {}),
      ...soulUpdate,
      updatedAt: new Date().toISOString()
    };

    // Validate coreDirectives if provided
    if (soulUpdate.coreDirectives && !Array.isArray(soulUpdate.coreDirectives)) {
      throw new Error('coreDirectives must be an array');
    }

    await pool.query(
      'UPDATE agent_runtime_state SET metadata = $1 WHERE agent_id = $2',
      [metadata, agentId]
    );
    
    log.info('SoulService', { details: { event: 'soul_updated', agentId } })
  }
}

export const soulService = new SoulService();
