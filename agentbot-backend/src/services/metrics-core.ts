/**
 * Shared metrics helpers
 *
 * Consolidates duplicated metric functions from index.ts and routes/metrics.ts.
 * Used by both the metrics router and inline endpoints in index.ts.
 */
import { Pool } from 'pg';
import { runCommand } from '../utils';

const metricsPool = new Pool({ connectionString: process.env.DATABASE_URL });

export interface MetricPoint {
  timestamp: string;
  cpu: number;
  memory: number;
  messages: number;
  errors: number;
}

export interface PerformanceData {
  cpu: number;
  memory: number;
  errorRate: number;
  responseTime: number;
}

/**
 * Record a Docker stats sample for a container into the DB.
 * Fire-and-forget — never blocks the caller.
 */
export async function recordMetricSample(userId: string): Promise<{ cpu: number; mem: number } | null> {
  const containerName = `openclaw-${userId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  try {
    const { stdout } = await runCommand('docker', [
      'stats', containerName, '--format', '{{.CPUPerc}}|{{.MemUsage}}', '--no-stream',
    ]);
    const parts = stdout.trim().split('|');
    if (parts.length < 2) return null;

    const cpu = parseFloat(parts[0].replace('%', '')) || 0;
    let mem = 0;
    const memMatch = parts[1].match(/(\d+\.?\d*)([A-Za-z]+) \/ (\d+\.?\d*)([A-Za-z]+)/);
    if (memMatch) {
      const used = parseFloat(memMatch[1]) * (memMatch[2].startsWith('G') ? 1024 : 1);
      const total = parseFloat(memMatch[3]) * (memMatch[4].startsWith('G') ? 1024 : 1);
      mem = total > 0 ? (used / total) * 100 : 0;
    }

    if (process.env.DATABASE_URL) {
      metricsPool.query(
        `INSERT INTO container_metrics (user_id, container_name, cpu_percent, mem_percent, sampled_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [userId, containerName, cpu, mem]
      ).catch((err: Error) => console.error('[Metrics] Failed to write sample:', err.message));
    }

    return { cpu, mem };
  } catch { return null; }
}

/**
 * Get real time-series metrics from DB, falling back to a single live sample.
 */
export async function generateRealMetrics(userId: string, timeRange: string): Promise<MetricPoint[]> {
  const hours = timeRange === '7d' ? 168 : timeRange === '30d' ? 720 : 24;

  await recordMetricSample(userId);

  if (process.env.DATABASE_URL) {
    try {
      const result = await metricsPool.query(
        `SELECT
           date_trunc('hour', sampled_at) AS timestamp,
           AVG(cpu_percent)::numeric(5,2) AS cpu,
           AVG(mem_percent)::numeric(5,2) AS memory,
           SUM(message_count) AS messages,
           SUM(error_count) AS errors
         FROM container_metrics
         WHERE user_id = $1
           AND sampled_at >= NOW() - ($2 || ' hours')::interval
         GROUP BY date_trunc('hour', sampled_at)
         ORDER BY timestamp ASC`,
        [userId, hours]
      );
      if (result.rows.length > 0) {
        return result.rows.map((r: Record<string, string>) => ({
          timestamp: r.timestamp,
          cpu: parseFloat(r.cpu) || 0,
          memory: parseFloat(r.memory) || 0,
          messages: parseInt(r.messages, 10) || 0,
          errors: parseInt(r.errors, 10) || 0,
        }));
      }
    } catch (err: unknown) {
      console.error('[Metrics] DB query failed, falling back to live sample:', (err as Error).message);
    }
  }

  const live = await recordMetricSample(userId);
  if (!live) return [];
  return [{ timestamp: new Date().toISOString(), cpu: live.cpu, memory: live.mem, messages: 0, errors: 0 }];
}

/**
 * Calculate averages from a set of metric points.
 */
export function calculateAverages(metrics: MetricPoint[]): MetricPoint {
  if (metrics.length === 0) return { cpu: 0, memory: 0, messages: 0, errors: 0, timestamp: '' };
  return {
    cpu: Math.round(metrics.reduce((s, m) => s + m.cpu, 0) / metrics.length),
    memory: Math.round(metrics.reduce((s, m) => s + m.memory, 0) / metrics.length),
    messages: Math.round(metrics.reduce((s, m) => s + m.messages, 0) / metrics.length),
    errors: Math.round(metrics.reduce((s, m) => s + m.errors, 0) / metrics.length),
    timestamp: '',
  };
}

/**
 * Get live performance data for a container.
 */
export async function getPerformanceData(userId: string): Promise<PerformanceData> {
  const result: PerformanceData = { cpu: 0, memory: 0, errorRate: 0, responseTime: 0 };
  try {
    const containerName = `openclaw-${userId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
    const { stdout } = await runCommand('docker', [
      'stats', containerName, '--format', '{{.CPUPerc}}|{{.MemUsage}}', '--no-stream'
    ]);
    const parts = stdout.trim().split('|');
    if (parts.length >= 2) {
      result.cpu = parseFloat(parts[0].replace('%', '')) || 0;
      const memMatch = parts[1].match(/(\d+\.?\d*)([A-Za-z]+) \/ (\d+\.?\d*)([A-Za-z]+)/);
      if (memMatch) {
        const used = parseFloat(memMatch[1]) * (memMatch[2].startsWith('G') ? 1024 : 1);
        const total = parseFloat(memMatch[3]) * (memMatch[4].startsWith('G') ? 1024 : 1);
        result.memory = total > 0 ? (used / total) * 100 : 0;
      }
    }
  } catch { /* container may not exist */ }
  return result;
}
