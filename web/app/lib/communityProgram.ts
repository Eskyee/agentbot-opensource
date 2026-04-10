import crypto from 'crypto'
import { prisma } from '@/app/lib/prisma'
import {
  type CommunityRewardStatus,
  getEmptyCommunityRewardStatus,
  getUserCommunityRewardStatus,
} from '@/app/lib/solanaRewards'

export interface CommunityPerk {
  key: string
  title: string
  detail: string
  unlocked: boolean
}

export interface CommunityBadge {
  key: string
  title: string
  detail: string | null
  walletAddress: string | null
  createdAt: string
}

export interface GovernanceProposal {
  id: string
  slug: string
  title: string
  summary: string
  details: string | null
  status: 'active' | 'closed' | 'draft'
  startsAt: string
  endsAt: string | null
  totals: {
    yes: number
    no: number
    abstain: number
  }
  userVote: {
    choice: 'yes' | 'no' | 'abstain'
    votingPower: number
  } | null
}

export interface CommunityProgramData {
  rewards: CommunityRewardStatus
  perks: CommunityPerk[]
  foundingBadge: CommunityBadge | null
  governance: {
    eligible: boolean
    votingPower: number
    proposals: GovernanceProposal[]
  }
}

type GovernanceChoice = 'yes' | 'no' | 'abstain'

const FOUNDING_BADGE_KEY = 'founding-community'

function getTierId(status: CommunityRewardStatus) {
  return status.currentTier?.id || null
}

export function getGovernanceVotingPower(status: CommunityRewardStatus) {
  const tierId = getTierId(status)
  if (!status.claimed || !tierId) return 0
  if (tierId === 'whale') return 10
  if (tierId === 'builder') return 3
  return 1
}

export function getCommunityPerks(status: CommunityRewardStatus): CommunityPerk[] {
  const tierId = getTierId(status)
  const claimed = status.claimed
  const votePower = getGovernanceVotingPower(status)

  return [
    {
      key: 'credits',
      title: 'Free Agent Credits',
      detail: claimed
        ? `${status.creditsClaimed} Agentbot credits are active on your account.`
        : 'Verify your wallet and claim platform credits based on your token tier.',
      unlocked: claimed,
    },
    {
      key: 'basefm-pass',
      title: 'baseFM Guest Pass',
      detail: tierId === 'builder' || tierId === 'whale'
        ? 'Builder and Whale holders can create a baseFM DJ stream without holding the full RAVE threshold.'
        : 'Unlock at Builder tier to get a baseFM guest pass for DJ streaming.',
      unlocked: tierId === 'builder' || tierId === 'whale',
    },
    {
      key: 'governance',
      title: 'Governance Rights',
      detail: claimed
        ? `Your community vote is active with ${votePower}x voting power.`
        : 'Claim your holder status to vote on future Agentbot community proposals.',
      unlocked: claimed,
    },
    {
      key: 'airdrop',
      title: 'Airdrop Ready',
      detail: claimed
        ? 'Your claimed wallet is included in export-ready holder snapshots for future reward operations.'
        : 'Claim status puts your wallet into the verified holder registry used for future exports.',
      unlocked: claimed,
    },
  ]
}

