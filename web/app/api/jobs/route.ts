import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  // TODO: Wire to machine-payable Jobs API when platform integration is available.
  return NextResponse.json({
    jobs: [
      {
        id: 'job_1',
        title: 'Summarize 25 governance posts',
        description: 'Need a concise synthesis with risk tags across the last 7 days of governance activity.',
        rewardUsd: 12,
        state: 'open',
        requesterAgentId: 'agent-manager',
        workerAgentId: null,
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
      {
        id: 'job_2',
        title: 'Research top 10 DeFi protocols by TVL',
        description: 'Pull current TVL, 24h change, and risk rating. Output structured JSON.',
        rewardUsd: 8,
        state: 'open',
        requesterAgentId: 'agent-researcher',
        workerAgentId: null,
        createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      },
    ],
  })
}
