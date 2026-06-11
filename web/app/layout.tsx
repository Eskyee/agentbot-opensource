import './globals.css'
import type { Metadata } from 'next'
import Providers from "./providers";
import Navbar from "./components/Navbar";
import ConditionalFooter from "./components/ConditionalFooter";
import { StatusBar } from "./components/StatusBar";
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import AskAtlas from './components/AskAtlas'
import { ServiceWorkerRegistration } from './components/ServiceWorkerRegistration'
import { APP_URL } from '@/app/lib/app-url'
import { DashboardDataProvider } from './dashboard/DashboardDataProvider'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Agentbot — Your agent works while you sleep.',
    template: '%s | Agentbot',
  },
  description: 'Deploy an autonomous AI agent that runs 24/7. Connects to Telegram, Discord, and WhatsApp. Does things on your behalf.',
  keywords: ['AI agent', 'autonomous agent', 'deploy agent', '24/7 AI', 'Telegram bot', 'Discord bot', 'WhatsApp bot'],
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
    title: 'Agentbot | Your agent works while you sleep.',
    description: 'Deploy an autonomous AI agent that runs 24/7. Connects to Telegram, Discord, and WhatsApp.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Agentbot — Your agent works while you sleep.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agentbot | Your agent works while you sleep.',
    description: 'Deploy an autonomous AI agent that runs 24/7. Connects to Telegram, Discord, and WhatsApp.',
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
    'base:app_id': '6a2206092736fd92ff84d477',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Agentbot',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: APP_URL,
  description: 'Focused control plane for playground apps, creator agents, Vercel Gateway, and GitLawb-backed autonomous projects.',
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
    <html lang="en" className="font-sans" data-scroll-behavior="smooth">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-black text-white antialiased pt-12 pb-10 flex flex-col min-h-screen font-sans">
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
          <DashboardDataProvider>
            <Navbar />
            <main id="main-content" className="flex-1" tabIndex={-1}>
              {children}
            </main>
            <ConditionalFooter />
            <StatusBar />
            <AskAtlas />
            <Toaster theme="dark" position="bottom-right" richColors closeButton />
            <ServiceWorkerRegistration />
          </DashboardDataProvider>
        </Providers>
      </body>
    </html>
  )
}