export async function ensureCommunityProgramTables() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS community_badges (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      wallet_address TEXT,
      badge_key TEXT NOT NULL,
      title TEXT NOT NULL,
      detail TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, badge_key)
    );

    CREATE TABLE IF NOT EXISTS community_governance_proposals (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      details TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ends_at TIMESTAMPTZ,
      created_by TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS community_governance_votes (
      id TEXT PRIMARY KEY,
      proposal_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      wallet_address TEXT,
      choice TEXT NOT NULL,
      voting_power INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(proposal_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_community_badges_user ON community_badges(user_id);
    CREATE INDEX IF NOT EXISTS idx_community_badges_key ON community_badges(badge_key);
    CREATE INDEX IF NOT EXISTS idx_community_proposals_status ON community_governance_proposals(status);
    CREATE INDEX IF NOT EXISTS idx_community_votes_proposal ON community_governance_votes(proposal_id);
    CREATE INDEX IF NOT EXISTS idx_community_votes_user ON community_governance_votes(user_id);
  `)
}

export async function ensureFoundingCommunityBadge(args: {
  userId: string
  walletAddress: string
  rewardStatus: CommunityRewardStatus
}) {
  if (!args.rewardStatus.claimed) return null

  await ensureCommunityProgramTables()

  const existing = await prisma.$queryRawUnsafe<
    Array<{
      badge_key: string
      title: string
      detail: string | null
      wallet_address: string | null
      created_at: Date
    }>
  >(
    `SELECT badge_key, title, detail, wallet_address, created_at
       FROM community_badges
      WHERE user_id = $1 AND badge_key = $2
      LIMIT 1`,
    args.userId,
    FOUNDING_BADGE_KEY
  )

  if (existing[0]) {
    return {
      key: existing[0].badge_key,
      title: existing[0].title,
      detail: existing[0].detail,
      walletAddress: existing[0].wallet_address,
      createdAt: existing[0].created_at.toISOString(),
    }
  }

  const id = `cb_${crypto.randomUUID()}`
  const title = 'Founding Community'
  const detail = `${args.rewardStatus.currentTier?.label || 'Holder'} claim verified on Agentbot.`

  await prisma.$executeRawUnsafe(
    `INSERT INTO community_badges (id, user_id, wallet_address, badge_key, title, detail)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, badge_key) DO NOTHING`,
    id,
    args.userId,
    args.walletAddress,
    FOUNDING_BADGE_KEY,
    title,
    detail
  )

  return {
    key: FOUNDING_BADGE_KEY,
    title,
    detail,
    walletAddress: args.walletAddress,
    createdAt: new Date().toISOString(),
  }
}

export async function getFoundingCommunityBadge(userId: string) {
  await ensureCommunityProgramTables()

  const rows = await prisma.$queryRawUnsafe<
    Array<{
      badge_key: string
      title: string
      detail: string | null
      wallet_address: string | null
      created_at: Date
    }>
  >(
    `SELECT badge_key, title, detail, wallet_address, created_at
       FROM community_badges
      WHERE user_id = $1 AND badge_key = $2
      LIMIT 1`,
    userId,
    FOUNDING_BADGE_KEY
  )

  const badge = rows[0]
  if (!badge) return null

  return {
    key: badge.badge_key,
    title: badge.title,
    detail: badge.detail,
    walletAddress: badge.wallet_address,
    createdAt: badge.created_at.toISOString(),
  }
}

export async function createGovernanceProposal(args: {
  title: string
  summary: string
  details?: string | null
  createdBy?: string | null
  endsAt?: string | null
}) {
  await ensureCommunityProgramTables()

  const slugBase = args.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'proposal'

  const id = `cgp_${crypto.randomUUID()}`
  const slug = `${slugBase}-${id.slice(-6)}`

  await prisma.$executeRawUnsafe(
    `INSERT INTO community_governance_proposals (id, slug, title, summary, details, status, ends_at, created_by)
     VALUES ($1, $2, $3, $4, $5, 'active', $6, $7)`,
    id,
    slug,
    args.title,
    args.summary,
    args.details || null,
    args.endsAt || null,
    args.createdBy || null
  )

  return { id, slug }
}

export async function voteOnGovernanceProposal(args: {
  proposalId: string
  userId: string
  walletAddress: string | null
  choice: GovernanceChoice
  votingPower: number
}) {
  await ensureCommunityProgramTables()

  const id = `cgv_${crypto.randomUUID()}`
  await prisma.$executeRawUnsafe(
    `INSERT INTO community_governance_votes (id, proposal_id, user_id, wallet_address, choice, voting_power)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (proposal_id, user_id)
     DO UPDATE SET choice = EXCLUDED.choice, voting_power = EXCLUDED.voting_power, wallet_address = EXCLUDED.wallet_address, created_at = NOW()`,
    id,
    args.proposalId,
    args.userId,
    args.walletAddress,
    args.choice,
    args.votingPower
  )
}

export async function getCommunityProgramForUser(userId: string): Promise<CommunityProgramData> {
  await ensureCommunityProgramTables()

  const rewards = await getUserCommunityRewardStatus(userId).catch(() =>
    getEmptyCommunityRewardStatus({
      availability: 'degraded',
      detail: 'Community rewards are temporarily unavailable.',
    })
  )

  let foundingBadge = await getFoundingCommunityBadge(userId)
  if (!foundingBadge && rewards.claimed && rewards.walletAddress) {
    foundingBadge = await ensureFoundingCommunityBadge({
      userId,
      walletAddress: rewards.walletAddress,
      rewardStatus: rewards,
    })
  }

  const proposals = await prisma.$queryRawUnsafe<
    Array<{
      id: string
      slug: string
      title: string
      summary: string
      details: string | null
      status: 'active' | 'closed' | 'draft'
      starts_at: Date
      ends_at: Date | null
      yes_total: number | null
      no_total: number | null
      abstain_total: number | null
      user_choice: GovernanceChoice | null
      user_power: number | null
    }>
  >(
    `SELECT
        p.id,
        p.slug,
        p.title,
        p.summary,
        p.details,
        p.status,
        p.starts_at,
        p.ends_at,
        COALESCE(SUM(CASE WHEN v.choice = 'yes' THEN v.voting_power ELSE 0 END), 0) AS yes_total,
        COALESCE(SUM(CASE WHEN v.choice = 'no' THEN v.voting_power ELSE 0 END), 0) AS no_total,
        COALESCE(SUM(CASE WHEN v.choice = 'abstain' THEN v.voting_power ELSE 0 END), 0) AS abstain_total,
        MAX(CASE WHEN v.user_id = $1 THEN v.choice ELSE NULL END) AS user_choice,
        MAX(CASE WHEN v.user_id = $1 THEN v.voting_power ELSE NULL END) AS user_power
      FROM community_governance_proposals p
      LEFT JOIN community_governance_votes v ON v.proposal_id = p.id
      WHERE p.status IN ('active', 'closed')
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT 12`,
    userId
  )

  return {
    rewards,
    perks: getCommunityPerks(rewards),
    foundingBadge,
    governance: {
      eligible: rewards.claimed,
      votingPower: getGovernanceVotingPower(rewards),
      proposals: proposals.map((proposal) => ({
        id: proposal.id,
        slug: proposal.slug,
        title: proposal.title,
        summary: proposal.summary,
        details: proposal.details,
        status: proposal.status,
        startsAt: proposal.starts_at.toISOString(),
        endsAt: proposal.ends_at?.toISOString() || null,
        totals: {
          yes: Number(proposal.yes_total || 0),
          no: Number(proposal.no_total || 0),
          abstain: Number(proposal.abstain_total || 0),
        },
        userVote: proposal.user_choice
          ? {
              choice: proposal.user_choice,
              votingPower: Number(proposal.user_power || 0),
            }
          : null,
      })),
    },
  }
}

export async function listCommunityExportRows() {
  await ensureCommunityProgramTables()

  return prisma.$queryRawUnsafe<
    Array<{
      user_id: string
      wallet_address: string
      tier: string
      credits: number
      created_at: Date
      badge_title: string | null
    }>
  >(
    `SELECT
        c.user_id,
        c.wallet_address,
        c.tier,
        c.credits,
        c.created_at,
        b.title AS badge_title
      FROM credit_claims c
      LEFT JOIN community_badges b
        ON b.user_id = c.user_id
       AND b.badge_key = $1
      ORDER BY c.created_at DESC`,
    FOUNDING_BADGE_KEY
  )
}
