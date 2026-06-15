import type { Metadata } from 'next'
import CodingAgentClient from './CodingAgentClient'

export const metadata: Metadata = {
  title: 'Coding Agent — AI Code Generator | Agentbot',
  description:
    'Describe what you want to build. The AI writes the code, runs it, and shows you the result. No setup required.',
}

export default function CodingAgentPage() {
  return <CodingAgentClient />
}
