import express, { Request, Response } from 'express';
import { MissionControlService } from './services/mission-control';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Middleware to verify internal API key (Atlas/Frontend only)
const authenticate = (req: Request, res: Response, next: any) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ') || auth.substring(7) !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

/**
 * --- MISSION CONTROL API ---
 */

// Get agent fleet graph (Nodes + Edges)
router.get('/fleet/graph', authenticate, async (req: Request, res: Response) => {
  const { userId } = req.query;
  try {
    const graph = await MissionControlService.getFleetGraph(Number(userId));
    res.json(graph);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get real-time execution traces
router.get('/fleet/traces', authenticate, async (req: Request, res: Response) => {
  const { userId } = req.query;
  try {
    const traces = await MissionControlService.getTraces(Number(userId));
    res.json(traces);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get cost attribution metrics
router.get('/fleet/costs', authenticate, async (req: Request, res: Response) => {
  const { userId } = req.query;
  try {
    const costs = await MissionControlService.getCostMetrics(Number(userId));
    res.json(costs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get talent bookings
router.get('/fleet/bookings', authenticate, async (req: Request, res: Response) => {
  const { userId } = req.query;
  try {
    const result = await MissionControlService.getBookings(Number(userId));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
