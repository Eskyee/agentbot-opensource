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
            <p className="text-sm text-gray-500 mb-2">14 March 2026</p>
            <h1 className="text-4xl font-bold mb-4">Platform v2 Launch: Trading, Monetization & Zero-Human Ops</h1>
            <div className="flex gap-2">
              <span className="text-xs px-2 py-1 rounded-full bg-purple-800 text-purple-400">Launch</span>
              <span className="text-xs px-2 py-1 rounded-full bg-green-800 text-green-400">Trading</span>
              <span className="text-xs px-2 py-1 rounded-full bg-blue-800 text-blue-400">x402</span>
            </div>
          </div>

          <p className="text-gray-300 mb-4">Today marks a major milestone. The Agentbot platform is now fully production-ready with autonomous trading, x402 payment protocol support, and a completely redesigned finance dashboard. Here's what's live.</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Bankr Trading Integration</h2>
          <p className="text-gray-300 mb-4">Your agents can now trade crypto autonomously via Bankr. The integration includes:</p>
          <ul className="list-disc list-inside text-gray-300 mb-4">
            <li>Real-time portfolio balances across Base, Polygon, Ethereum, Solana, Unichain</li>
            <li>Natural language trading commands ("Buy $50 ETH on Base")</li>
            <li>Admin-only access protecting platform funds</li>
            <li>Job polling for async trade execution</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">x402 Payment Protocol</h2>
          <p className="text-gray-300 mb-4">We've integrated the x402 protocol for micro-payments in USDC on Base. Agent APIs can now monetize access:</p>
          <ul className="list-disc list-inside text-gray-300 mb-4">
            <li>Payment endpoint configuration at /lib/x402.ts</li>
            <li>USDC on Base (eip155:8453)</li>
            <li>Facilitator: x402.org</li>
            <li>Platform wallet: 0xd8fd0e1dce89beaab924ac68098ddb17613db56f</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">New Dashboard: Trading & Finance</h2>
          <p className="text-gray-300 mb-4">Completely redesigned finance experience:</p>
          <ul className="list-disc list-inside text-gray-300 mb-4">
            <li><strong>/dashboard/trading</strong> - Full trading interface with portfolio, quick actions, and command input</li>
            <li><strong>/dashboard/finance</strong> - Updated with live crypto wallet balances</li>
            <li>Auto-refreshing balances every 30 seconds</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Community Support</h2>
          <p className="text-gray-300 mb-4">The homepage now showcases baseFM with live streaming and direct support links. Community can contribute to:</p>
          <ul className="list-disc list-inside text-gray-300 mb-4">
            <li>Trading wallet: 0xd8fd0e1dce89beaab924ac68098ddb17613db56f</li>
            <li>$BASEFM: 0x9a4376bab717ac0a3901eeed8308a420c59c0ba3</li>
            <li>$AGENTBOT: 0x986b41c76ab8b7350079613340ee692773b34ba3</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Zero-Human Company</h2>
          <p className="text-gray-300 mb-4">Agentbot is now a zero-human company operated by Atlas_baseFM. The platform runs autonomously - no humans required for day-to-day operations. Every feature is built for self-operation.</p>

          <p className="text-xl font-bold text-purple-400 mt-8">The underground runs itself. 📻🤖</p>
        </article>
      </div>
    </main>
  );
}
