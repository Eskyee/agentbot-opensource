'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useCustomSession } from '@/app/lib/useCustomSession'

interface DashboardData {
  plan: string
  subscriptionStatus: string
  openclawUrl: string | null
  gatewayToken: string | null
  openclawInstanceId: string | null
  operatorEnabled: boolean
  loading: boolean
  lastUpdated: number
}

const DashboardDataContext = createContext<{
  data: DashboardData
  refresh: () => Promise<void>
} | null>(null)

export function DashboardDataProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useCustomSession()
  const [data, setData] = useState<DashboardData>({
    plan: 'solo',
    subscriptionStatus: 'inactive',
    openclawUrl: null,
    gatewayToken: null,
    openclawInstanceId: null,
    operatorEnabled: false,
    loading: true,
    lastUpdated: 0
  })

  const fetchData = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      const results = await Promise.allSettled([
        fetch('/api/billing', { cache: 'no-store' }),
        fetch('/api/user/openclaw', { cache: 'no-store' }),
        fetch('/api/operator/mode', { cache: 'no-store' })
      ])

      const nextData = { ...data, loading: false, lastUpdated: Date.now() }

      // 1. Billing
      if (results[0].status === 'fulfilled' && results[0].value.ok) {
        const b = await results[0].value.json()
        nextData.plan = b.currentPlan || 'solo'
        nextData.subscriptionStatus = b.subscriptionStatus || 'inactive'
      }

      // 2. OpenClaw
      if (results[1].status === 'fulfilled' && results[1].value.ok) {
        const o = await results[1].value.json()
        nextData.openclawUrl = o.openclawUrl || null
        nextData.gatewayToken = o.gatewayToken || null
        nextData.openclawInstanceId = o.openclawInstanceId || null
      }

      // 3. Operator Mode
      if (results[2].status === 'fulfilled' && results[2].value.ok) {
        const op = await results[2].value.json()
        nextData.operatorEnabled = !!op.operatorEnabled
      }

      setData(nextData)
    } catch (err) {
      console.error('[DashboardData] Fetch error:', err)
      setData(prev => ({ ...prev, loading: false }))
    }
  }, [session?.user?.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <DashboardDataContext.Provider value={{ data, refresh: fetchData }}>
      {children}
    </DashboardDataContext.Provider>
  )
}

export function useDashboardData() {
  const context = useContext(DashboardDataContext)
  if (!context) throw new Error('useDashboardData must be used within DashboardDataProvider')
  return context
}
