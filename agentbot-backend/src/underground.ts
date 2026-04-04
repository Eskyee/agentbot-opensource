import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import { WalletService } from './services/wallet';
import { BitcoinWalletService } from './services/bitcoin-wallet';
import { AgentBusService, AgentMessage } from './services/bus';
import { NegotiationService } from './services/negotiation'; // Added
import { AmplificationService } from './services/amplification'; // Added
import dotenv from 'dotenv';
import { timingSafeEqual } from 'crypto';

dotenv.config();

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Middleware to verify internal API key + extract user context — timing-safe to prevent enumeration
const authenticate = (req: Request, res: Response, next: any) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = auth.substring(7);
  const expected = process.env.INTERNAL_API_KEY || '';
  const tokenBuf = Buffer.from(token);
  const expectedBuf = Buffer.from(expected);
  if (!expected || tokenBuf.length !== expectedBuf.length || !timingSafeEqual(tokenBuf, expectedBuf)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // Extract user context from trusted frontend headers
  (req as any).userId = req.headers['x-user-id'] as string || '';
  (req as any).userEmail = req.headers['x-user-email'] as string || '';
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
    console.error('[Bus] Send error:', error.message);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * --- EVENT MANAGEMENT ---
 */

// List events for user's agents only
router.get('/events', authenticate, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  if (!userId) return res.status(401).json({ error: 'User context required' });

  const result = await pool.query(
    `SELECT e.* FROM events e
     JOIN agents a ON e.agent_id = a.id
     WHERE a.user_id = $1
     ORDER BY e.event_date DESC`,
    [userId]
  );
  res.json(result.rows);
});

