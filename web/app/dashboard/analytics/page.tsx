'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AnalyticsRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/dashboard/system-pulse') }, [router])
  return <div className="flex items-center justify-center h-64"><div className="text-[10px] uppercase tracking-widest text-zinc-500">Redirecting...</div></div>
}
