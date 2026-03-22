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
   * Delivers in parallel batches of 20 to avoid overwhelming the host.
   */
  static async broadcastCampaign(campaignId: number, userId: number): Promise<void> {
    // SECURITY: Verify the campaign belongs to the calling user before broadcasting.
    // Without this check any authenticated user could broadcast another user's campaign.
    const campaign = await pool.query(
      'SELECT * FROM social_campaigns WHERE id = $1 AND user_id = $2',
      [campaignId, userId]
    );
    if (campaign.rows.length === 0) throw new Error('Campaign not found or not owned by caller');

    // Fetch all active "Amplifier" agents on the platform
    const partners = await pool.query(
      "SELECT id, config->>'subdomain' as subdomain FROM agents WHERE user_id != $1",
      [userId]
    );

    const CONCURRENCY = 20;
    const rows = partners.rows;

    for (let i = 0; i < rows.length; i += CONCURRENCY) {
      const batch = rows.slice(i, i + CONCURRENCY);
      await Promise.allSettled(batch.map((partner) => {
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
        return AgentBusService.deliverMessage(message).catch((err) => {
          console.error(`[Amplification] Failed to deliver to agent ${partner.id}:`, err);
        });
      }));
    }
  }
}
