import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Coins, ShieldCheck, Sparkles, Wallet } from 'lucide-react'
import { CommunityProgramPanel } from '@/app/components/community/CommunityProgramPanel'
import { DashboardShell, DashboardHeader, DashboardContent } from '@/app/components/shared/DashboardShell'
import { isAdminEmail } from '@/app/lib/admin'
import { getCommunityProgramForUser } from '@/app/lib/communityProgram'
import { getAuthSession } from '@/app/lib/getAuthSession'
import { prisma } from '@/app/lib/prisma'


function DetailCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
      <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">{label}</div>
      <div className="mt-3 text-lg font-bold text-white">{value}</div>
      {detail ? <div className="mt-2 text-xs leading-5 text-zinc-500">{detail}</div> : null}
    </div>
  )
}

export default async function CommunityDashboardPage() {
  const session = await getAuthSession()
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/dashboard/community')
  }

  const [user, program] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        referralCredits: true,
      },
    }),
    getCommunityProgramForUser(session.user.id),
  ])

  const rewards = program.rewards
  const isAdmin = isAdminEmail(session.user.email)

  return (
    <DashboardShell>
      <DashboardHeader
        title="Community Rewards"
        subtitle="Holder status, claim access, and product utility for the Agentbot community token."
        icon={<Coins className="h-5 w-5 text-red-500" />}
      />
      <DashboardContent className="max-w-5xl mx-auto space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailCard
            label="Wallet"
            value={rewards.connected ? 'Connected' : 'Not connected'}
            detail={rewards.walletAddress || 'No Solana wallet verified for rewards yet'}
          />
          <DetailCard
            label="Tier"
            value={rewards.currentTier?.label || 'None yet'}
            detail={
              rewards.availability === 'degraded'
                ? rewards.detail || 'Live balance check is temporarily unavailable'
                : rewards.balanceUi !== null
                  ? `${rewards.balanceUi.toLocaleString()} tokens detected`
                  : 'Connect wallet to check live balance'
            }
          />
          <DetailCard
            label="Claim"
            value={rewards.claimed ? 'Claimed' : 'Available'}
            detail={rewards.claimed ? `${rewards.creditsClaimed} credits claimed` : 'Claim your credits if eligible'}
          />
          <DetailCard
            label="Credits"
            value={`${user?.referralCredits ?? 0}`}
            detail="Current Agentbot credit balance"
          />
        </div>

        <div className="rounded-[28px] border border-zinc-800 bg-zinc-950/80 p-6">
          <div className="bg-[radial-gradient(circle_at_top_left,_rgba(232,93,38,0.18),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.14),_transparent_32%),linear-gradient(180deg,_rgba(24,24,27,0.92),_rgba(9,9,11,0.96))] -m-6 mb-4 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Community Status</div>
              <h2 className="mt-3 text-2xl font-bold uppercase tracking-tight text-white">
                {rewards.claimed
                  ? `${rewards.currentTier?.label || 'Holder'} rewards are active`
                  : 'Connect and claim your holder rewards'}
              </h2>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                This surface turns the community token into product utility. Verified holders can claim credits today,
                and future perks will build on the same wallet-linked status.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/claim"
                className="inline-flex items-center gap-2 rounded-full border border-white bg-white px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-black hover:bg-zinc-200"
              >
                {rewards.claimed ? 'View claim' : 'Claim now'}
                <Sparkles className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/token"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-200 hover:border-zinc-500 hover:text-white"
              >
                Token page
                <Wallet className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
          </div>
        </div>

        <CommunityProgramPanel initialProgram={program} admin={isAdmin} />

        <div className="rounded-[28px] border border-zinc-800 bg-zinc-950/80 p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-400" />
            <div>
              <div className="text-sm font-bold uppercase tracking-[0.12em] text-white">What&apos;s real now</div>
              <div className="mt-2 text-sm leading-6 text-zinc-400">
                Credits claims are live and tied to a verified Solana wallet signature. Global holder snapshots and larger
                reward mechanics can build on top of this safely, but this phase already gives holders real product value.
              </div>
            </div>
          </div>
        </div>

        {rewards.availability === 'degraded' ? (
          <div className="rounded-[28px] border border-amber-500/20 bg-amber-500/10 p-6">
            <div className="text-[10px] uppercase tracking-[0.18em] text-amber-200">Live Check Delayed</div>
            <div className="mt-3 text-sm leading-6 text-amber-50">
              {rewards.detail || 'Solana balance checks are temporarily unavailable. Your connected wallet and prior claims are still preserved.'}
            </div>
          </div>
        ) : null}
      </DashboardContent>
    </DashboardShell>
  )
}
