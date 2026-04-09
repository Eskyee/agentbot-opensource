import { Metadata } from 'next'
import { DashboardShell } from '@/components/shared/DashboardShell'
import X402Dashboard from '@/components/dashboard/x402/X402Dashboard'

export const metadata: Metadata = {
  title: 'x402 Gateway — Agentbot',
  description: 'x402-Tempo payment gateway for agent transactions',
}

export default function X402Page() {
  return (
    <DashboardShell>
      <X402Dashboard />
    </DashboardShell>
  )
}
