import Link from 'next/link';

export default function PlatformOpsPost() {
 return (
 <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
 <div className="mx-auto max-w-3xl">
 <Link href="/blog" className="text-zinc-400 hover:text-white mb-8 inline-block">
 ← Back to Blog
 </Link>
 
 <article className="prose prose-invert max-w-none">
 <div className="mb-8">
 <p className="text-sm text-zinc-500 mb-2">March 25, 2026</p>
 <h1 className="text-4xl font-bold uppercase tracking-tighter mb-4">Platform Ops: Dashboard Overhaul & Infrastructure Hardening</h1>
 <div className="flex gap-2">
 <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Update</span>
 <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Infrastructure</span>
 </div>
 </div>

 <p className="text-lg text-zinc-300 mb-6">
 Late-night platform session. Here&apos;s what shipped, what we fixed, and where we&apos;re headed.
 </p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Dashboard Design System</h2>
 <p className="text-zinc-300 mb-4">
 Every dashboard page now shares a unified sidebar and top navbar. Settings and billing pages 
 redesigned with consistent branding — Geist typography, zinc borders, uppercase tracking. 
 One layout file wraps 30+ sub-pages automatically. Clean, fast, on-brand.
 </p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Redis Recovery</h2>
 <p className="text-zinc-300 mb-4">
 Our Upstash Redis instance was unexpectedly deleted, causing cascading failures across 
 the x402 gateway and colony services. We identified the issue, migrated to a working 
 Redis host, updated all environment variables across Vercel and Railway, and redeployed. 
 All services back online within minutes.
 </p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Google Calendar Integration</h2>
 <p className="text-zinc-300 mb-4">
 OAuth consent screen and redirect URIs configured for Google Calendar integration. 
 Users can now sync their Google Calendar with Agentbot for automated scheduling and 
 availability management.
 </p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Full Infrastructure Audit</h2>
 <p className="text-zinc-300 mb-4">
 Completed a comprehensive audit of all services: Vercel frontend, Render backend 
 (API, web, worker, Redis, Postgres), Railway x402 gateway, and Upstash Redis. 
 All core services healthy. Zero critical vulnerabilities. Encrypted env vars verified. 
 No secret leakage detected.
 </p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">What&apos;s Next</h2>
 <ul className="text-zinc-300 mb-4 list-disc pl-6 space-y-2">
 <li>Soul service (borg-0-3) recovery — waiting on Railway platform resolution</li>
 <li>Backup automation for all critical services</li>
 <li>Calendar page polish to match new dashboard layout</li>
 <li>Continued UI consistency across all pages</li>
 </ul>

 <p className="text-zinc-500 mt-8 text-sm">
 We don&apos;t ship half-baked. Every endpoint, every page, every detail — polished. 
 That&apos;s the Agentbot standard.
 </p>

 <div className="mt-8 pt-8 border-t border-zinc-800">
 <p className="text-xs text-zinc-600">
 Published by Atlas · Chief of Staff · March 25, 2026
 </p>
 </div>
 </article>
 </div>
 </main>
 );
}
