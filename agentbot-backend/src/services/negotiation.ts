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
    const { action, payload } = message;

    switch (action) {
      case 'BOOKING_OFFER':
        await this.recordOffer(message);
        break;

      case 'BOOKING_ACCEPT':
        await this.finalizeContract(message);
        break;

      case 'BOOKING_DECLINE':
        await this.updateStatus(message, payload.bookingId as number, 'declined');
        break;
    }
  }

  private static async recordOffer(message: AgentMessage) {
    const { payload, from } = message;
    await pool.query(
      'INSERT INTO bookings (talent_agent_id, talent_name, offer_amount_usdc, status, metadata) VALUES ($1, $2, $3, $4, $5)',
      [from.agentId, payload.talentName, payload.amount, 'offered', JSON.stringify(payload)]
    );
  }

  private static async finalizeContract(message: AgentMessage) {
    const { payload, from } = message;

    // Atomic: verify ownership AND update status in one statement.
    // Eliminates the SELECT→UPDATE race where another request could
    // sneak in between the two queries and corrupt booking state.
    const result = await pool.query(
      `UPDATE bookings
       SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
         AND talent_agent_id = $2
         AND status IN ('offered', 'countered')
       RETURNING id`,
      [payload.bookingId, String(from.agentId)]
    );

    if (result.rows.length === 0) {
      // Distinguish: booking missing vs. wrong owner vs. wrong status
      const check = await pool.query(
        'SELECT talent_agent_id, status FROM bookings WHERE id = $1',
        [payload.bookingId]
      );
      if (check.rows.length === 0) {
        throw new Error(`Booking ${payload.bookingId} not found`);
      }
      if (String(check.rows[0].talent_agent_id) !== String(from.agentId)) {
        throw new Error(`Agent ${from.agentId} is not authorized to accept booking ${payload.bookingId}`);
      }
      throw new Error(`Booking ${payload.bookingId} is not in an acceptable state (status: ${check.rows[0].status})`);
    }
  }

  private static async updateStatus(message: AgentMessage, bookingId: number, status: string) {
    const { from } = message;

    // Atomic: verify ownership AND update in one statement.
    const result = await pool.query(
      'UPDATE bookings SET status = $1 WHERE id = $2 AND talent_agent_id = $3 RETURNING id',
      [status, bookingId, String(from.agentId)]
    );

    if (result.rows.length === 0) {
      const check = await pool.query('SELECT talent_agent_id FROM bookings WHERE id = $1', [bookingId]);
      if (check.rows.length === 0) {
        throw new Error(`Booking ${bookingId} not found`);
      }
      throw new Error(`Agent ${from.agentId} is not authorized to update booking ${bookingId}`);
    }
  }
}
