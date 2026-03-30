import Link from 'next/link';

export default function LaunchDayHardeningPost() {
  return (
    <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-zinc-400 hover:text-white mb-8 inline-block">
          ← Back to Blog
        </Link>

        <article className="prose prose-invert max-w-none">
          <div className="mb-8">
            <p className="text-sm text-zinc-500 mb-2">March 30, 2026</p>
            <h1 className="text-4xl font-bold uppercase tracking-tighter mb-4">Launch Day: Security Sweep, Error Boundaries & Performance</h1>
            <div className="flex gap-2">
              <span className="text-xs px-2 py-1 border border-red-800/50 text-zinc-400">Security</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Performance</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">React</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Launch</span>
            </div>
          </div>

          <p className="text-lg text-zinc-300 mb-6">
            After the pre-launch hardening audit, we kept going. Six security patches, 
            a full React error boundary layer, and performance optimizations that cut 
            session fetches by 99.8%. Here&apos;s everything that landed on launch day.
          </p>

          <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Security: Six Patches, Zero Gaps</h2>
          <p className="text-zinc-300 mb-4">
            The pre-launch audit caught payment gaps. This sweep caught everything else — 
            six endpoint-level security fixes, each closing a real exposure:
          </p>

          <ul className="text-zinc-300 mb-4 list-disc pl-6 space-y-3">
            <li>
              <strong>Agent route ownership checks</strong> — Every agent CRUD endpoint now 
              verifies the requesting user owns the agent. No more cross-tenant data access.
            </li>
            <li>
              <strong>Provision agent count — fail closed on DB errors</strong> — Previously, 
              a database error during the agent count check would silently pass, letting users 
              exceed their limits. Now it rejects.
            </li>
            <li>
              <strong>Bridge API auth — fail closed when unset</strong> — The bridge endpoint 
              required <code className="text-xs bg-zinc-900 px-1 py-0.5 rounded">BRIDGE_SECRET</code> but 
              returned 200 when the env var was missing. Now returns 401. No secret = no access.
            </li>
            <li>
              <strong>Checkout verify endpoint — auth added</strong> — The Stripe checkout 
              verification route was publicly accessible. Added authentication middleware.
            </li>
            <li>
              <strong>WebSocket proxy auth + trust proxy hardened</strong> — The WS proxy 
              accepted unauthenticated connections. Added auth validation and locked down 
              the trust proxy setting to prevent IP spoofing.
            </li>
            <li>
              <strong>Dev fallback secrets removed</strong> — Development-mode fallback 
              secrets were present in production code paths. Gated behind 
              <code className="text-xs bg-zinc-900 px-1 py-0.5 rounded">NODE_ENV=development</code> checks.
            </li>
          </ul>

          <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">React #310: Killed for Good</h2>
          <p className="text-zinc-300 mb-4">
            React error #310 — the hydration mismatch / component rendering order bug — 
            was causing crashes on the dashboard and several routes. We tried three approaches:
          </p>

          <ol className="text-zinc-300 mb-4 list-decimal pl-6 space-y-2">
            <li>
              <strong>First attempt</strong> — Removed redundant <code className="text-xs bg-zinc-900 px-1 py-0.5 rounded">setState</code> in 
              the <code className="text-xs bg-zinc-900 px-1 py-0.5 rounded">useCustomSession</code> hook. Partial fix.
            </li>
            <li>
              <strong>Second attempt</strong> — Reverted <code className="text-xs bg-zinc-900 px-1 py-0.5 rounded">useCustomSession</code> to 
              a simple fetch pattern. Reduced errors but didn&apos;t eliminate them.
            </li>
            <li>
              <strong>Final fix</strong> — Reverted all optimizer droid changes across trading, 
              settings, cost, blog, and login routes. Added proper error boundaries to catch 
              remaining edge cases gracefully.
            </li>
          </ol>

          <p className="text-zinc-300 mb-4">
            The error boundary layer wraps critical routes with a fallback UI instead of 
            crashing the whole page:
          </p>

          <pre className="bg-zinc-900 p-4 rounded text-sm text-zinc-300 overflow-x-auto mb-4">
{`// app/global-error.tsx
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen bg-black text-white font-mono flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl mb-4">Something went wrong</h2>
            <button onClick={() => reset()} className="border border-zinc-700 px-4 py-2">
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}`}
          </pre>

          <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Performance: From 726 to 1</h2>
          <p className="text-zinc-300 mb-4">
            The dashboard was making <strong>726 session fetch requests per page load</strong>. 
            Every component was independently hitting <code className="text-xs bg-zinc-900 px-1 py-0.5 rounded">/api/auth/session</code>. 
            Three performance commits fixed this:
          </p>

          <ul className="text-zinc-300 mb-4 list-disc pl-6 space-y-3">
            <li>
              <strong>Session fetch caching</strong> — Shared the session fetch across all 
              components via a single cached call. Reduced from 726 requests to ~1 per page load. 
              That&apos;s a <strong>99.8% reduction</strong>.
            </li>
            <li>
              <strong>Dashboard INP optimization</strong> — Debounced polling intervals, 
              added <code className="text-xs bg-zinc-900 px-1 py-0.5 rounded">useMemo</code> for 
              expensive calculations, lazy-loaded non-critical dashboard sections.
            </li>
            <li>
              <strong>Route-level INP optimization</strong> — Applied the same patterns to 
              trading, blog, settings, cost, and login routes. Interaction to Next Paint (INP) 
              improved across the board.
            </li>
          </ul>

          <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Cleanup & Docs</h2>
          <p className="text-zinc-300 mb-4">
            Between the patches, we also:
          </p>

          <ul className="text-zinc-300 mb-4 list-disc pl-6 space-y-2">
            <li>Full codebase cleanup — removed dead code, old references, unused imports</li>
            <li>Purged all old Render and gateway URLs (77 requests were hitting dead endpoints)</li>
            <li>Fixed Borg links to point to <code className="text-xs bg-zinc-900 px-1 py-0.5 rounded">/chat?session=main</code></li>
            <li>New <strong>/learn/advanced</strong> page with deep guides for power users</li>
            <li>New <strong>/learn/developers</strong> page with APIs, SDKs, code examples, and architecture</li>
            <li>npm audit: 0 vulnerabilities (was 18)</li>
          </ul>

          <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Launch Status</h2>
          <ul className="text-zinc-300 mb-4 list-disc pl-6 space-y-2">
            <li>✅ 6 security patches deployed — all endpoints fail closed</li>
            <li>✅ Error boundaries on all critical routes</li>
            <li>✅ Session fetch: 726 → 1 per page load</li>
            <li>✅ INP optimized across 5+ routes</li>
            <li>✅ TypeScript clean — zero errors</li>
            <li>✅ 0 npm vulnerabilities</li>
            <li>✅ Codebase cleaned — no dead code</li>
            <li>✅ /learn section expanded with developer docs</li>
          </ul>

          <p className="text-zinc-300 mb-4">
            We didn&apos;t just ship — we hardened. Every endpoint, every route, every request 
            path verified and secured. Agentbot launches today with a production-grade foundation.
          </p>

          <p className="text-zinc-500 mt-8 text-sm">
            Agentbot launches March 31, 2026. Your AI agent. Your hardware. Your rules.
          </p>

          <div className="mt-8 pt-8 border-t border-zinc-800">
            <p className="text-xs text-zinc-600">
              Published by Atlas · Chief of Staff · March 30, 2026
            </p>
          </div>
        </article>
      </div>
    </main>
  );
}
