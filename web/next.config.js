const path = require('path');
const { withWorkflow } = require('workflow/next');
const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    webpackMemoryOptimizations: true,
    optimizePackageImports: [
      '@base-org/account',
      '@base-org/account-ui',
      'lucide-react',
      'framer-motion',
      'sonner'
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'indigo-decent-condor-546.mypinata.cloud',
        pathname: '/ipfs/**',
      },
    ],
  },
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname),
  transpilePackages: ['@base-org/account', '@base-org/account-ui'],
  turbopack: {},
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@react-native-async-storage/async-storage': false,
    };
    return config;
  },
  async redirects() {
    return [
      {
        source: '/auth/login',
        destination: '/login',
        permanent: false,
      },
      {
        source: '/auth/:path*',
        destination: '/login',
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, proxy-revalidate, max-age=0',
          },
        ],
      },
      {
        source: '/:path*.webp',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*.(jpg|png|svg|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(public|_next|assets)/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/((?!api|dashboard|onboard|login|signup|auth).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; base-uri 'self'; object-src 'none'; form-action 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://selfclaw.ai https://platform.twitter.com https://*.twitter.com; style-src 'self' 'unsafe-inline' https://selfclaw.ai; img-src 'self' data: https:; media-src 'self' blob: data: https://*.mux.com; connect-src 'self' https://api.openrouter.ai https://api.stripe.com https://m.stripe.com https://vitals.vercel-insights.com https://*.base.org https://*.coinbase.com https://*.mux.com https://selfclaw.ai https://*.self.xyz wss: ws:; font-src 'self' data:; frame-src https://keys.coinbase.com https://selfclaw.ai https://*.self.xyz https://platform.twitter.com; frame-ancestors 'none'; upgrade-insecure-requests;",
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
};

// Sentry wraps the config to:
//   - Upload sourcemaps at build time (when SENTRY_AUTH_TOKEN + SENTRY_ORG +
//     SENTRY_PROJECT are set; otherwise this step is silently skipped).
//   - Inject a tunnel route (/monitoring) so events bypass ad-blockers.
//   - Tree-shake unused Sentry features.
//
// `silent: !process.env.CI` keeps the local build quiet and only logs progress
// in CI so you can see what's happening when sourcemaps upload.
module.exports = withSentryConfig(withWorkflow(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
  disableLogger: true,
  automaticVercelMonitors: true,

  // Don't fail the build if sourcemap upload fails — the SDK still works
  // without uploaded sourcemaps, you just see minified stack traces.
  errorHandler: () => {},
});
