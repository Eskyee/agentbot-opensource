'use client'

import { useAccount } from 'wagmi'
import { useReadContract } from 'wagmi'
import { WRISTBAND_ABI } from '@/app/lib/wristband-abi'

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_WRISTBAND_CONTRACT as `0x${string}`

export default function BaseActivity() {
  const { address, isConnected } = useAccount()

  const { data: totalMinted } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: WRISTBAND_ABI,
    functionName: 'totalMinted',
  })

  const { data: remainingSupply } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: WRISTBAND_ABI,
    functionName: 'remainingSupply',
  })

  if (!isConnected) return null

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-blue-500" />
        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Your Base Activity</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <div className="text-[9px] uppercase tracking-widest text-zinc-600">Total Minted</div>
          <div className="text-sm font-bold text-white">{totalMinted?.toString() || '—'}</div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-widest text-zinc-600">Remaining</div>
          <div className="text-sm font-bold text-white">{remainingSupply?.toString() || '—'}</div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-widest text-zinc-600">Network</div>
          <div className="text-sm font-bold text-white">Base</div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-zinc-800">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] uppercase tracking-widest text-zinc-600">Builder Code</span>
          <span className="text-[9px] text-orange-500 font-mono">bc_4k0319ta</span>
        </div>
      </div>
    </div>
  )
}
