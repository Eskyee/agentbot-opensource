export function VerificationBadge({ status }: { status?: string }) {
  if (status === 'human_verified')
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-400">
        &#10003; Verified
      </span>
    )
  if (status === 'x_pending')
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
        &#9203; Pending
      </span>
    )
  return null
}
