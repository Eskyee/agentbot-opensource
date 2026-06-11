import type { Metadata } from 'next'
import OpenAgentsClient from './OpenAgentsClient'

export const metadata: Metadata = {
  title: 'Open Agents — Spawn Coding Agents in the Cloud | Agentbot',
  description:
    'Spawn coding agents that run infinitely in the cloud. Powered by OpenClaw, MiMo, and Agentbot Sandbox.',
}

export default function OpenAgentsPage() {
  return <OpenAgentsClient />
}
