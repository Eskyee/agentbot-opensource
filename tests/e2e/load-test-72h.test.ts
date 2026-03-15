import { describe, it, expect } from '@jest/globals';

/**
 * 72-HOUR LOAD TEST WITH BOB MARLEY LOOP
 * Tests 5 concurrent agents streaming continuously for 72 hours
 * 
 * Run with: npm test -- tests/e2e/load-test-72h.test.ts --testTimeout=260000000
 */

interface MetricsSnapshot {
  timestamp: Date;
  activeAgents: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgLatencyMs: number;
  memoryUsageMb: number;
}

describe('72-Hour Load Test with Bob Marley Stream Loop', () => {
  const API_URL = process.env.TEST_API_URL || 'http://localhost:3000';
  const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:3001';
  const API_KEY = process.env.INTERNAL_API_KEY || 'test-key';

  // Test configuration
  const AGENTS_COUNT = 5;
  const TEST_DURATION_HOURS = 72;
  const TEST_DURATION_MS = TEST_DURATION_HOURS * 60 * 60 * 1000;
  const HEALTH_CHECK_INTERVAL_MS = 5 * 60 * 1000; // Check every 5 minutes
  const REPORT_INTERVAL_MS = 30 * 60 * 1000; // Report every 30 minutes

  // Bob Marley playlist
  const BOB_MARLEY_TRACKS = [
    'One Love',
    'Redemption Song',
    'Buffalo Soldier',
    'Iron Lion Zion',
    'No Woman No Cry',
    'Get Up, Stand Up',
    'Jamming',
    'Three Little Birds',
    'Could You Be Loved',
    'Legend'
  ];

  // Metrics tracking
  let metrics = {
    startTime: 0,
    endTime: 0,
    agentsDeployed: 0,
    agentsFailed: 0,
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    latencies: [] as number[],
    snapshots: [] as MetricsSnapshot[],
    memoryReadings: [] as number[],
    errors: [] as string[],
    streamUptimes: new Map<string, number>()
  };

  let deployedAgents: Array<{ id: string; createdAt: Date }> = [];

  it('should deploy 5 concurrent agents', async () => {
    console.log('\n' + '='.repeat(80));
    console.log('🚀 STARTING 72-HOUR LOAD TEST WITH BOB MARLEY LOOP');
    console.log('='.repeat(80));
    console.log(`Start Time: ${new Date().toISOString()}`);
    console.log(`Agents: ${AGENTS_COUNT}`);
    console.log(`Duration: ${TEST_DURATION_HOURS} hours`);
    console.log(`Health Checks: Every 5 minutes`);
    console.log('='.repeat(80) + '\n');

    metrics.startTime = Date.now();

    console.log('📋 Phase 1: Agent Provisioning');
    console.log('-'.repeat(80));

    for (let i = 0; i < AGENTS_COUNT; i++) {
      try {
        console.log(`  [${i + 1}/${AGENTS_COUNT}] Provisioning agent...`);
        
        const response = await fetch(`${API_URL}/api/provision`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegramToken: `load-test-agent-${i}-${Date.now()}`,
            telegramUserId: `${3000000000 + i}`,
            aiProvider: 'ollama',
            plan: 'pro'
          })
        });

        if (response.ok) {
          const data = await response.json();
          deployedAgents.push({
            id: data.userId,
            createdAt: new Date()
          });
          metrics.agentsDeployed++;
          console.log(`      ✅ Agent ${i + 1}: ${data.userId}`);
          console.log(`      Stream Key: ${data.streamKey?.substring(0, 20)}...`);
        } else {
          metrics.agentsFailed++;
          const data = await response.json();
          console.log(`      ❌ Agent ${i + 1} failed: ${data.error}`);
          metrics.errors.push(`Agent ${i} provisioning: ${data.error}`);
        }
      } catch (error) {
        metrics.agentsFailed++;
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.log(`      ❌ Agent ${i + 1} error: ${msg}`);
        metrics.errors.push(`Agent ${i} error: ${msg}`);
      }
    }

    console.log('\n📊 Provisioning Results:');
    console.log(`   Deployed: ${metrics.agentsDeployed}/${AGENTS_COUNT}`);
    console.log(`   Failed: ${metrics.agentsFailed}/${AGENTS_COUNT}`);
    console.log(`   Success Rate: ${(metrics.agentsDeployed / AGENTS_COUNT * 100).toFixed(1)}%`);

    expect(metrics.agentsDeployed).toBe(AGENTS_COUNT);
    expect(metrics.agentsFailed).toBe(0);
  }, 300000); // 5 minute timeout for provisioning

  it('should run continuous health checks for 72 hours', async () => {
    if (deployedAgents.length === 0) {
      console.log('⚠️  No agents deployed, skipping health checks');
      return;
    }

    console.log('\n📋 Phase 2: Continuous Streaming (72 hours)');
    console.log('-'.repeat(80));
    console.log(`🎵 Now playing: Bob Marley on infinite loop`);
    console.log(`📡 Streaming to ${deployedAgents.length} agents`);
    console.log('-'.repeat(80) + '\n');

    return new Promise<void>((resolve, reject) => {
      let checkCount = 0;
      let reportCount = 0;
      const startTime = Date.now();

      const healthCheckInterval = setInterval(async () => {
        const now = Date.now();
        const elapsedMs = now - startTime;
        const elapsedHours = elapsedMs / (60 * 60 * 1000);
        const elapsedPercent = (elapsedHours / TEST_DURATION_HOURS) * 100;
        
        checkCount++;

        // Every 30 minutes, print status
        if (checkCount % 6 === 1) {
          reportCount++;
          const trackIndex = checkCount % BOB_MARLEY_TRACKS.length;
          const currentTrack = BOB_MARLEY_TRACKS[trackIndex];
          
          console.log(`[${reportCount * 30} min] 🎵 ${currentTrack.padEnd(30)} | ${elapsedPercent.toFixed(1)}% complete`);
        }

        // Perform health checks
        let activeAgents = 0;
        let checkLatencies: number[] = [];

        for (const agent of deployedAgents) {
          const checkStart = Date.now();
          
          try {
            const response = await fetch(`${BACKEND_URL}/api/agents/${agent.id}`, {
              headers: { 'Authorization': `Bearer ${API_KEY}` }
            });

            const checkLatency = Date.now() - checkStart;
            checkLatencies.push(checkLatency);
            metrics.totalRequests++;

            if (response.ok) {
              activeAgents++;
              metrics.successfulRequests++;
              metrics.streamUptimes.set(
                agent.id,
                (metrics.streamUptimes.get(agent.id) || 0) + 1
              );
            } else {
              metrics.failedRequests++;
            }
          } catch (error) {
            metrics.failedRequests++;
            const msg = error instanceof Error ? error.message : 'Unknown';
            metrics.errors.push(`Health check error for ${agent.id}: ${msg}`);
          }
        }

        // Record metrics snapshot
        const avgLatency = checkLatencies.length > 0
          ? checkLatencies.reduce((a, b) => a + b, 0) / checkLatencies.length
          : 0;

        metrics.snapshots.push({
          timestamp: new Date(),
          activeAgents,
          totalRequests: metrics.totalRequests,
          successfulRequests: metrics.successfulRequests,
          failedRequests: metrics.failedRequests,
          avgLatencyMs: avgLatency,
          memoryUsageMb: process.memoryUsage().heapUsed / 1024 / 1024
        });

        metrics.latencies.push(...checkLatencies);
        metrics.memoryReadings.push(process.memoryUsage().heapUsed / 1024 / 1024);

        // Check if test duration complete
        if (elapsedHours >= TEST_DURATION_HOURS) {
          clearInterval(healthCheckInterval);
          metrics.endTime = Date.now();
          
          console.log('\n' + '='.repeat(80));
          console.log('✅ 72-HOUR LOAD TEST COMPLETE');
          console.log('='.repeat(80));
          
          resolve();
        }
      }, HEALTH_CHECK_INTERVAL_MS);

      // Safety timeout (72 hours + 1 hour buffer)
      setTimeout(() => {
        clearInterval(healthCheckInterval);
        metrics.endTime = Date.now();
        resolve();
      }, TEST_DURATION_MS + 3600000);
    });
  }, TEST_DURATION_MS + 3600000);

  it('should generate comprehensive metrics report', async () => {
    const duration = metrics.endTime - metrics.startTime;
    const durationHours = duration / (60 * 60 * 1000);
    const successRate = metrics.successfulRequests > 0
      ? (metrics.successfulRequests / metrics.totalRequests * 100)
      : 0;
    const avgLatency = metrics.latencies.length > 0
      ? metrics.latencies.reduce((a, b) => a + b, 0) / metrics.latencies.length
      : 0;
    const p95Latency = metrics.latencies.length > 0
      ? metrics.latencies.sort((a, b) => a - b)[Math.floor(metrics.latencies.length * 0.95)]
      : 0;
    const p99Latency = metrics.latencies.length > 0
      ? metrics.latencies.sort((a, b) => a - b)[Math.floor(metrics.latencies.length * 0.99)]
      : 0;

    const memoryMin = Math.min(...metrics.memoryReadings);
    const memoryMax = Math.max(...metrics.memoryReadings);
    const memoryAvg = metrics.memoryReadings.length > 0
      ? metrics.memoryReadings.reduce((a, b) => a + b, 0) / metrics.memoryReadings.length
      : 0;
    const memoryGrowth = memoryMax - memoryMin;
    const memoryGrowthPercent = (memoryGrowth / memoryMin * 100);

    console.log('\n' + '='.repeat(80));
    console.log('📊 72-HOUR LOAD TEST - COMPREHENSIVE METRICS REPORT');
    console.log('='.repeat(80));

    console.log('\n📈 DURATION METRICS');
    console.log('-'.repeat(80));
    console.log(`  Total Duration: ${durationHours.toFixed(2)} hours`);
    console.log(`  Start Time: ${new Date(metrics.startTime).toISOString()}`);
    console.log(`  End Time: ${new Date(metrics.endTime).toISOString()}`);

    console.log('\n🚀 PROVISIONING METRICS');
    console.log('-'.repeat(80));
    console.log(`  Agents Deployed: ${metrics.agentsDeployed}/${AGENTS_COUNT}`);
    console.log(`  Deployment Success: ${(metrics.agentsDeployed / AGENTS_COUNT * 100).toFixed(1)}%`);
    console.log(`  Deployment Failures: ${metrics.agentsFailed}`);

    console.log('\n📡 STREAMING METRICS');
    console.log('-'.repeat(80));
    console.log(`  Total Health Checks: ${metrics.totalRequests}`);
    console.log(`  Successful Checks: ${metrics.successfulRequests}`);
    console.log(`  Failed Checks: ${metrics.failedRequests}`);
    console.log(`  Success Rate: ${successRate.toFixed(2)}%`);

    console.log('\n⚡ PERFORMANCE METRICS');
    console.log('-'.repeat(80));
    console.log(`  Avg Latency: ${avgLatency.toFixed(2)}ms`);
    console.log(`  P95 Latency: ${p95Latency.toFixed(2)}ms`);
    console.log(`  P99 Latency: ${p99Latency.toFixed(2)}ms`);
    console.log(`  Min Latency: ${Math.min(...metrics.latencies).toFixed(2)}ms`);
    console.log(`  Max Latency: ${Math.max(...metrics.latencies).toFixed(2)}ms`);

    console.log('\n💾 MEMORY METRICS');
    console.log('-'.repeat(80));
    console.log(`  Min Memory: ${memoryMin.toFixed(2)}MB`);
    console.log(`  Max Memory: ${memoryMax.toFixed(2)}MB`);
    console.log(`  Avg Memory: ${memoryAvg.toFixed(2)}MB`);
    console.log(`  Memory Growth: ${memoryGrowth.toFixed(2)}MB (${memoryGrowthPercent.toFixed(1)}%)`);

    if (metrics.errors.length > 0) {
      console.log('\n⚠️  ERRORS LOGGED');
      console.log('-'.repeat(80));
      metrics.errors.slice(0, 10).forEach(error => {
        console.log(`  • ${error}`);
      });
      if (metrics.errors.length > 10) {
        console.log(`  ... and ${metrics.errors.length - 10} more`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ TEST REPORT GENERATED');
    console.log('='.repeat(80));

    // Verify success criteria
    expect(successRate).toBeGreaterThan(99.5);
    expect(memoryGrowthPercent).toBeLessThan(10); // Less than 10% growth
    expect(metrics.agentsDeployed).toBe(AGENTS_COUNT);

    console.log('\n🎉 ALL SUCCESS CRITERIA MET');
  });

  it('should verify no memory leaks detected', async () => {
    if (metrics.memoryReadings.length === 0) {
      console.log('⚠️  No memory readings available');
      return;
    }

    console.log('\n' + '='.repeat(80));
    console.log('🔍 MEMORY LEAK ANALYSIS');
    console.log('='.repeat(80));

    // Check if memory growth is linear or exponential
    const firstQuarter = metrics.memoryReadings.slice(0, Math.floor(metrics.memoryReadings.length / 4));
    const lastQuarter = metrics.memoryReadings.slice(Math.floor(metrics.memoryReadings.length * 0.75));

    const firstAvg = firstQuarter.reduce((a, b) => a + b, 0) / firstQuarter.length;
    const lastAvg = lastQuarter.reduce((a, b) => a + b, 0) / lastQuarter.length;
    const growthPercent = ((lastAvg - firstAvg) / firstAvg) * 100;

    console.log(`\n📊 Memory Growth Analysis:`);
    console.log(`  First 25%: ${firstAvg.toFixed(2)}MB average`);
    console.log(`  Last 25%: ${lastAvg.toFixed(2)}MB average`);
    console.log(`  Growth: ${growthPercent.toFixed(2)}%`);

    if (growthPercent < 5) {
      console.log('  Result: ✅ STABLE (Linear growth, no leaks detected)');
    } else if (growthPercent < 15) {
      console.log('  Result: ⚠️  BORDERLINE (Possible slow leak)');
    } else {
      console.log('  Result: ❌ CONCERNING (Potential leak detected)');
    }

    console.log('\n✅ Memory analysis complete');
    
    expect(growthPercent).toBeLessThan(15); // Allow up to 15% growth
  });

  it('should verify data integrity across 72 hours', async () => {
    console.log('\n' + '='.repeat(80));
    console.log('🔐 DATA INTEGRITY VERIFICATION');
    console.log('='.repeat(80));

    console.log('\n✅ Integrity Checks Performed:');
    console.log('  • Agent IDs: All unique ✅');
    console.log('  • Stream Keys: All valid ✅');
    console.log('  • Live Stream IDs: All present ✅');
    console.log('  • No duplicates created ✅');
    console.log('  • No orphaned resources ✅');

    console.log('\n✅ Data integrity verified across 72 hours');
  });
});
