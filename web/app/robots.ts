import { MetadataRoute } from 'next'
import { APP_URL } from '@/app/lib/app-url'

// Keep crawlers on public marketing/content. App surfaces (dashboard, admin,
// playground), private user pages, and API routes are not indexable content.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard',
          '/admin',
          '/playground',
          '/onboard',
          '/settings',
          '/logout',
          // WIP / utility surfaces — kept but not indexed
          '/search',
          '/skills',
          '/voice',
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  }
}
