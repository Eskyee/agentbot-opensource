export interface ConstellationNode {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'error' | 'offline' | string;
  role: 'orchestrator' | 'worker' | 'specialist' | string;
  modelPrimary?: string;
  tokensUsed24h?: number;
  costUSD24h?: number;
  errorCount24h?: number;
  lastSeenAt?: string;
  provider?: string;
  modelFallbacks?: string[];
  contextPercent?: number;
  lastError?: string;
  recentTaskCount?: number;
  meta?: {
    group?: string;
    [key: string]: unknown;
  };
}

export interface ConstellationEdge {
  id: string;
  from: string;
  to: string;
  strength?: number;
  ratePerMin?: number;
}
