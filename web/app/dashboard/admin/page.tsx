'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardAdminRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin')
  }, [router])
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500">Redirecting to Admin...</div>
    </div>
  )
}
