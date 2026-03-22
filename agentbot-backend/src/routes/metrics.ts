/**
 * Metrics routes
 *
 * FIXES APPLIED:
 *  - Replaced exec() with spawn() via runCommand() from utils/index.ts
 *  - Historical metrics now query the container_metrics DB table instead of
 *    fabricating variance from a single live sample (Math.random() removed)
 *  - responseTime no longer uses Math.random()
 *  - authenticate middleware added to all three endpoints — previously any
 *    caller could query any userId's metrics without credentials
 */
import express, { Request, Response } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { authenticate } from '../middleware/auth';
import { runCommand } from '../utils';

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

interface MetricPoint {
  timestamp: string;
  cpu: number;
  memory: number;
  messages: number;
  errors: number;
}

interface HistoricalMetricsResponse {
  userId: string;
  timeRange: string;
  metrics: MetricPoint[];
  averages: {
    cpu: number;
    memory: number;
    messages: number;
    errors: number;
  };
}

interface PerformanceData {
  cpu: number;
  memory: number;
  errorRate: number;
  /** 0 = unknown; real instrumentation requires request-level timing middleware */
  responseTime: number;
}

interface DockerStats {
  cpu: number;
  memory: number;
}

/**
 * Sanitize userId to prevent path traversal and container name injection.
 * Mirrors sanitizeAgentId() in index.ts.
 */
const sanitizeUserId = (value: string): string => value.replace(/[^a-zA-Z0-9_-]/g, '');

/**
 * Fetch CPU% and memory% from a running Docker container via spawn (no shell).
 */
const getDockerStats = async (containerId: string): Promise<DockerStats | null> => {
  try {
    const { stdout } = await runCommand('docker', [
      'stats', containerId,
      '--format', '{{.CPUPerc}}|{{.MemUsage}}',
      '--no-stream',
    ], { timeout: 10000 });

    const parts = stdout.trim().split('|');
    if (parts.length < 2) return null;

    const cpu = parseFloat(parts[0].replace('%', '')) || 0;
    const memUsage = parts[1];
    const memMatch = memUsage.match(/(\d+\.?\d*)([A-Za-z]+) \/ (\d+\.?\d*)([A-Za-z]+)/);
    if (!memMatch) return { cpu, memory: 0 };

    const toMiB = (val: number, unit: string) =>
      val * (unit === 'GiB' || unit === 'GB' ? 1024 : 1);
    const used = toMiB(parseFloat(memMatch[1]), memMatch[2]);
    const total = toMiB(parseFloat(memMatch[3]), memMatch[4]);
    const memory = total > 0 ? (used / total) * 100 : 0;

    return { cpu, memory };
  } catch {
    return null;
  }
};

// Helper to calculate averages
const calculateAverages = (metrics: MetricPoint[]) => {
  if (metrics.length === 0) {
    return { cpu: 0, memory: 0, messages: 0, errors: 0 };
  }
  return {
    cpu: Math.round(metrics.reduce((sum, m) => sum + m.cpu, 0) / metrics.length),
    memory: Math.round(metrics.reduce((sum, m) => sum + m.memory, 0) / metrics.length),
    messages: Math.round(metrics.reduce((sum, m) => sum + m.messages, 0) / metrics.length),
    errors: Math.round(metrics.reduce((sum, m) => sum + m.errors, 0) / metrics.length),
  };
};

/**
 * Build historical metrics from the container_metrics DB table (real time-series).
 *
 * Falls back to a single live Docker sample if no DB history exists yet.
 * Math.random() fabrication has been removed entirely.
 */
