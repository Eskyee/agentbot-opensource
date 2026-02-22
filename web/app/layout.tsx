import './globals.css'
import type { Metadata } from 'next'
import Providers from "./providers";
import Navbar from "./components/Navbar";

export const metadata: Metadata = {
  title: 'Agentbot | OpenClaw Deploy - Deploy OpenClaw in 60 Seconds',
  description: 'Agentbot presents OpenClaw Deploy: Deploy your own OpenClaw agent in under a minute. Secure cloud hosting, preconfigured templates, and chat-first automation.',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'Agentbot | OpenClaw Deploy',
    description: 'Agentbot presents OpenClaw Deploy: Deploy your own OpenClaw agent in under a minute.',
    type: 'website',
    url: 'https://agentbot.raveculture.xyz',
    siteName: 'Agentbot',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agentbot | OpenClaw Deploy',
    description: 'Agentbot presents OpenClaw Deploy: Deploy your own OpenClaw agent in under a minute.',
  },
  metadataBase: new URL('https://agentbot.raveculture.xyz'),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-base-dark text-white antialiased pt-[60px]">
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  )
}
