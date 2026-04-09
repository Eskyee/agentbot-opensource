import './globals.css'
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import Providers from "./providers";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { StatusBar } from "./components/StatusBar";
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { cn } from "@/lib/utils";
import { APP_URL } from '@/app/lib/app-url'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Agentbot — Focus on the Work. Agents Handle the Rest.',
    template: '%s | Agentbot',
  },
  description: 'Deploy autonomous AI agents for your creative practice in under a minute. BYOK infrastructure — bring your own AI key, pay wholesale. Telegram, WhatsApp, crypto wallets, A2A protocol.',
  keywords: ['AI agent deployment', 'autonomous AI agents', 'BYOK AI', 'agent hosting', 'deploy AI agent', 'creative industry AI', 'AI for creators', 'Base blockchain', 'agent orchestration', 'AI infrastructure'],
  authors: [{ name: 'Agentbot', url: APP_URL }],
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
    url: APP_URL,
    siteName: 'Agentbot',
    title: 'Agentbot | Focus on the Work. Agents Handle the Rest.',
    description: 'Deploy your own AI agent in under a minute. Secure cloud hosting, preconfigured templates, and chat-first automation.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Agentbot — Focus on the Work. Agents Handle the Rest.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agentbot | Focus on the Work. Agents Handle the Rest.',
    description: 'Deploy your own AI agent in under a minute. Secure cloud hosting, preconfigured templates, and chat-first automation.',
    creator: '@Esky33junglist',
    images: ['/opengraph-image'],
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.png',
    other: [
      { rel: 'apple-touch-icon', sizes: '120x120', url: '/icons/apple-touch-icon-120x120.png' },
      { rel: 'apple-touch-icon', sizes: '152x152', url: '/icons/apple-touch-icon-152x152.png' },
      { rel: 'apple-touch-icon', sizes: '167x167', url: '/icons/apple-touch-icon-167x167.png' },
      { rel: 'apple-touch-icon', sizes: '180x180', url: '/icons/apple-touch-icon-180x180.png' },
    ],
  },
  other: {
    'google-site-verification': 'zCtxfWmpS5bIT2JSGipE04GN85VYLaUEb4Xkkcb-ZCQ',
    'talentapp:project_verification': '02b6e4586b25009b3b24cd6f9e0d35e036960b2f0c037ccfefe8cc9e83e6c5c88a85efdeb3f7f4e97f7003d6b4e103e8858f0e5fe03c8c6a2207514f1b6449ff',
    'base:app_id': '6951feb4c63ad876c90817aa',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Agentbot',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: APP_URL,
  description: 'Deploy autonomous AI agents in under a minute. BYOK infrastructure — bring your own AI key and pay wholesale rates.',
  offers: [
    {
      '@type': 'Offer',
      name: 'Solo',
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
      price: '149.00',
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
      name: 'Network',
      price: '499.00',
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
    <html lang="en" className={cn(GeistSans.variable, GeistMono.variable, "font-sans")}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-black text-white antialiased pt-14 pb-10 flex flex-col min-h-screen font-sans">
        {/* Skip link for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded-lg focus:font-bold"
        >
          Skip to main content
        </a>
        <SpeedInsights />
        <Analytics />
        <Providers>
          <Navbar />
          <main id="main-content" className="flex-1" tabIndex={-1}>
            {children}
          </main>
          <Footer />
          <StatusBar />
          <Toaster theme="dark" position="bottom-right" richColors closeButton />
        </Providers>
      </body>
    </html>
  )
}