const generateRealMetrics = async (userId: string, timeRange: string): Promise<MetricPoint[]> => {
  const cutoffMs =
    timeRange === '7d' ? 7 * 86400000 : timeRange === '30d' ? 30 * 86400000 : 86400000; // default 24h

  // 1. Query real time-series from DB (written by recordMetricSample in index.ts)
  if (process.env.DATABASE_URL) {
    try {
      const result = await pool.query<{
        bucket: string;
        cpu: string;
        mem: string;
        messages: string;
        errors: string;
      }>(
        `SELECT
           date_trunc('hour', sampled_at) AS bucket,
           AVG(cpu_percent)              AS cpu,
           AVG(mem_percent)              AS mem,
           SUM(message_count)            AS messages,
           SUM(error_count)              AS errors
         FROM container_metrics
         WHERE user_id = $1
           AND sampled_at >= NOW() - $2::interval
         GROUP BY bucket
         ORDER BY bucket ASC`,
        [userId, `${cutoffMs / 1000} seconds`]
      );

      if (result.rows.length > 0) {
        return result.rows.map((row) => ({
          timestamp: row.bucket,
          cpu: parseFloat(row.cpu) || 0,
          memory: parseFloat(row.mem) || 0,
          messages: parseInt(row.messages, 10) || 0,
          errors: parseInt(row.errors, 10) || 0,
        }));
      }
    } catch (err: any) {
      console.error(`[Metrics] DB query failed for ${userId}:`, err.message);
    }
  }

  // 2. Fallback: single live Docker sample (no fabricated history — just one point)
  const stats = await getDockerStats(`openclaw-${userId}`);
  if (stats) {
    return [{
      timestamp: new Date().toISOString(),
      cpu: stats.cpu,
      memory: stats.memory,
      messages: 0,
      errors: 0,
    }];
  }

  return [];
};

/**
 * GET /api/metrics/:userId/historical
 * Returns real time-series metrics from the DB.
 * Requires authentication.
 */
router.get('/:userId/historical', authenticate, async (req: Request, res: Response) => {
  const userId = sanitizeUserId(req.params.userId);
  const timeRange = (req.query.range as string) || '24h';

  try {
    const metrics = await generateRealMetrics(userId, timeRange);
    const averages = calculateAverages(metrics);
    res.json({ userId, timeRange, metrics, averages } as HistoricalMetricsResponse);
  } catch (error) {
    console.error('Error fetching historical metrics:', error);
    res.status(500).json({ error: 'Failed to fetch historical metrics' });
  }
});

/**
 * GET /api/metrics/:userId/performance
 * Returns live performance snapshot from Docker stats.
 * Requires authentication.
 */
router.get('/:userId/performance', authenticate, async (req: Request, res: Response) => {
  const userId = sanitizeUserId(req.params.userId);

  try {
    const performanceData: PerformanceData = { cpu: 0, memory: 0, errorRate: 0, responseTime: 0 };

    const stats = await getDockerStats(`openclaw-${userId}`);
    if (stats) {
      performanceData.cpu = stats.cpu;
      performanceData.memory = stats.memory;
    }

    // Error rate from log file (best-effort)
    try {
      const logFile = path.join(
        process.env.DATA_DIR || '/opt/agentbot/data',
        'logs',
        `${userId}.log`
      );
      const logContent = await fs.readFile(logFile, 'utf8').catch(() => '');
      const errorLines = (logContent.match(/\[error\]/g) || []).length;
      const totalLines = logContent.split('\n').length;
      performanceData.errorRate = totalLines > 0 ? (errorLines / totalLines) * 100 : 0;
    } catch {
      // non-critical — leave at 0
    }

    // responseTime: 0 = unknown until request-level instrumentation is added.
    // Math.random() fabrication removed.
    performanceData.responseTime = 0;

    res.json(performanceData);
  } catch (error) {
    console.error('Error fetching performance data:', error);
    res.status(500).json({ error: 'Failed to fetch performance data' });
  }
});

/**
 * GET /api/metrics/:userId/summary
 * Returns high-level business metrics summary.
 * Requires authentication.
 */
router.get('/:userId/summary', authenticate, async (req: Request, res: Response) => {
  const userId = sanitizeUserId(req.params.userId);

  try {
    // Live container health check (fire-and-forget — used for logging/future enrichment)
    getDockerStats(`openclaw-${userId}`).catch(() => undefined);

    const summary = {
      revenue: { month: '$0.00', total: '$0.00', change: '+0%' },
      bookings: { completed: 0, pending: 0, conversion: '0%' },
      fans: {
        total: 0,
        active: 0,
        growth: '+0%',
        segmentation: { superfans: 0, casual: 0, new: 0 },
      },
      streams: { monthlyListeners: 0, monthlyStreams: 0, growth: '+0%' },
      skills: { active: 0, total: 0, growth: '+0%' },
    };

    res.json(summary);
  } catch (error) {
    console.error('Error fetching music metrics summary:', error);
    res.status(500).json({ error: 'Failed to fetch metrics summary' });
  }
});

export default router;
