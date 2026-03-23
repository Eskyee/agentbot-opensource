import { AgentBusService, AgentMessage } from './bus';
import { Pool } from 'pg';
import { WalletService } from './wallet';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export class NegotiationService {
  /**
   * Handles incoming A2A booking messages.
   * Logic: Offer -> Counter -> Accept -> Contract
   */
  static async handleBookingMessage(message: AgentMessage): Promise<void> {
    const { action, payload, from } = message;

    switch (action) {
      case 'BOOKING_OFFER':
        await this.recordOffer(message);
        break;
      
      case 'BOOKING_ACCEPT':
        await this.finalizeContract(message);
        break;

      case 'BOOKING_DECLINE':
        await this.updateStatus(payload.bookingId, 'declined');
        break;
    }
  }

  private static async recordOffer(message: AgentMessage) {
    const { payload, from } = message;
    // Record the offer in the receiver's DB (The Talent Agent)
    await pool.query(
      'INSERT INTO bookings (talent_agent_id, talent_name, offer_amount_usdc, status, metadata) VALUES ($1, $2, $3, $4, $5)',
      [from.agentId, payload.talentName, payload.amount, 'offered', JSON.stringify(payload)]
    );
  }

  private static async finalizeContract(message: AgentMessage) {
    const { payload } = message;
    // Update booking to accepted and trigger any onchain escrow if needed
    await pool.query(
      'UPDATE bookings SET status = \'accepted\', updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [payload.bookingId]
    );
  }

  private static async updateStatus(bookingId: number, status: string) {
    await pool.query('UPDATE bookings SET status = $1 WHERE id = $2', [status, bookingId]);
  }
}
