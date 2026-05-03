import { NextResponse, NextRequest } from 'next/server'

const MOCK_AGENTS: Record<string, Record<string, unknown>> = {
  'settler-12': {
    node: {
      id: 'settler-12',
      did: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
      status: 'running',
      region: 'fra-1',
      task: 'exec:swap',
      cpu: 42,
      mem: 61,
      p50: 87,
      model: 'mimo-v2-pro',
    },
    identity: {
      did: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
      algo: 'ed25519',
      issued: '2026-04-19T14:08:21Z',
      lastSig: '14ms ago',
      guard: 'SignatureGuard',
      rotation: { inDays: 14, auto: true },
      facts: {
        count: 2148,
        leaf: '0x9c1f…ae72',
        lag: 41,
        lastCommit: 'tx/L-7f3a…',
      },
    },
    skills: [
      { name: 'bankr.swap', version: 'v2.1.0', type: 'exec', calls24h: 1284 },
      { name: 'bankr.send', version: 'v1.4.2', type: 'exec', calls24h: 402 },
      { name: 'bridge.relay', version: 'v0.9.7', type: 'net', calls24h: 988 },
      { name: 'rss.harvest', version: 'v3.0.1', type: 'ingest', calls24h: 4118 },
      { name: 'social.post', version: 'v2.2.0', type: 'egress', calls24h: 211 },
      { name: 'colony.index', version: 'v0.4.0', type: 'state', calls24h: 701 },
    ],
    recentRuns: [
      {
        id: 'run-0214',
        workflow: 'wf_swap_0214',
        startedAt: '2026-05-03T17:29:45.000Z',
        durationMs: 1471,
        status: 'success',
        steps: [
          { ts: '00:00.000', name: 'intake.signed', detail: 'verify SignatureGuard · pubkey=z6Mk…1F2a', durationMs: 12 },
          { ts: '00:00.012', name: 'policy.evaluate', detail: 'policy=p_swap_v3 · 4 rules · 0 deny', durationMs: 28 },
          { ts: '00:00.040', name: 'skill.resolve', detail: 'bankr.swap v2.1.0 · sandbox=iad-1', durationMs: 19 },
          { ts: '00:00.059', name: 'state.read', detail: 'fact=balance/L-BTC · cache=HIT', durationMs: 6 },
          { ts: '00:00.065', name: 'model.invoke', detail: 'mimo-v2-pro · ctx=4096 · tokens=1228', durationMs: 184 },
          { ts: '00:00.249', name: 'tool.call: bridge', detail: 'channel=eu · attempt=1 · 200 OK', durationMs: 311 },
          { ts: '00:00.560', name: 'tool.call: bankr.swap', detail: 'amt=0.0421 L-BTC → USDt · slip=0.05%', durationMs: 870 },
          { ts: '00:01.430', name: 'state.commit', detail: 'fact=tx/L-7f3a… · mirror=queued', durationMs: 41 },
          { ts: '00:01.471', name: 'audit.emit', detail: 'leaf=0x9c… · seq=00214', durationMs: 0 },
        ],
      },
      {
        id: 'run-0213',
        workflow: 'wf_swap_0213',
        startedAt: '2026-05-03T17:15:12.000Z',
        durationMs: 892,
        status: 'success',
        steps: [
          { ts: '00:00.000', name: 'intake.signed', detail: 'verify SignatureGuard · pubkey=z6Mk…1F2a', durationMs: 11 },
          { ts: '00:00.011', name: 'policy.evaluate', detail: 'policy=p_swap_v3 · 4 rules · 0 deny', durationMs: 25 },
          { ts: '00:00.036', name: 'skill.resolve', detail: 'bankr.swap v2.1.0 · sandbox=iad-1', durationMs: 18 },
          { ts: '00:00.054', name: 'model.invoke', detail: 'mimo-v2-pro · ctx=4096 · tokens=892', durationMs: 156 },
          { ts: '00:00.210', name: 'tool.call: bankr.swap', detail: 'amt=0.0182 L-BTC → USDt · slip=0.03%', durationMs: 622 },
          { ts: '00:00.832', name: 'state.commit', detail: 'fact=tx/L-8e2b… · mirror=queued', durationMs: 38 },
          { ts: '00:00.870', name: 'audit.emit', detail: 'leaf=0xa1… · seq=00213', durationMs: 0 },
        ],
      },
    ],
  },
}

const DEFAULT_AGENT = {
  node: {
    id: 'unknown',
    did: 'did:key:z6Mk…unknown',
    status: 'idle',
    region: 'fra-1',
    task: 'idle',
    cpu: 0,
    mem: 0,
    p50: 0,
  },
  identity: {
    did: 'did:key:z6Mk…unknown',
    algo: 'ed25519',
    issued: '2026-01-01T00:00:00Z',
    lastSig: 'n/a',
    guard: 'SignatureGuard',
    rotation: { inDays: 30, auto: false },
    facts: { count: 0, leaf: '0x0000', lag: 0, lastCommit: 'n/a' },
  },
  skills: [],
  recentRuns: [],
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params
  const agent = MOCK_AGENTS[agentId] ?? { ...DEFAULT_AGENT, node: { ...DEFAULT_AGENT.node, id: agentId } }
  return NextResponse.json(agent)
}
