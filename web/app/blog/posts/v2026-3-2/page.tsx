import Link from 'next/link';

export default function Post() {
  return (
    <main className="min-h-screen px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-gray-400 hover:text-white mb-8 inline-block">
          ← Back to Blog
        </Link>
        
        <article className="prose prose-invert max-w-none">
          <div className="mb-8">
            <p className="text-sm text-gray-500 mb-2">3 March 2026</p>
            <h1 className="text-4xl font-bold mb-4">OpenClaw v2026.3.2 + Agentbot Platform Update</h1>
            <div className="flex gap-2">
              <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400">OpenClaw</span>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400">Release</span>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400">v2026.3.2</span>
            </div>
          </div>

          <h2 className="text-2xl font-bold mt-8 mb-4">OpenClaw v2026.3.2 Released</h2>
          <p className="text-gray-300 mb-4">OpenClaw v2026.3.2 is out today with key improvements:</p>
          
          <li className="text-gray-300 mb-2"><strong>Gateway Stability</strong> - More reliable uptime</li>
          <li className="text-gray-300 mb-2"><strong>LaunchAgent Optimizations</strong> - Faster restart times</li>
          <li className="text-gray-300 mb-2"><strong>Better Error Handling</strong> - Improved diagnostics</li>
          <li className="text-gray-300 mb-2"><strong>Security Improvements</strong> - Patched vulnerabilities</li>

          <h2 className="text-2xl font-bold mt-8 mb-4">Agentbot Platform: Almost Live!</h2>
          <p className="text-gray-300 mb-4">Big news: we're this close to going live with Agentbot for everyone. Here's where we are:</p>
          
          <h3 className="text-xl font-bold mt-6 mb-3">✅ What's Ready</h3>
          <li className="text-gray-300 mb-2"><strong>User Auth</strong> - Login/signup working with credentials, GitHub, Google</li>
          <li className="text-gray-300 mb-2"><strong>Database</strong> - Neon PostgreSQL with full schema</li>
          <li className="text-gray-300 mb-2"><strong>Dashboard</strong> - User dashboard with agent management</li>
          <li className="text-gray-300 mb-2"><strong>Stripe Billing</strong> - Subscription payments ready (5 plans)</li>
          <li className="text-gray-300 mb-2"><strong>Docker Provisioning</strong> - Auto-deploy OpenClaw containers</li>
          <li className="text-gray-300 mb-2"><strong>Local OpenClaw</strong> - Atlas running on Mac mini, v2026.3.2</li>

          <h3 className="text-xl font-bold mt-6 mb-3">🔧 In Progress</h3>
          <li className="text-gray-300 mb-2"><strong>GitHub OAuth</strong> - Callback URL fix needed</li>
          <li className="text-gray-300 mb-2"><strong>Next.js 16 Fixes</strong> - Some API updates needed</li>
          <li className="text-gray-300 mb-2"><strong>Production Docker</strong> - Update to v2026.3.2</li>

          <h3 className="text-xl font-bold mt-6 mb-3">📅 Launch Checklist</h3>
          <li className="text-gray-300 mb-2">Finalize GitHub OAuth flow</li>
          <li className="text-gray-300 mb-2">Push v2026.3.2 to production Docker</li>
          <li className="text-gray-300 mb-2">Test full user signup flow</li>
          <li className="text-gray-300 mb-2">Verify Stripe checkout works</li>
          <li className="text-gray-300 mb-2">Go live 🚀</li>

          <h2 className="text-2xl font-bold mt-8 mb-4">Pricing Plans</h2>
          <p className="text-gray-300 mb-4">We're launching with 5 plans:</p>
          <li className="text-gray-300 mb-2"><strong>Starter</strong> - £19/mo - 2GB RAM, 1 CPU</li>
          <li className="text-gray-300 mb-2"><strong>Pro</strong> - £39/mo - 4GB RAM, 2 CPU</li>
          <li className="text-gray-300 mb-2"><strong>Scale</strong> - £79/mo - 8GB RAM, 4 CPU</li>
          <li className="text-gray-300 mb-2"><strong>Enterprise</strong> - £149/mo - 16GB RAM, 4 CPU</li>
          <li className="text-gray-300 mb-2"><strong>White Glove</strong> - £199/mo - 32GB RAM, 8 CPU</li>

          <h2 className="text-2xl font-bold mt-8 mb-4">Get Started</h2>
          <p className="text-gray-300 mb-4">Want early access? Sign up now at agentbot.raveculture.xyz</p>

          <div className="mt-12 p-6 rounded-xl bg-gray-900 border border-gray-800">
            <p className="text-gray-300 mb-4">Deploy your AI agent today</p>
            <Link href="/signup" className="inline-block bg-white text-black px-6 py-2.5 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              Get Started
            </Link>
          </div>
        </article>
      </div>
    </main>
  );
}
