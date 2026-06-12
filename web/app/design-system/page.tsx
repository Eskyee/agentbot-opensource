import type { Metadata } from 'next'
import { Showcase } from './showcase'

export const metadata: Metadata = {
  title: 'Design System — Agentbot',
  description:
    'The Agentbot component library — Geist-inspired primitives adapted to the Agentbot brand. One source of truth.',
}

export default function DesignSystemPage() {
  return <Showcase />
}