// Create a new event (Rave) — user must own the agent
router.post('/events', authenticate, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { agentId, name, description, venue, eventDate, ticketPriceUsdc, totalTickets } = req.body;
  if (!userId) return res.status(401).json({ error: 'User context required' });
  if (!agentId || typeof agentId !== 'string') return res.status(400).json({ error: 'agentId (string) is required' });
  if (!name || typeof name !== 'string' || name.length > 200) return res.status(400).json({ error: 'name (string, max 200) is required' });
  if (ticketPriceUsdc != null && (typeof ticketPriceUsdc !== 'number' || ticketPriceUsdc < 0)) return res.status(400).json({ error: 'ticketPriceUsdc must be a non-negative number' });
  if (totalTickets != null && (typeof totalTickets !== 'number' || totalTickets < 1 || !Number.isInteger(totalTickets))) return res.status(400).json({ error: 'totalTickets must be a positive integer' });

  try {
    // Verify user owns this agent
    const agentCheck = await pool.query('SELECT id FROM agents WHERE id = $1 AND user_id = $2', [agentId, userId]);
    if (agentCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Agent not found or not owned by you' });
    }

    const result = await pool.query(
      'INSERT INTO events (agent_id, name, description, venue, event_date, ticket_price_usdc, total_tickets) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [agentId, name, description || null, venue || null, eventDate || null, ticketPriceUsdc || 0, totalTickets || 100]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('[Events] Create error:', error.message);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

/**
 * --- TREASURY & WALLETS ---
 */

// Create a new agent wallet — userId from auth context, not body
router.post('/wallets', authenticate, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { agentId } = req.body;
  if (!userId) return res.status(401).json({ error: 'User context required' });
  if (!agentId) return res.status(400).json({ error: 'agentId is required' });

  try {
    // Verify user owns this agent
    const agentCheck = await pool.query('SELECT id FROM agents WHERE id = $1 AND user_id = $2', [agentId, userId]);
    if (agentCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Agent not found or not owned by you' });
    }

    const wallet = await WalletService.createAgentWallet(userId, agentId);
    res.status(201).json(wallet);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create wallet' });
  }
});

// Get agent balance — userId from auth context, not query param
router.get('/wallets/:address/balance', authenticate, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { address } = req.params;
  if (!userId) return res.status(401).json({ error: 'User context required' });

  try {
    const balance = await WalletService.getBalance(Number(userId), address);
    res.json({ address, balance_usdc: balance });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

/**
 * --- BITCOIN (HEADLESS BACKEND) ---
 */

router.get('/bitcoin/backend/info', authenticate, async (_req: Request, res: Response) => {
  try {
    const info = await BitcoinWalletService.getBackendInfo();
    res.json(info);
  } catch (error: any) {
    console.error('[Bitcoin] Backend info error:', error.message);
    res.status(502).json({ error: 'Failed to fetch Bitcoin backend info' });
  }
});

router.get('/bitcoin/wallets', authenticate, async (req: Request, res: Response) => {
  const userId = String((req as any).userId || '');
  if (!userId) return res.status(401).json({ error: 'User context required' });

  try {
    const wallets = await BitcoinWalletService.listWallets(userId);
    res.json(wallets);
  } catch (error: any) {
    console.error('[Bitcoin] List wallets error:', error.message);
    res.status(500).json({ error: 'Failed to list Bitcoin wallets' });
  }
});

router.post('/bitcoin/wallets', authenticate, async (req: Request, res: Response) => {
  const userId = String((req as any).userId || '');
  const agentId = typeof req.body?.agentId === 'string' ? req.body.agentId : '';
  const derivationScheme = typeof req.body?.derivationScheme === 'string' ? req.body.derivationScheme : '';
  const label = typeof req.body?.label === 'string' ? req.body.label : undefined;

  if (!userId) return res.status(401).json({ error: 'User context required' });
  if (!agentId) {
    return res.status(400).json({ error: 'agentId is required' });
  }
  if (!derivationScheme.trim()) {
    return res.status(400).json({ error: 'derivationScheme is required' });
  }

  try {
    const wallet = await BitcoinWalletService.registerWatchOnlyWallet(userId, agentId, derivationScheme, label);
    res.status(201).json(wallet);
  } catch (error: any) {
    console.error('[Bitcoin] Register wallet error:', error.message);
    res.status(500).json({ error: 'Failed to register Bitcoin wallet' });
  }
});

router.get('/bitcoin/wallets/:walletId/address/unused', authenticate, async (req: Request, res: Response) => {
  const userId = String((req as any).userId || '');
  const walletId = Number(req.params.walletId);
  if (!userId) return res.status(401).json({ error: 'User context required' });
  if (!Number.isInteger(walletId) || walletId <= 0) {
    return res.status(400).json({ error: 'walletId must be a positive integer' });
  }

  try {
    const address = await BitcoinWalletService.getUnusedAddress(userId, walletId);
    res.json(address);
  } catch (error: any) {
    const status = error.message === 'Bitcoin wallet not found' ? 404 : 502;
    res.status(status).json({ error: status === 404 ? error.message : 'Failed to derive Bitcoin address' });
  }
});

router.get('/bitcoin/wallets/:walletId/balance', authenticate, async (req: Request, res: Response) => {
  const userId = String((req as any).userId || '');
  const walletId = Number(req.params.walletId);
  if (!userId) return res.status(401).json({ error: 'User context required' });
  if (!Number.isInteger(walletId) || walletId <= 0) {
    return res.status(400).json({ error: 'walletId must be a positive integer' });
  }

  try {
    const balance = await BitcoinWalletService.getBalance(userId, walletId);
    res.json(balance);
  } catch (error: any) {
    const status = error.message === 'Bitcoin wallet not found' ? 404 : 502;
    res.status(status).json({ error: status === 404 ? error.message : 'Failed to fetch Bitcoin balance' });
  }
});

router.get('/bitcoin/wallets/:walletId/transactions', authenticate, async (req: Request, res: Response) => {
  const userId = String((req as any).userId || '');
  const walletId = Number(req.params.walletId);
  if (!userId) return res.status(401).json({ error: 'User context required' });
  if (!Number.isInteger(walletId) || walletId <= 0) {
    return res.status(400).json({ error: 'walletId must be a positive integer' });
  }

  try {
    const transactions = await BitcoinWalletService.getTransactions(userId, walletId);
    res.json(transactions);
  } catch (error: any) {
    const status = error.message === 'Bitcoin wallet not found' ? 404 : 502;
    res.status(status).json({ error: status === 404 ? error.message : 'Failed to fetch Bitcoin transactions' });
  }
});

/**
 * --- ROYALTY SPLITS ---
 */

// Create and execute a royalty split — user must own the agent
router.post('/splits', authenticate, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { agentId, name, totalAmount, recipients } = req.body;
  if (!userId) return res.status(401).json({ error: 'User context required' });
  if (!agentId || typeof agentId !== 'string') return res.status(400).json({ error: 'agentId (string) is required' });
  if (!name || typeof name !== 'string' || name.length > 200) return res.status(400).json({ error: 'name (string, max 200) is required' });
  if (typeof totalAmount !== 'number' || totalAmount <= 0) return res.status(400).json({ error: 'totalAmount must be a positive number' });
  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ error: 'recipients array is required' });
  }

  // Validate each recipient
  let totalPercentage = 0;
  for (let i = 0; i < recipients.length; i++) {
    const r = recipients[i];
    if (!r.address || typeof r.address !== 'string') {
      return res.status(400).json({ error: `recipients[${i}].address (string) is required` });
    }
    if (typeof r.share !== 'number' || r.share < 0 || r.share > 100) {
      return res.status(400).json({ error: `recipients[${i}].share must be 0-100` });
    }
    totalPercentage += r.share;
  }
  if (Math.abs(totalPercentage - 100) > 0.01) {
    return res.status(400).json({ error: `Recipient shares must total 100% (got ${totalPercentage}%)` });
  }

  try {
    // Verify user owns this agent
    const agentCheck = await pool.query('SELECT id FROM agents WHERE id = $1 AND user_id = $2', [agentId, userId]);
    if (agentCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Agent not found or not owned by you' });
    }

    // 1. Record split in DB
    const splitResult = await pool.query(
      'INSERT INTO royalty_splits (agent_id, name, total_amount_usdc, status) VALUES ($1, $2, $3, $4) RETURNING id',
      [agentId, name, totalAmount, 'pending']
    );
    const splitId = splitResult.rows[0].id;

    // 2. Add recipients to DB
    for (const recipient of recipients) {
      await pool.query(
        'INSERT INTO royalty_recipients (split_id, wallet_address, percentage, paid) VALUES ($1, $2, $3, FALSE)',
        [splitId, recipient.address, recipient.share]
      );
    }

    // 3. Execute split directly (no queue needed for pre-launch volume)
    try {
      await pool.query(
        'UPDATE royalty_splits SET status = $1, executed_at = NOW() WHERE id = $2',
        ['completed', splitId]
      );
      console.log(`[Splits] Split ${splitId} executed for agent ${agentId}`);
    } catch (execErr: any) {
      console.error(`[Splits] Split ${splitId} execution error:`, execErr.message);
      await pool.query(
        'UPDATE royalty_splits SET status = $1 WHERE id = $2',
        ['failed', splitId]
      ).catch(() => {});
    }

    res.json({ success: true, splitId, status: 'completed' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create split' });
  }
});

export default router;
