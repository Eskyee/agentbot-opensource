/**
 * Colony API — Proxies to soul service for real colony data
 *
 * GET /api/colony/status — Full colony tree + fitness ranking
 * GET /api/colony/node/:id — Single node status
 */

import { NextResponse } from 'next/server';
import { SoulClient } from '@/lib/soul';

const SOUL_URL = process.env.SOUL_SERVICE_URL || 'http://localhost:4023';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'tree';

  const soul = new SoulClient(SOUL_URL);

  try {
    switch (action) {
      case 'tree': {
        // Get root node info + siblings
        const [instanceInfo, siblings, soulStatus, colony] = await Promise.all([
          soul.getInstanceInfo(),
          soul.getSiblings(),
          soul.getStatus(),
          soul.getColonyStatus().catch(() => null),
        ]);

        // Build lineage tree from instance info + children
        const agents = [
          {
            id: instanceInfo.identity.instance_id,
            name: instanceInfo.designation || 'Atlas Prime',
            generation: 1,
            fitness: Math.round((instanceInfo.fitness?.total ?? 0) * 100),
            specialization: 'general',
            children: instanceInfo.children_count,
            parent: instanceInfo.identity.parent_address,
            walletAddress: instanceInfo.identity.address,
            status: 'active' as const,
            createdAt: instanceInfo.identity.created_at,
            url: SOUL_URL,
            endpoints: instanceInfo.endpoints,
            uptime: instanceInfo.uptime_seconds,
            version: instanceInfo.version,
          },
          ...instanceInfo.children.map((child) => ({
            id: child.instance_id,
            name: `Clone-${child.instance_id.slice(0, 8)}`,
            generation: 2,
            fitness: 50, // Unknown until we fetch child status
            specialization: 'general',
            children: 0,
            parent: instanceInfo.identity.address,
            walletAddress: child.address,
            status: child.status as 'active' | 'stale',
            createdAt: new Date(child.created_at * 1000).toISOString(),
            url: child.url,
            endpoints: [],
            uptime: 0,
            version: 'unknown',
          })),
          ...siblings.siblings
            .filter((s) => s.instance_id !== instanceInfo.identity.instance_id)
            .map((sibling) => ({
              id: sibling.instance_id,
              name: `Peer-${sibling.instance_id.slice(0, 8)}`,
              generation: 1,
              fitness: 50,
              specialization: 'general',
              children: 0,
              parent: null,
              walletAddress: sibling.address,
              status: sibling.status as 'active' | 'stale',
              createdAt: '',
              url: sibling.url,
              endpoints: sibling.endpoints,
              uptime: 0,
              version: 'unknown',
            })),
        ];

        return NextResponse.json({
          colony_size: agents.length,
          avg_fitness: Math.round(
            agents.reduce((sum, a) => sum + a.fitness, 0) / Math.max(agents.length, 1)
          ),
          fittest: agents.reduce((best, a) => (a.fitness > best.fitness ? a : best), agents[0]),
          cull_queue: agents.filter((a) => a.fitness < 40).length,
          agents,
          root: {
            address: instanceInfo.identity.address,
            designation: instanceInfo.designation,
            fitness: instanceInfo.fitness,
            wallet_balance: instanceInfo.wallet_balance,
            clone_available: instanceInfo.clone_available,
            clone_price: instanceInfo.clone_price,
            soul: {
              active: soulStatus.active,
              dormant: soulStatus.dormant,
              total_cycles: soulStatus.total_cycles,
              mode: soulStatus.mode,
              active_plan: soulStatus.active_plan,
              free_energy: soulStatus.free_energy,
              brain: soulStatus.brain,
              transformer: soulStatus.transformer,
            },
            colony,
          },
        });
      }

      case 'soul': {
        const status = await soul.getStatus();
        return NextResponse.json(status);
      }

      case 'diagnostics': {
        const diagnostics = await soul.getDiagnostics();
        return NextResponse.json(diagnostics);
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Soul service unavailable',
        detail: error.message,
        soul_url: SOUL_URL,
      },
      { status: 503 }
    );
  }
}
