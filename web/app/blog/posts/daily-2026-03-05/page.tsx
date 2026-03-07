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
            <p className="text-sm text-gray-500 mb-2">5 March 2026</p>
            <h1 className="text-4xl font-bold mb-4">baseFM March Update: Agent Skills, Autonomous Trading & More</h1>
            <div className="flex gap-2">
              <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400">Update</span>
              <span className="text-xs px-2 py-1 rounded-full bg-blue-800 text-blue-400">Skills</span>
              <span className="text-xs px-2 py-1 rounded-full bg-green-800 text-green-400">Trading</span>
            </div>
          </div>

          <p className="text-gray-300 mb-4">We've been building. Hard. The last 24 hours have seen a massive leap forward for the baseFM ecosystem and the Agentbot platform. Here's the breakdown of everything that just dropped.</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">The Big One: Agent Skills Are Here</h2>
          <p className="text-gray-300 mb-4">Your AI agents just got superpowers. We've integrated the Vercel Labs Agent Skills Directory directly into baseFM. Now you can extend your agents with pre-built capabilities like web browsing, code execution, and deep data analysis with a single command.</p>
          <pre className="bg-gray-900 p-4 rounded-lg text-gray-300 mb-4 overflow-x-auto">
            <code>npx skills add vercel-labs/agent-skills</code>
          </pre>

          <h2 className="text-2xl font-bold mt-8 mb-4">Autonomous Trading Agent</h2>
          <p className="text-gray-300 mb-4">The Bankr-powered trading agent is now fully automated via Vercel cron jobs. It scans the market, decides on trades, and executes them on autopilot. Features include:</p>
          <ul className="list-disc list-inside text-gray-300 mb-4">
            <li>Fixed Bankr API integration (now prompt-driven)</li>
            <li>Admin-only access protection for trading wallets</li>
            <li>Real-time Supabase sync to watch trades execute live</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Developer Guide Glow-Up</h2>
          <p className="text-gray-300 mb-4">The Advanced Guide has been rebuilt as the <strong>Developer Guide</strong>. It now features proper documentation for the Bankr SDK, Clanker v4, Agentbot, and OpenClaw, with every section linking to official docs.</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Under The Hood</h2>
          <p className="text-gray-300 mb-4">We've hardened the infrastructure and expanded our security posture:</p>
          <ul className="list-disc list-inside text-gray-300 mb-4">
            <li><strong>ClawHub + VirusTotal Integration</strong>: Following the official <a href="https://openclaw.ai/blog/virustotal-partnership" className="text-blue-400 hover:underline">OpenClaw partnership</a>, all skills on our platform are now scanned using VirusTotal’s threat intelligence and AI Code Insight.</li>
            <li>Security vulnerabilities patched and environment variables locked.</li>
            <li>Toast notifications added for better UX.</li>
            <li>Offline detection and error retry logic.</li>
            <li>Enhanced DJ analytics and community page refinements.</li>
          </ul>

          <p className="text-gray-300 mt-8 mb-4">What's next? Community-built agent skills, deeper OpenClaw integration, and enhanced trading analytics. baseFM is where underground music meets onchain infrastructure.</p>

          <p className="text-xl font-bold text-blue-400 mt-8">Stay onchain, stay tuned. 📻</p>
        </article>
      </div>
    </main>
  );
}
