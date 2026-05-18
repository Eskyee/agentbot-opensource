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
      const res = await fetch('/api/dashboard/data', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch dashboard data')
      
      const b = await res.json()
      
      setData({
        plan: b.plan || 'solo',
        subscriptionStatus: b.instance?.subscriptionStatus || 'inactive',
        openclawUrl: b.openclawUrl || null,
        gatewayToken: b.gatewayToken || null,
        openclawInstanceId: b.openclawInstanceId || null,
        operatorEnabled: !!b.operatorEnabled,
        loading: false,
        lastUpdated: Date.now()
      })
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
