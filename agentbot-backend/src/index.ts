import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.INTERNAL_API_KEY || 'dev-key-change-in-production';

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://startclaw.com'],
  credentials: true,
}));
app.use(express.json());

// Auth middleware
const authenticate = (req: Request, res: Response, next: any) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = auth.substring(7);
  if (token !== API_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Agents endpoints
app.get('/api/agents', authenticate, (req: Request, res: Response) => {
  // TODO: Query database for agents
  res.json([
    { id: '1', name: 'Sample Agent', status: 'active', created: new Date() }
  ]);
});

app.post('/api/agents', authenticate, (req: Request, res: Response) => {
  const { name, config } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name required' });
  }
  // TODO: Create agent in database and deploy
  res.status(201).json({ id: 'new-agent-id', name, status: 'deploying' });
});

app.get('/api/agents/:id', authenticate, (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: Query database
  res.json({ id, name: 'Agent Name', status: 'active' });
});

app.put('/api/agents/:id', authenticate, (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: Update agent
  res.json({ id, message: 'Agent updated' });
});

app.delete('/api/agents/:id', authenticate, (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: Delete agent
  res.json({ id, message: 'Agent deleted' });
});

// Deployments endpoint
app.post('/api/deployments', authenticate, (req: Request, res: Response) => {
  const { agentId, version } = req.body;
  // TODO: Create deployment, generate subdomain, deploy container
  const subdomain = `${agentId}.agents.startclaw.com`;
  res.status(201).json({
    id: 'deploy-id',
    agentId,
    subdomain,
    url: `https://${subdomain}`,
    status: 'deploying'
  });
});

app.listen(PORT, () => {
  console.log(`🦞 StartClaw API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;
