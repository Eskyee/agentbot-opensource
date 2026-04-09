/**
 * Metrics Synthesis — PAI Memory/Learning Pattern
 *
 * PAI Principle: "RAW events → LEARNING → SYNTHESIS → SIGNALS"
 *
 * Agentbot has raw metrics (container_metrics, model_metrics).
 * This utility synthesizes them into actionable patterns.
 *
 * Usage: Call from daily-brief endpoint or scheduler to detect trends.
 */

import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export interface TrendAnalysis {
  metric: string;
  direction: 'up' | 'down' | 'stable';
  changePercent: number;
  severity: 'info' | 'warning' | 'critical';
  message: string;
}

/**
 * Analyze model latency trends for an agent.
 * Compares last 24h average against previous 24h.
 */
export async function analyzeLatencyTrend(agentId?: string): Promise<TrendAnalysis | null> {
  try {
    const result = await pool.query<{
      current_avg: string;
      previous_avg: string;
    }>(`
      SELECT
        AVG(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN latency_ms END) as current_avg,
        AVG(CASE WHEN created_at >= NOW() - INTERVAL '48 hours' AND created_at < NOW() - INTERVAL '24 hours' THEN latency_ms END) as previous_avg
      FROM model_metrics
      WHERE ($1::text IS NULL OR agent_id = $1)
        AND created_at >= NOW() - INTERVAL '48 hours'
    `, [agentId || null]);

    if (!result.rows.length) return null;

    const current = parseFloat(result.rows[0].current_avg || '0');
    const previous = parseFloat(result.rows[0].previous_avg || '0');

    if (previous === 0) return null;

    const changePercent = ((current - previous) / previous) * 100;

    if (Math.abs(changePercent) < 10) {
      return {
        metric: 'model_latency',
        direction: 'stable',
        changePercent: Math.round(changePercent),
        severity: 'info',
        message: `Latency stable (${Math.round(current)}ms avg)`,
      };
    }

    return {
      metric: 'model_latency',
      direction: changePercent > 0 ? 'up' : 'down',
      changePercent: Math.round(changePercent),
      severity: changePercent > 50 ? 'critical' : changePercent > 25 ? 'warning' : 'info',
      message: `Latency ${changePercent > 0 ? 'increased' : 'decreased'} ${Math.abs(Math.round(changePercent))}% (${Math.round(previous)}ms → ${Math.round(current)}ms)`,
    };
  } catch (error: any) {
    console.warn('[Synthesis] Latency trend analysis failed:', error.message);
    return null;
  }
}

/**
 * Analyze error rate trends for an agent.
 */
export async function analyzeErrorTrend(agentId?: string): Promise<TrendAnalysis | null> {
  try {
    const result = await pool.query<{
      current_failures: string;
      current_total: string;
      previous_failures: string;
      previous_total: string;
    }>(`
      SELECT
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' AND success = false THEN 1 END) as current_failures,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as current_total,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '48 hours' AND created_at < NOW() - INTERVAL '24 hours' AND success = false THEN 1 END) as previous_failures,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '48 hours' AND created_at < NOW() - INTERVAL '24 hours' THEN 1 END) as previous_total
      FROM model_metrics
      WHERE ($1::text IS NULL OR agent_id = $1)
        AND created_at >= NOW() - INTERVAL '48 hours'
    `, [agentId || null]);

    if (!result.rows.length) return null;

    const row = result.rows[0];
    const currentTotal = parseInt(row.current_total);
    const previousTotal = parseInt(row.previous_total);

    if (currentTotal === 0 || previousTotal === 0) return null;

    const currentRate = (parseInt(row.current_failures) / currentTotal) * 100;
    const previousRate = (parseInt(row.previous_failures) / previousTotal) * 100;

    if (currentRate < 1 && previousRate < 1) {
      return {
        metric: 'error_rate',
        direction: 'stable',
        changePercent: 0,
        severity: 'info',
        message: `Error rate low (${currentRate.toFixed(1)}%)`,
      };
    }

    const changePercent = previousRate > 0 ? ((currentRate - previousRate) / previousRate) * 100 : (currentRate > 0 ? 100 : 0);

    return {
      metric: 'error_rate',
      direction: changePercent > 0 ? 'up' : 'down',
      changePercent: Math.round(changePercent),
      severity: currentRate > 10 ? 'critical' : currentRate > 5 ? 'warning' : 'info',
      message: `Error rate ${currentRate.toFixed(1)}% (${changePercent > 0 ? '+' : ''}${Math.round(changePercent)}% vs previous 24h)`,
    };
  } catch (error: any) {
    console.warn('[Synthesis] Error trend analysis failed:', error.message);
    return null;
  }
}

/**
 * Analyze container health trends.
 */
export async function analyzeContainerHealth(agentId?: string): Promise<TrendAnalysis | null> {
  try {
    const result = await pool.query<{
      current_avg_cpu: string;
      current_avg_mem: string;
      restart_count: string;
    }>(`
      SELECT
        AVG(cpu_percent) as current_avg_cpu,
        AVG(memory_percent) as current_avg_mem,
        COUNT(CASE WHEN event_type = 'restart' THEN 1 END) as restart_count
      FROM container_metrics
      WHERE ($1::text IS NULL OR agent_id = $1)
        AND created_at >= NOW() - INTERVAL '24 hours'
    `, [agentId || null]);

    if (!result.rows.length) return null;

    const row = result.rows[0];
    const cpu = parseFloat(row.current_avg_cpu || '0');
    const mem = parseFloat(row.current_avg_mem || '0');
    const restarts = parseInt(row.restart_count || '0');

    if (cpu > 90 || mem > 90) {
      return {
        metric: 'container_health',
        direction: 'up',
        changePercent: 0,
        severity: 'critical',
        message: `Container under pressure: CPU ${cpu.toFixed(0)}%, Memory ${mem.toFixed(0)}%, ${restarts} restarts in 24h`,
      };
    }

    if (restarts > 3) {
      return {
        metric: 'container_health',
        direction: 'up',
        changePercent: 0,
        severity: 'warning',
        message: `${restarts} container restarts in 24h (CPU ${cpu.toFixed(0)}%, Memory ${mem.toFixed(0)}%)`,
      };
    }

    return {
      metric: 'container_health',
      direction: 'stable',
      changePercent: 0,
      severity: 'info',
      message: `Container healthy: CPU ${cpu.toFixed(0)}%, Memory ${mem.toFixed(0)}%, ${restarts} restarts`,
    };
  } catch (error: any) {
    console.warn('[Synthesis] Container health analysis failed:', error.message);
    return null;
  }
}

/**
 * Run all synthesis analyses. Returns all trends, sorted by severity.
 */
export async function synthesizeAll(agentId?: string): Promise<TrendAnalysis[]> {
  const results = await Promise.all([
    analyzeLatencyTrend(agentId),
    analyzeErrorTrend(agentId),
    analyzeContainerHealth(agentId),
  ]);

  return results
    .filter((r): r is TrendAnalysis => r !== null)
    .sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2 };
      return order[a.severity] - order[b.severity];
    });
}
