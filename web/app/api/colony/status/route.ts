/**
 * Colony API — Proxies to soul service for real colony data
 *
 * GET /api/colony/status — Full colony tree + fitness ranking
 * GET /api/colony/node/:id — Single node status
 */

import { NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession';
import { SoulClient } from '@/lib/soul';
import { DEFAULT_SOUL_DASHBOARD_URL, DEFAULT_SOUL_SERVICE_URL } from '@/app/lib/openclaw-config';
import { createPublicClient, http, formatUnits, parseAbi, type Address } from 'viem';
import { tempo } from 'viem/chains';

const SOUL_URL = DEFAULT_SOUL_SERVICE_URL;
const SOUL_DASHBOARD_URL = DEFAULT_SOUL_DASHBOARD_URL;

// Known borg-0 public URL — always included as fallback even if env var is stale
const BORG_0_URL = 'https://borg-0-production.up.railway.app'

function normalizeColonyStatus(raw: unknown): 'active' | 'stale' | 'culling' {
  const value = String(raw ?? '').toLowerCase();
  if (['active', 'running', 'healthy', 'up', 'ready'].includes(value)) return 'active';
  if (['culling', 'failed', 'error'].includes(value)) return 'culling';
  return 'stale';
}

function getSoulCandidates() {
  const candidates = [SOUL_URL, BORG_0_URL]
    .map((value) => value?.trim())
    .filter(Boolean) as string[]

  return [...new Set(candidates)]
}

async function isUsableSoulHost(baseUrl: string) {
  try {
    const res = await fetch(`${baseUrl}/soul/status`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(4000),
      cache: 'no-store',
    })

    if (!res.ok) return false

    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) return false

    const payload = await res.json().catch(() => null)
    return Boolean(payload && typeof payload === 'object' && 'active' in payload)
  } catch {
    return false
  }
}

async function getWorkingSoulClient() {
  for (const candidate of getSoulCandidates()) {
    if (await isUsableSoulHost(candidate)) {
      return {
        soul: new SoulClient(candidate),
        serviceUrl: candidate,
      }
    }
  }

  throw new Error(`No healthy soul host found from: ${getSoulCandidates().join(', ')}`)
}

// Tempo RPC for real wallet balances
const tempoClient = createPublicClient({
  chain: tempo,
  transport: http('https://rpc.tempo.xyz'),
})

// ERC20 ABI
const ERC20_ABI = parseAbi([
  'function balanceOf(address) view returns (uint256)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
])

// Known tokens to check
const TOKENS = [
  { address: '0x20c000000000000000000000b9537d11c60e8b50' as Address, symbol: 'USDC.e' },
  { address: '0x20c0000000000000000000000000000000000000' as Address, symbol: 'pathUSD' },
  { address: '0x20c00000000000000000000014f22ca97301eb73' as Address, symbol: 'USDT0' },
]

/**
 * Fetch real Tempo balance for a wallet address
 */
async function getTempoBalance(address: Address): Promise<{ formatted: string; token: string }> {
  for (const token of TOKENS) {
    try {
      const balance = await tempoClient.readContract({
        address: token.address,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address],
      })
      if (balance > 0n) {
        return {
          formatted: formatUnits(balance, 6),
          token: token.symbol,
        }
      }
    } catch {
      continue
    }
  }
  return { formatted: '0.00', token: 'USDC.e' }
}

export async function GET(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'tree';

  try {
    const { soul, serviceUrl } = await getWorkingSoulClient()

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
        // identity may be null if the node hasn't registered yet — use safe fallbacks
        const identity = instanceInfo.identity ?? null;
        const childNodes = instanceInfo.children ?? [];
        const siblingNodes = siblings.siblings ?? [];

        const agents = [
          {
            id: identity?.instance_id ?? 'borg-root',
            name: instanceInfo.designation || 'Atlas Prime',
            generation: 1,
            fitness: Math.round((instanceInfo.fitness?.total ?? 0) * 100),
            specialization: 'general',
            children: instanceInfo.children_count,
            parent: identity?.parent_address ?? null,
            walletAddress: identity?.address ?? '0x0000000000000000000000000000000000000000',
            status: 'active' as const,
            createdAt: identity?.created_at ?? new Date().toISOString(),
            url: serviceUrl,
            endpoints: instanceInfo.endpoints ?? [],
            uptime: instanceInfo.uptime_seconds,
            version: instanceInfo.version,
          },
          ...childNodes.map((child) => ({
            id: child.instance_id,
            name: `Clone-${child.instance_id.slice(0, 8)}`,
            generation: 2,
            fitness: 50, // Unknown until we fetch child status
            specialization: 'general',
            children: 0,
            parent: identity?.address ?? null,
            walletAddress: child.address,
            status: normalizeColonyStatus(child.status),
            createdAt: new Date(child.created_at * 1000).toISOString(),
            url: child.url,
            endpoints: [],
            uptime: 0,
            version: 'unknown',
          })),
          ...siblingNodes
            .filter((s) => identity ? s.instance_id !== identity.instance_id : true)
            .map((sibling) => ({
              id: sibling.instance_id,
              name: `Peer-${sibling.instance_id.slice(0, 8)}`,
              generation: 1,
              fitness: 50,
              specialization: 'general',
              children: 0,
              parent: null,
              walletAddress: sibling.address,
              status: normalizeColonyStatus(sibling.status),
              createdAt: '',
              url: sibling.url,
              endpoints: sibling.endpoints ?? [],
              uptime: 0,
              version: 'unknown',
            })),
        ];

        return NextResponse.json({
          colony_size: agents.length,
          avg_fitness: Math.round(
            agents.reduce((sum, a) => sum + a.fitness, 0) / Math.max(agents.length, 1)
          ),
          fittest: agents.length > 0
            ? agents.reduce((best, a) => (a.fitness > best.fitness ? a : best), agents[0])
            : null,
          cull_queue: agents.filter((a) => a.fitness < 40).length,
          agents,
          root: {
            address: identity?.address ?? '0x0000000000000000000000000000000000000000',
            designation: instanceInfo.designation,
            dashboardUrl: SOUL_DASHBOARD_URL,
            serviceUrl,
            fitness: instanceInfo.fitness,
            wallet_balance: identity?.address
              ? await getTempoBalance(identity.address as Address)
              : { formatted: '0.00', token: 'USDC.e' },
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
        colony_size: 0,
        avg_fitness: 0,
        fittest: null,
        cull_queue: 0,
        agents: [],
        degraded: true,
        error: 'Soul service unavailable',
        detail: error.message,
        root: {
          address: '0x0000000000000000000000000000000000000000',
          designation: null,
          dashboardUrl: SOUL_DASHBOARD_URL,
          serviceUrl: SOUL_URL,
          fitness: null,
          wallet_balance: null,
          clone_available: false,
          clone_price: '0',
          soul: {
            active: false,
            dormant: false,
            total_cycles: 0,
            mode: 'unavailable',
            active_plan: null,
            free_energy: null,
            brain: null,
            transformer: null,
          },
          colony: null,
        },
      },
      { status: 200 }
    );
  }
}
