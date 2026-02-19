import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'OpenClaw Deploy - Deploy OpenClaw in 60 Seconds',
  description: 'Deploy your own OpenClaw agent in under a minute. Secure cloud hosting, preconfigured templates, and chat-first automation.',
  openGraph: {
    title: 'OpenClaw Deploy',
    description: 'Deploy your own OpenClaw agent in under a minute.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OpenClaw Deploy',
    description: 'Deploy your own OpenClaw agent in under a minute.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white antialiased">{children}</body>
    </html>
  )
}
