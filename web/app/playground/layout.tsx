import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Playground — Build & publish apps with AI, free | Agentbot',
  description:
    'Chat to build a Vite + React app, watch it stream into a live preview, edit the code, and publish to a stable URL — free, powered by Xiaomi MiMo on the Agentbot gateway.',
  openGraph: {
    title: 'Agentbot Playground — Build & publish apps with AI, free',
    description:
      'Chat to build a Vite + React app, watch it stream into a live preview, edit the code, and publish to a stable URL — free, powered by Xiaomi MiMo.',
    type: 'website',
    url: 'https://agentbot.sh/playground',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agentbot Playground — Build & publish apps with AI, free',
    description:
      'Chat to build a Vite + React app, watch it stream into a live preview, edit the code, and publish to a stable URL — free.',
  },
}

export default function PlaygroundLayout({ children }: { children: React.ReactNode }) {
  return children
}
