import './globals.css'
import type { Metadata } from 'next'
import Providers from "./providers";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL('https://agentbot.raveculture.xyz'),
  title: {
    default: 'Agentbot | Deploy AI Agents in 60 Seconds',
    template: '%s | Agentbot',
  },
  description: 'Deploy your own AI agent in under a minute. Secure cloud hosting, preconfigured templates, and chat-first automation. Start for free.',
  keywords: ['AI agent', 'OpenClaw', 'deploy AI', 'Telegram bot', 'AI automation', 'chatbot', 'no-code AI'],
  authors: [{ name: 'Agentbot', url: 'https://agentbot.raveculture.xyz' }],
  creator: 'Agentbot',
  publisher: 'Agentbot',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://agentbot.raveculture.xyz',
    siteName: 'Agentbot',
    title: 'Agentbot | Deploy AI Agents in 60 Seconds',
    description: 'Deploy your own AI agent in under a minute. Secure cloud hosting, preconfigured templates, and chat-first automation.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Agentbot - AI Agent Deployment Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agentbot | Deploy AI Agents in 60 Seconds',
    description: 'Deploy your own AI agent in under a minute. Secure cloud hosting, preconfigured templates, and chat-first automation.',
    creator: '@agentbot',
    images: ['/og-image.svg'],
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
  other: {
    'base:app_id': '6951feb4c63ad876c90817aa',
  },
}

export const viewport = {
  themeColor: '#FFFFFF',
}

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="bg-base-dark text-white antialiased pt-[60px] flex flex-col min-h-screen">
        <Providers>
          <Navbar />
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
