import { AgentBusService, AgentMessage } from './bus';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export class AmplificationService {
  /**
   * Handles autonomous cross-promotion coordination.
   */
  static async handleAmplificationMessage(message: AgentMessage): Promise<void> {
    const { action, payload, from } = message;

    if (action === 'AMPLIFY_REQUEST') {
      // Record request from partner
      await pool.query(
        'INSERT INTO social_amplifications (partner_agent_id, reward_amount_usdc, status) VALUES ($1, $2, $3)',
        [from.agentId, payload.reward, 'requested']
      );
    }
  }

  /**
   * Triggers a global campaign across partner agents on the bus.
   */
  static async broadcastCampaign(campaignId: number, userId: number): Promise<void> {
    const campaign = await pool.query('SELECT * FROM social_campaigns WHERE id = $1', [campaignId]);
    if (campaign.rows.length === 0) throw new Error('Campaign not found');

    // Fetch all active "Amplifier" agents on the platform
    const partners = await pool.query('SELECT id, config->\'subdomain\' as subdomain FROM agents WHERE user_id != $1', [userId]);

    for (const partner of partners.rows) {
      const message: AgentMessage = {
        version: '1.0',
        messageId: `amp-${Date.now()}-${partner.id}`,
        timestamp: new Date().toISOString(),
        from: {
          agentId: campaign.rows[0].agent_id.toString(),
          agentType: 'promoter',
          walletAddress: '', // To be filled by signer
          signature: ''
        },
        to: {
          agentId: partner.subdomain,
          agentType: 'amplifier'
        },
        action: 'AMPLIFY_REQUEST',
        payload: {
          content: campaign.rows[0].content,
          reward: 5.00 // Fixed reward for sharing
        }
      };

      await AgentBusService.deliverMessage(message);
    }
  }
}
