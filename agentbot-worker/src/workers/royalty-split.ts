import Queue from 'bull';
import { Pool } from 'pg';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Wallet service would normally be in agentbot-backend
// For now, we'll make direct calls or stub this
class WalletService {
  static async transferUSDC(
    userId: number,
    fromAddress: string,
    toAddress: string,
    amount: number
  ): Promise<string> {
    // Call to agentbot-backend wallet service
    // or integrate Coinbase CDP directly
    const response = await axios.post(
      `${process.env.AGENTBOT_API_URL || 'http://localhost:3001'}/api/wallets/transfer`,
      {
        userId,
        fromAddress,
        toAddress,
        amount,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.INTERNAL_API_KEY || ''}`,
        },
      }
    );
    return response.data.txHash;
  }
}

// Create the Royalty Split Queue
const splitQueue = new Queue('royalty-splits', process.env.REDIS_URL || 'redis://localhost:6379');

/**
 * Worker Process: Executes autonomous USDC payouts for a split.
 */
splitQueue.process(async (job) => {
  const { splitId, userId, agentId, fromAddress } = job.data;
  
  console.log(`[WORKER] Starting royalty split ID: ${splitId}`);

  try {
    // 1. Fetch split details and recipients
    const splitResult = await pool.query(
      'SELECT total_amount_usdc FROM royalty_splits WHERE id = $1',
      [splitId]
    );
    const recipientsResult = await pool.query(
      'SELECT id, wallet_address, share_percentage FROM royalty_recipients WHERE split_id = $1 AND paid = FALSE',
      [splitId]
    );

    if (splitResult.rows.length === 0 || recipientsResult.rows.length === 0) {
      throw new Error('Split or unpaid recipients not found');
    }

    const totalAmount = Number(splitResult.rows[0].total_amount_usdc);

    // 2. Execute payouts sequentially to ensure stability
    for (const recipient of recipientsResult.rows) {
      const shareAmount = (totalAmount * Number(recipient.share_percentage)) / 100;
      
      console.log(`[WORKER] Paying ${shareAmount} USDC to ${recipient.wallet_address}`);

      const txHash = await WalletService.transferUSDC(
        userId,
        fromAddress,
        recipient.wallet_address,
        shareAmount
      );

      // 3. Update recipient status in DB
      await pool.query(
        'UPDATE royalty_recipients SET paid = TRUE, paid_at = CURRENT_TIMESTAMP, amount_usdc = $1 WHERE id = $2',
        [shareAmount, recipient.id]
      );
      
      console.log(`[WORKER] Success: ${txHash}`);
    }

    // 4. Mark the split as completed
    await pool.query(
      'UPDATE royalty_splits SET status = \'completed\', tx_hash = \'multi-tx\' WHERE id = $1',
      [splitId]
    );

    return { success: true, recipientsPaid: recipientsResult.rows.length };

  } catch (error: any) {
    console.error(`[WORKER] Split failed: ${error.message}`);
    await pool.query('UPDATE royalty_splits SET status = \'failed\' WHERE id = $1', [splitId]);
    throw error;
  }
});

console.log('🚀 Royalty Split Worker is active and monitoring the queue.');

export default splitQueue;
