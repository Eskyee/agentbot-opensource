/**
 * Colony API — Proxies to soul service for real colony data
 *
 * GET /api/colony/status — Full colony tree + fitness ranking
 * GET /api/colony/node/:id — Single node status
 */

import { NextResponse } from 'next/server';
import { getAuthSession } from '@/app/lib/getAuthSession';
import { prisma } from '@/app/lib/prisma';
import { SoulClient } from '@/lib/soul';
import { DEFAULT_SOUL_DASHBOARD_URL, DEFAULT_SOUL_SERVICE_URL } from '@/app/lib/openclaw-config';
import { createPublicClient, http, formatUnits, parseAbi, type Address } from 'viem';
import { tempo } from 'viem/chains';

const SOUL_URL = DEFAULT_SOUL_SERVICE_URL;
const SOUL_DASHBOARD_URL = DEFAULT_SOUL_DASHBOARD_URL;

// Known borg-0 public URL — always included as fallback even if env var is stale
const BORG_0_URL = 'https://borg-0-production-7139.up.railway.app';

function normalizeColonyStatus(raw: unknown): 'active' | 'stale' | 'culling' {
  const value = String(raw ?? '').toLowerCase();
  if (['active', 'running', 'healthy', 'up', 'ready'].includes(value)) return 'active';
  if (['culling', 'failed', 'error'].includes(value)) return 'culling';
  return 'stale';
}

function getSoulCandidates(userUrl?: string | null) {
  const candidates = [userUrl, SOUL_URL, BORG_0_URL]
    .map((value) => value?.trim())
    .filter(Boolean) as string[];

  return [...new Set(candidates)];
}

async function isUsableSoulHost(baseUrl: string) {
  try {
    const paths = [`${baseUrl}/soul/status`, `${baseUrl}/`]
    
    for (const path of paths) {
      try {
        const res = await fetch(path, {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(8000), // 8s is reasonable for a cloud-to-cloud probe
          cache: 'no-store',
        });

        // 502/503/504 are all signs the host is booting or overloaded
        if (res.status >= 502 && res.status <= 504) {
          console.warn(`[SoulProbe] Host ${baseUrl} returned ${res.status} (booting)`);
          return 'maybe';
        }

        if (!res.ok) continue;

        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) continue;

        const payload = await res.json().catch(() => null);
        if (payload && typeof payload === 'object' && ('active' in payload || 'fitness' in payload)) {
          return 'healthy';
        }
      } catch (err: any) {
        // Fix: Treat AbortError (timeout) as 'maybe' instead of 'down'
        if (err.name === 'TimeoutError' || err.name === 'AbortError') {
          console.warn(`[SoulProbe] Host ${baseUrl} timed out — treating as booting`);
          return 'maybe';
        }
        continue;
      }
    }
    return 'down';
  } catch {
    return 'down';
  }
}

async function getWorkingSoulClient(userUrl?: string | null) {
  const candidates = getSoulCandidates(userUrl);
  let fallback: { soul: SoulClient; serviceUrl: string } | null = null;

  for (const candidate of candidates) {
    const status = await isUsableSoulHost(candidate);
    
    if (status === 'healthy') {
      return {
        soul: new SoulClient(candidate),
        serviceUrl: candidate,
      };
    }
    
    // Remember the first 'maybe' (502) candidate as our best fallback
    if (status === 'maybe' && !fallback) {
      fallback = {
        soul: new SoulClient(candidate),
        serviceUrl: candidate,
      };
    }
  }

  if (fallback) {
    console.info(`[SoulProbe] No healthy hosts, falling back to booting host: ${fallback.serviceUrl}`);
    return fallback;
  }

  throw new Error(`No reachable soul host found from: ${candidates.join(', ')}`);
}

// Tempo RPC for real wallet balances
const tempoClient = createPublicClient({
  chain: tempo,
  transport: http('https://rpc.tempo.build'),
});

// ERC20 ABI
const ERC20_ABI = parseAbi([
  'function balanceOf(address) view returns (uint256)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
]);

// Known tokens to check
const TOKENS = [
  { address: '0x20c000000000000000000000b9537d11c60e8b50' as Address, symbol: 'USDC.e' },
  { address: '0x20c0000000000000000000000000000000000000' as Address, symbol: 'pathUSD' },
  { address: '0x20c00000000000000000000014f22ca97301eb73' as Address, symbol: 'USDT0' },
];

// Known claimed wallet address
const CLAIMED_WALLET = '0x44c93edd24005ae0b6c59748bd0af8b54a1cf240' as Address;

/**
 * Fetch real Tempo balance for a wallet address
 */
