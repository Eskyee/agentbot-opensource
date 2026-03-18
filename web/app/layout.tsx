import './globals.css'
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import Providers from "./providers";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { SpeedInsights } from '@vercel/speed-insights/next'

export const metadata: Metadata = {
  metadataBase: new URL('https://agentbot.raveculture.xyz'),
  title: {
    default: 'Agentbot — Deploy AI Agents in 60 Seconds',
    template: '%s | Agentbot',
  },
  description: 'Deploy autonomous AI agents in under a minute. BYOK infrastructure — bring your own AI key, pay wholesale. Telegram, WhatsApp, crypto wallets, A2A protocol. Built for the underground.',
  keywords: ['AI agent deployment', 'autonomous AI agents', 'BYOK AI', 'agent hosting', 'deploy AI agent', 'Telegram AI bot', 'crypto AI agent', 'Base blockchain', 'agent orchestration', 'AI infrastructure'],
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
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.svg',
  },
  other: {
    'base:app_id': '6951feb4c63ad876c90817aa',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Agentbot',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://agentbot.raveculture.xyz',
  description: 'Deploy autonomous AI agents in under a minute. BYOK infrastructure — bring your own AI key and pay wholesale rates.',
  offers: [
    {
      '@type': 'Offer',
      name: 'Underground',
      price: '29.00',
      priceCurrency: 'GBP',
      priceSpecification: {
        '@type': 'RecurringChargeSpecification',
        billingDuration: 1,
        billingIncrement: 1,
        unitCode: 'MON',
      },
    },
    {
      '@type': 'Offer',
      name: 'Collective',
      price: '69.00',
      priceCurrency: 'GBP',
      priceSpecification: {
        '@type': 'RecurringChargeSpecification',
        billingDuration: 1,
        billingIncrement: 1,
        unitCode: 'MON',
      },
    },
    {
      '@type': 'Offer',
      name: 'Label',
      price: '199.00',
      priceCurrency: 'GBP',
      priceSpecification: {
        '@type': 'RecurringChargeSpecification',
        billingDuration: 1,
        billingIncrement: 1,
        unitCode: 'MON',
      },
    },
  ],
}

export const viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-black text-white antialiased pt-[60px] flex flex-col min-h-screen font-sans">
        {/* Skip link for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded-lg focus:font-bold"
        >
          Skip to main content
        </a>
        <SpeedInsights />
        <Providers>
          <Navbar />
          <main id="main-content" className="flex-1" tabIndex={-1}>
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
