import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { getCommunityProgramForUser, voteOnGovernanceProposal } from '@/app/lib/communityProgram'

const VALID_CHOICES = new Set(['yes', 'no', 'abstain'])

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ proposalId: string }> }
) {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { proposalId } = await context.params
  const body = await request.json().catch(() => null)
  const choice = typeof body?.choice === 'string' ? body.choice.trim().toLowerCase() : ''

  if (!proposalId || !VALID_CHOICES.has(choice)) {
    return NextResponse.json({ error: 'Valid proposal and choice are required' }, { status: 400 })
  }

  const program = await getCommunityProgramForUser(session.user.id)
  if (!program.governance.eligible || program.governance.votingPower < 1) {
    return NextResponse.json({ error: 'Claimed holder status required to vote' }, { status: 403 })
  }

  const proposal = program.governance.proposals.find((item) => item.id === proposalId)
  if (!proposal || proposal.status !== 'active') {
    return NextResponse.json({ error: 'Proposal is not open for voting' }, { status: 404 })
  }

  await voteOnGovernanceProposal({
    proposalId,
    userId: session.user.id,
    walletAddress: program.rewards.walletAddress,
    choice: choice as 'yes' | 'no' | 'abstain',
    votingPower: program.governance.votingPower,
  })

  return NextResponse.json({ success: true })
}

