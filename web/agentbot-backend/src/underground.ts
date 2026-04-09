import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import { WalletService } from './services/wallet';
import { AgentBusService, AgentMessage } from './services/bus';
import { NegotiationService } from './services/negotiation'; // Added
import { AmplificationService } from './services/amplification'; // Added
import { createClient, type RedisClientType } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

let splitQueueClient: RedisClientType | null = null;

async function getSplitQueueClient(): Promise<RedisClientType> {
  if (!splitQueueClient) {
    splitQueueClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });
    splitQueueClient.on('error', (error) => {
      console.error('Royalty split queue redis error:', error);
    });
  }

  if (!splitQueueClient.isOpen) {
    await splitQueueClient.connect();
  }

  return splitQueueClient;
}

async function enqueueRoyaltySplitJob(job: Record<string, unknown>): Promise<void> {
  const client = await getSplitQueueClient();
  await client.rPush('royalty-splits', JSON.stringify(job));
}

// Middleware to verify internal API key (Atlas/Frontend only)
const authenticate = (req: Request, res: Response, next: any) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ') || auth.substring(7) !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

/**
 * --- AGENT-TO-AGENT BUS ---
 */

// Dispatch a message from one agent to another
router.post('/bus/send', async (req: Request, res: Response) => {
  const message: AgentMessage = req.body;

  // 1. Verify authenticity
  const isValid = await AgentBusService.verifyMessage(message);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid message signature' });
  }

  // 2. Handle specific Underground logic based on action type
  try {
    if (message.action.startsWith('BOOKING_')) {
      await NegotiationService.handleBookingMessage(message);
    } else if (message.action.startsWith('AMPLIFY_')) {
      await AmplificationService.handleAmplificationMessage(message);
    }

    // 3. Deliver to recipient agent webhook
    await AgentBusService.deliverMessage(message);
    res.json({ success: true, messageId: message.messageId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * --- EVENT MANAGEMENT ---
 */

// List all events
router.get('/events', authenticate, async (req: Request, res: Response) => {
  const result = await pool.query('SELECT * FROM events ORDER BY event_date DESC');
  res.json(result.rows);
});

// Create a new event (Rave)
router.post('/events', authenticate, async (req: Request, res: Response) => {
  const { agentId, name, description, venue, eventDate, ticketPriceUsdc, totalTickets } = req.body;
  
  try {
    const result = await pool.query(
      'INSERT INTO events (agent_id, name, description, venue, event_date, ticket_price_usdc, total_tickets) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [agentId, name, description, venue, eventDate, ticketPriceUsdc, totalTickets]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * --- TREASURY & WALLETS ---
 */

// Create a new agent wallet
router.post('/wallets', authenticate, async (req: Request, res: Response) => {
  const { userId, agentId } = req.body;
  try {
    const wallet = await WalletService.createAgentWallet(userId, agentId);
    res.status(201).json(wallet);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get agent balance
router.get('/wallets/:address/balance', authenticate, async (req: Request, res: Response) => {
  const { userId } = req.query;
  const { address } = req.params;
  try {
    const balance = await WalletService.getBalance(Number(userId), address);
    res.json({ address, balance_usdc: balance });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * --- ROYALTY SPLITS ---
 */

// Create and execute a royalty split (Async Queue version)
router.post('/splits', authenticate, async (req: Request, res: Response) => {
  const { userId, agentId, fromAddress, name, totalAmount, recipients } = req.body;

  try {
    // 1. Record split in DB
    const splitResult = await pool.query(
      'INSERT INTO royalty_splits (agent_id, name, total_amount_usdc, status) VALUES ($1, $2, $3, $4) RETURNING id',
      [agentId, name, totalAmount, 'pending']
    );
    const splitId = splitResult.rows[0].id;

    // 2. Add recipients to DB
    for (const recipient of recipients) {
      await pool.query(
        'INSERT INTO royalty_recipients (split_id, wallet_address, share_percentage, paid) VALUES ($1, $2, $3, FALSE)',
        [splitId, recipient.address, recipient.share]
      );
    }

    // 3. Queue the background execution
    await enqueueRoyaltySplitJob({
      splitId,
      userId,
      agentId,
      fromAddress
    });

    res.json({ success: true, splitId, status: 'queued' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