async function getTempoBalance(address: Address): Promise<{ formatted: string; token: string; extra_wallets?: any[] }> {
  const walletsToCheck = [address];
  if (address.toLowerCase() !== CLAIMED_WALLET.toLowerCase()) {
    walletsToCheck.push(CLAIMED_WALLET);
  }

  let primaryBalance = '0.00';
  let primaryToken = 'USDC.e';
  const extraWallets = [];

  for (const walletAddr of walletsToCheck) {
    for (const token of TOKENS) {
      try {
        const balance = await tempoClient.readContract({
          address: token.address,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [walletAddr],
        });
        
        const formatted = formatUnits(balance, 6);
        
        if (walletAddr === address) {
          if (balance > 0n || primaryBalance === '0.00') {
            primaryBalance = formatted;
            primaryToken = token.symbol;
          }
        } else {
          extraWallets.push({ address: walletAddr, formatted, token: token.symbol });
        }
      } catch {
        continue;
      }
    }
  }

  return { 
    formatted: primaryBalance, 
    token: primaryToken,
    extra_wallets: extraWallets
  };
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const body = await request.json().catch(() => ({}));

  let userUrl: string | null = null;
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { openclawUrl: true },
    });
    userUrl = dbUser?.openclawUrl ?? null;
  } catch { /* non-fatal */ }

  try {
    const { soul } = await getWorkingSoulClient(userUrl);
    switch (action) {
      case 'nudge': {
        const result = await soul.nudge(String(body.message ?? ''), Number(body.priority ?? 5));
        return NextResponse.json(result);
      }
      case 'model': {
        const result = await soul.setModel(body.model ?? null);
        return NextResponse.json(result);
      }
      case 'benchmark': {
        const result = await soul.triggerBenchmark();
        return NextResponse.json(result);
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}

export async function GET(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'tree';

  try {
    // 1. Resolve user's provisioned agent URL
    let userUrl: string | null = null;
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { openclawUrl: true },
      });
      userUrl = dbUser?.openclawUrl ?? null;
    } catch (err) {
      console.warn('[Colony/Status] Failed to look up user openclawUrl:', err);
    }

    // 2. Connect to the best available soul host (prioritizing user's agent)
    const { soul, serviceUrl } = await getWorkingSoulClient(userUrl);

    switch (action) {
      case 'tree': {
        // REAL DATA BRIDGE: Fetch from both singular and plural tables
        const [instanceInfo, siblings, soulStatus, colony, prismaAgents, backendAgents] = await Promise.all([
          soul.getInstanceInfo(),
          soul.getSiblings(),
          soul.getStatus(),
          soul.getColonyStatus().catch(() => null),
          prisma.agent.findMany({ where: { status: { not: 'template' } }, select: { id: true, name: true, websocketUrl: true, status: true } }),
          prisma.$queryRaw<any[]>`SELECT id, name, status, config FROM agents WHERE status != 'template'`.catch(() => [])
        ]);

        const identity = instanceInfo.identity ?? null;
        
        // Merge strategy: Start with active soul nodes, then add database agents not seen in the soul network
        const agents: any[] = [
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
          }
        ];

        // Add child nodes
        instanceInfo.children?.forEach((child: any) => {
          agents.push({
            id: child.instance_id,
            name: `Clone-${child.instance_id.slice(0, 8)}`,
            generation: 2,
            fitness: 50,
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
          });
        });

        // Bridge in missing agents from database (the "Real Data" request)
        const allDbAgents = [...prismaAgents, ...backendAgents];
        allDbAgents.forEach((dbA: any) => {
           // Skip if already in the list via soul discovery
           if (agents.some(a => a.id === dbA.id || a.name === dbA.name)) return;

           const url = dbA.websocketUrl || dbA.config?.runtimeUrl || null;
           agents.push({
             id: dbA.id.toString(),
             name: dbA.name,
             generation: 1,
             fitness: dbA.status === 'active' ? 100 : 0,
             specialization: 'factory',
             children: 0,
             parent: null,
             walletAddress: dbA.config?.walletAddress || '0x...',
             status: dbA.status === 'active' ? 'active' : 'stale',
             createdAt: dbA.createdAt || new Date().toISOString(),
             url,
             endpoints: [],
             uptime: 0,
             version: '2026.4.23',
           });
        });

        return NextResponse.json({
          colony_size: agents.length,
          avg_fitness: Math.round(
            agents.reduce((sum, a) => sum + a.fitness, 0) / Math.max(agents.length, 1)
          ),
          fittest:
            agents.length > 0
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
        return NextResponse.json({
          ...status,
          soulUrl: serviceUrl,
        });
      }

      case 'diagnostics': {
        const diagnostics = await soul.getDiagnostics();
        return NextResponse.json(diagnostics);
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error: any) {
    // GHOST MODE: Ultimate fallback resilience.
    // If all hosts are unreachable, we return a simulated offline state 
    // instead of a terminal 503 error. This prevents UI crashes.
    console.warn(`[ColonyAPI] All hosts unreachable, entering Ghost Mode for action: ${action}`);

    if (action === 'soul') {
      return NextResponse.json({
        active: false,
        dormant: true,
        total_cycles: 0,
        mode: 'unavailable',
        fitness: { total: 0, delta: 0 },
        soulUrl: SOUL_URL,
        degraded: true,
        error: error.message
      });
    }

    if (action === 'diagnostics') {
      return NextResponse.json({
        ok: false,
        status: 'unavailable',
        checks: [],
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }

    // Default 'tree' fallback (already returns 200)
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
          address: CLAIMED_WALLET,
          designation: 'Ghost Mode',
          dashboardUrl: SOUL_DASHBOARD_URL,
          serviceUrl: SOUL_URL,
          fitness: { total: 0, delta: 0 },
          wallet_balance: await getTempoBalance(CLAIMED_WALLET),
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
