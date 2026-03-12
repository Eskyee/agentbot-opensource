import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import { WalletService } from './services/wallet';
import { AgentBusService, AgentMessage } from './services/bus';
import { OllamaService } from './services/ollama'; // Import Ollama service
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Middleware to verify internal API key (Atlas/Frontend only)
const authenticate = (req: Request, res: Response, next: any) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ') || auth.substring(7) !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

/**
 * --- OLLAMA MODEL MARKETPLACE ---
 */

// List models already installed on the instance
router.get('/models/installed', authenticate, async (req: Request, res: Response) => {
  try {
    const models = await OllamaService.getLocalModels();
    res.json(models);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// List official library of recommended models
router.get('/models/library', authenticate, (req: Request, res: Response) => {
  const library = OllamaService.getOfficialLibrary();
  res.json(library);
});

// Trigger a pull of a new model into the instance
router.post('/models/pull', authenticate, async (req: Request, res: Response) => {
  const { modelName } = req.body;
  if (!modelName) {
    return res.status(400).json({ error: 'Model name is required' });
  }

  try {
    // Note: This starts the pull. For production, consider using a worker/queue 
    // since pulls can take minutes. For now, this is the direct integration.
    await OllamaService.pullModel(modelName);
    res.json({ success: true, message: `Started pull for ${modelName}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

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

  // 2. Queue or Deliver
  try {
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

// Create and execute a royalty split
router.post('/splits', authenticate, async (req: Request, res: Response) => {
  const { userId, agentId, fromAddress, name, totalAmount, recipients } = req.body;
  // recipients: [{ address: string, share: number }]

  try {
    // 1. Record split in DB
    const splitResult = await pool.query(
      'INSERT INTO royalty_splits (agent_id, name, total_amount_usdc, status) VALUES ($1, $2, $3, $4) RETURNING id',
      [agentId, name, totalAmount, 'pending']
    );
    const splitId = splitResult.rows[0].id;

    // 2. Process transfers for each recipient
    const txHashes = [];
    for (const recipient of recipients) {
      const amount = (totalAmount * recipient.share) / 100;
      const txHash = await WalletService.transferUSDC(userId, fromAddress, recipient.address, amount);
      txHashes.push(txHash);

      await pool.query(
        'INSERT INTO royalty_recipients (split_id, wallet_address, share_percentage, amount_usdc, paid, paid_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)',
        [splitId, recipient.address, recipient.share, amount, true]
      );
    }

    // 3. Mark split as completed
    await pool.query('UPDATE royalty_splits SET status = $1 WHERE id = $2', ['completed', splitId]);

    res.json({ success: true, splitId, txHashes });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
