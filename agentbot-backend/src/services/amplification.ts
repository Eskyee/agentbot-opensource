import { AgentMessage } from './bus';
import dotenv from 'dotenv';
import { pool } from '../lib/db';

dotenv.config();

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
   *
   * DISABLED: deliverMessage requires a valid Ed25519/ECDSA wallet signature,
   * but this method has no signing key wired up — it would send unsigned
   * messages (walletAddress: '', signature: '') that the bus rejects 100% of
   * the time. The previous implementation logged a warning and silently
   * dropped every delivery, which made the feature look like it worked.
   *
   * Throwing here makes the failure explicit: any caller will get a clear
   * error instead of believing the campaign was sent. Re-enable by integrating
   * a platform signing key (CDP account or local key) and constructing
   * properly signed AgentMessage payloads — see amplification.ts in git
   * history for the previous send loop.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static async broadcastCampaign(campaignId: number, userId: number): Promise<void> {
    throw new Error(
      'broadcastCampaign is disabled: requires signing key integration (see TODO P1)'
    );
  }
}
