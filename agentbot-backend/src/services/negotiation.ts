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

    // Verify that the sender is the original offer-maker for this booking.
    // Prevents any arbitrary agent from accepting bookings they didn't originate.
    const booking = await pool.query(
      'SELECT talent_agent_id FROM bookings WHERE id = $1',
      [payload.bookingId]
    );

    if (booking.rows.length === 0) {
      throw new Error(`Booking ${payload.bookingId} not found`);
    }

    const ownerAgentId = String(booking.rows[0].talent_agent_id);
    if (ownerAgentId !== String(from.agentId)) {
      throw new Error(
        `Agent ${from.agentId} is not authorized to accept booking ${payload.bookingId}`
      );
    }

    await pool.query(
      "UPDATE bookings SET status = 'accepted', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [payload.bookingId]
    );
  }

  private static async updateStatus(message: AgentMessage, bookingId: number, status: string) {
    const { from } = message;

    // Verify ownership before any status change
    const booking = await pool.query(
      'SELECT talent_agent_id FROM bookings WHERE id = $1',
      [bookingId]
    );

    if (booking.rows.length === 0) {
      throw new Error(`Booking ${bookingId} not found`);
    }

    const ownerAgentId = String(booking.rows[0].talent_agent_id);
    if (ownerAgentId !== String(from.agentId)) {
      throw new Error(
        `Agent ${from.agentId} is not authorized to update booking ${bookingId}`
      );
    }

    await pool.query('UPDATE bookings SET status = $1 WHERE id = $2', [status, bookingId]);
  }
}
