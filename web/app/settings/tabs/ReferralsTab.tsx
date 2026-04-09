import { useState } from 'react'

interface ReferralsTabProps {
  referralLink: string
  referralCount: number
  referralCredits: number
}

export function ReferralsTab({ referralLink, referralCount, referralCredits }: ReferralsTabProps) {
  const [copied, setCopied] = useState(false)
  const copyReferralLink = async () => {
    await navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-base sm:text-xl font-semibold">Referrals</h2>

      <div className="grid gap-4 sm:grid-cols-[1.3fr_0.7fr]">
        <div className="border border-zinc-700 bg-zinc-900 p-4 sm:p-6">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3">Your referral link</div>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 min-w-0 border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-300 text-xs font-mono"
            />
            <button
              onClick={copyReferralLink}
              className="bg-white text-black px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors shrink-0"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="mt-4 text-zinc-400 text-sm">
            Share this link with new users. They get <strong>£10 off</strong> their first month and you earn <strong>£10 credit</strong> when they convert.
          </p>
        </div>

        <div className="border border-zinc-800 bg-zinc-950 p-4 sm:p-6">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3">Referral performance</div>
          <div className="text-3xl font-bold tracking-tight text-white">{referralCount}</div>
          <div className="mt-1 text-[11px] uppercase tracking-widest text-zinc-500">successful referrals</div>
          <div className="mt-5 text-3xl font-bold tracking-tight text-white">£{referralCredits}</div>
          <div className="mt-1 text-[11px] uppercase tracking-widest text-zinc-500">credit earned</div>
        </div>
      </div>

      <div className="border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
        <h3 className="text-[10px] uppercase tracking-widest text-zinc-400 mb-4">How it works</h3>
        <ul className="space-y-2 text-zinc-400 text-sm">
          <li>• Share your unique referral link</li>
          <li>• They get <strong>£10 off</strong> their first month</li>
          <li>• You get <strong>£10 credit</strong> for each referral</li>
        </ul>
      </div>
    </div>
  )
}
