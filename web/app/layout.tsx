import './globals.css'
import type { Metadata } from 'next'
import Navbar from "./components/Navbar";

export const metadata: Metadata = {
  title: 'Agentbot | OpenClaw Deploy - Deploy OpenClaw in 60 Seconds',
  description: 'Agentbot presents OpenClaw Deploy: Deploy your own OpenClaw agent in under a minute. Secure cloud hosting, preconfigured templates, and chat-first automation.',
  openGraph: {
    title: 'Agentbot | OpenClaw Deploy',
    description: 'Agentbot presents OpenClaw Deploy: Deploy your own OpenClaw agent in under a minute.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agentbot | OpenClaw Deploy',
    description: 'Agentbot presents OpenClaw Deploy: Deploy your own OpenClaw agent in under a minute.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-base-dark text-white antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  )
}
