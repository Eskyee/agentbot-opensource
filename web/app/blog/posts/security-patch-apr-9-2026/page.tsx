import Link from 'next/link'

export default function SecurityPatchApr92026() {
 return (
 <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
 <article className="max-w-3xl mx-auto px-6 py-16">
 <Link href="/blog" className="text-zinc-400 hover:text-white mb-8 inline-block">
 ← Back to Blog
 </Link>

 <header className="mb-12">
 <h1 className="text-5xl font-bold uppercase tracking-tighter mb-4">Security Patch: Zero Vulnerabilities</h1>
 <div className="flex items-center gap-4 text-zinc-400">
 <time>April 9, 2026</time>
 <span>•</span>
 <span>2 min read</span>
 </div>
 </header>

 <div className="prose prose-invert max-w-none">
 <p className="text-xl text-zinc-300 mb-8">
 We patched three dependency CVEs today and brought the platform to zero known vulnerabilities.
 Both the Next.js frontend and Express backend now build clean with a passing <code className="text-green-400">npm audit</code>.
 </p>

 <div className="bg-zinc-950/50 border border-green-800/50 p-6 mb-8">
 <p className="text-green-400 font-bold mb-2">Audit Status: 0 vulnerabilities</p>
 <p className="text-zinc-300">
 All production dependencies across web and agentbot-backend pass <code>npm audit</code> with zero findings.
 </p>
 </div>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">What We Patched</h2>

 <div className="space-y-6 mb-8">
 <div className="bg-zinc-950/50 border border-zinc-800 p-5">
 <div className="flex items-center gap-2 mb-2">
 <span className="text-xs font-bold uppercase px-2 py-0.5 bg-red-900/50 text-red-400 border border-red-800/50">High</span>
 <span className="font-bold">defu &le;6.1.4</span>
 </div>
 <p className="text-zinc-400 text-sm mb-1">Prototype pollution via <code>__proto__</code> key in defaults argument</p>
 <p className="text-zinc-500 text-sm">Fixed: <span className="text-green-400">6.1.7</span> &mdash; <a href="https://github.com/advisories/GHSA-737v-mqg7-c878" className="text-blue-400 hover:underline">GHSA-737v-mqg7-c878</a></p>
 </div>

 <div className="bg-zinc-950/50 border border-zinc-800 p-5">
 <div className="flex items-center gap-2 mb-2">
 <span className="text-xs font-bold uppercase px-2 py-0.5 bg-yellow-900/50 text-yellow-400 border border-yellow-800/50">Moderate</span>
 <span className="font-bold">hono &le;4.12.11</span>
 </div>
 <p className="text-zinc-400 text-sm mb-1">5 CVEs: cookie name bypass, IPv4-mapped IPv6 IP matching, path traversal in toSSG(), middleware bypass via repeated slashes, setCookie() validation</p>
 <p className="text-zinc-500 text-sm">Fixed: <span className="text-green-400">4.12.12</span></p>
 </div>

 <div className="bg-zinc-950/50 border border-zinc-800 p-5">
 <div className="flex items-center gap-2 mb-2">
 <span className="text-xs font-bold uppercase px-2 py-0.5 bg-yellow-900/50 text-yellow-400 border border-yellow-800/50">Moderate</span>
 <span className="font-bold">@hono/node-server &lt;1.19.13</span>
 </div>
 <p className="text-zinc-400 text-sm mb-1">Middleware bypass via repeated slashes in serveStatic</p>
 <p className="text-zinc-500 text-sm">Fixed: <span className="text-green-400">1.19.13</span></p>
 </div>
 </div>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">How We Fixed It</h2>
 <p className="text-zinc-300 mb-4">
 Standard <code>npm audit fix</code> failed due to peer dependency conflicts across the monorepo workspace
 (mppx, wagmi/porto, @nuxt/kit transitive trees). We resolved this with root-level npm overrides:
 </p>

 <pre className="bg-zinc-950 border border-zinc-800 p-4 overflow-x-auto text-sm mb-8">
{`// package.json (root)
"overrides": {
  "hono": "^4.12.12",
  "@hono/node-server": "^1.19.13",
  "defu": "^6.1.5"
}`}
 </pre>

 <p className="text-zinc-300 mb-4">
 This forces all transitive consumers to resolve the patched versions regardless of what their own
 <code>package.json</code> declares, without breaking peer dependency resolution for the rest of the tree.
 </p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Verification</h2>
 <ul className="list-disc list-inside text-zinc-300 mb-8 space-y-2">
 <li><code>npm audit</code> &mdash; 0 vulnerabilities</li>
 <li><code>npm run build</code> (web) &mdash; passes, all routes compile</li>
 <li><code>npm run build</code> (backend) &mdash; tsc passes with zero errors</li>
 </ul>

 <div className="border-t border-zinc-800 pt-8 mt-8">
 <p className="text-zinc-500 text-sm">
 We run <code>npm audit</code> as part of every readiness check. If you&apos;re building on Agentbot,
 your containers inherit these fixes on next deploy.
 </p>
 </div>
 </div>
 </article>
 </main>
 )
}
