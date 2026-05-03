import { NextResponse, NextRequest } from 'next/server'

const MOCK_RUNS: Record<string, unknown[]> = {
  'settler-12': [
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
    {
      id: 'run-0212',
      workflow: 'wf_harvest_rss',
      startedAt: '2026-05-03T16:58:03.000Z',
      durationMs: 2340,
      status: 'error',
      steps: [
        { ts: '00:00.000', name: 'intake.signed', detail: 'verify SignatureGuard · pubkey=z6Mk…1F2a', durationMs: 13 },
        { ts: '00:00.013', name: 'policy.evaluate', detail: 'policy=p_harvest_v2 · 3 rules · 0 deny', durationMs: 22 },
        { ts: '00:00.035', name: 'tool.call: rss.fetch', detail: 'feed=coindesk · timeout=5000ms', durationMs: 5012 },
        { ts: '00:05.047', name: 'error', detail: 'timeout after 5000ms · retry=2/3', durationMs: 0 },
      ],
    },
  ],
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params
  const runs = MOCK_RUNS[agentId] ?? []
  return NextResponse.json({ runs })
}
