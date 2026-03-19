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
            <p className="text-sm text-gray-500 mb-2">24 February 2026</p>
            <h1 className="text-4xl font-bold mb-4">Underground Agents Drop: Built by Ravers, for Ravers</h1>
            <div className="flex gap-2">
              <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400">Release</span>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400">Underground</span>
            </div>
          </div>

          <p className="text-lg text-gray-300 mb-6">
            New agent templates for underground collectives, crypto wallet integration, and major UI improvements. Built for the culture.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">🎉 New: Rave Event Agent</h2>
          <p className="text-gray-300 mb-4">
            Manage underground events end-to-end:
          </p>
          <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
            <li><strong>Guest list management</strong> - Add/remove, check-ins at the door</li>
            <li><strong>Ticket sales in USDC</strong> - Gasless transfers, no ETH needed</li>
            <li><strong>Ride share coordination</strong> - Group chats, pickup points</li>
            <li><strong>Event stats</strong> - Revenue tracking, capacity monitoring</li>
            <li><strong>Reminders</strong> - Auto-notify attendees via Telegram</li>
          </ul>

          <p className="text-gray-300 mb-4">
            <strong>Use case:</strong> A crew runs monthly warehouse parties. The agent handles guest lists (no more WhatsApp chaos), sells tickets in USDC, and coordinates rides. Everything transparent, everything onchain.
          </p>

          <div className="bg-gray-900 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-400 mb-2">User: "Add Sarah to Friday's guest list"</p>
            <p className="text-sm text-green-400 mb-4">Agent: "✓ Added Sarah to Warehouse Party guest list. 47 confirmed."</p>
            <p className="text-sm text-gray-400 mb-2">User: "How many tickets sold?"</p>
            <p className="text-sm text-green-400">Agent: "23 tickets sold. 575 USDC collected. 12 spots left."</p>
          </div>

          <h2 className="text-2xl font-bold mt-8 mb-4">💰 New: Community Treasury Agent</h2>
          <p className="text-gray-300 mb-4">
            Transparent fund management for collectives:
          </p>
          <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
            <li><strong>Track treasury balance</strong> - Real-time USDC balance</li>
            <li><strong>Budget by category</strong> - Venues, equipment, promo, misc</li>
            <li><strong>Process reimbursements</strong> - Send USDC to members</li>
            <li><strong>Financial reports</strong> - Weekly/monthly breakdowns</li>
            <li><strong>Budget alerts</strong> - Get notified when 75%/90% spent</li>
            <li><strong>Transaction export</strong> - CSV/JSON for accounting</li>
          </ul>

          <p className="text-gray-300 mb-4">
            <strong>Use case:</strong> A soundsystem collective manages £15K of shared funds. The treasury agent tracks spending transparently, processes reimbursements onchain, and alerts when budgets run low. No more "who spent what?"
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">🔐 New: Crypto Wallet Integration</h2>
          <p className="text-gray-300 mb-4">
            Every agent can now have its own crypto wallet:
          </p>
          <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
            <li><strong>Powered by Coinbase CDP SDK</strong> - Secure, MPC-based key management</li>
            <li><strong>Base network</strong> - Low fees, fast transactions</li>
            <li><strong>USDC support</strong> - Stablecoin payments</li>
            <li><strong>Gasless transfers</strong> - No ETH needed for gas</li>
            <li><strong>Wallet UI in dashboard</strong> - Create wallet, check balance, send/receive</li>
          </ul>

          <p className="text-gray-300 mb-4">
            <strong>Why this matters:</strong> Agents can now accept payments, manage funds, and coordinate treasuries autonomously. Borderless, transparent, onchain.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">✨ UI/UX Improvements</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Mobile Menu</h3>
          <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
            <li>Larger and more visible - 320px width, text-lg, better contrast</li>
            <li>Gray-900 background - No more see-through overlay</li>
            <li>Proper z-index - Backdrop and menu properly layered</li>
            <li>Touch-friendly - Bigger tap targets, smooth animations</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">Dashboard Sidebar</h3>
          <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
            <li>Collapsible on mobile - Hamburger menu + close button</li>
            <li>Always visible on desktop - No need to toggle</li>
            <li>Smooth transitions - 200ms ease-in-out animations</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">🎯 Kimi K2.5 Positioning</h2>
          <p className="text-gray-300 mb-4">
            We updated how we talk about Kimi K2.5:
          </p>
          <p className="text-gray-300 mb-2">
            <strong>Before:</strong> "Advanced reasoning with 128K context"
          </p>
          <p className="text-gray-300 mb-4">
            <strong>After:</strong> "128K context remembers your whole vibe. Thinks like a selector—analyzes patterns and suggests what's next."
          </p>
          <p className="text-gray-300 mb-4">
            <strong>Why:</strong> Features need positioning. "We use Kimi K2.5" means nothing. "Your agent remembers every set you've ever played" is a flex.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">🔐 Verified Human Badge</h2>
          <p className="text-gray-300 mb-4">
            New trust feature for crypto/underground scenes:
          </p>
          <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
            <li><strong>Onchain attestation</strong> - Link to Coinbase Verify, ENS, etc.</li>
            <li><strong>"Verified by [human]" badge</strong> - Shows in every chat</li>
            <li><strong>Reputation tied to human</strong> - Not just the bot</li>
          </ul>
          <p className="text-gray-300 mb-4">
            <strong>Why:</strong> Crypto is full of scams. "This agent is run by a real person in the scene" is huge for trust.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">🚀 What's Next</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Phase 1 (This Week)</h3>
          <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
            <li>Complete CDP SDK integration</li>
            <li>Database schema for wallet storage</li>
            <li>Telegram bot for event reminders</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">Phase 2 (Next Month)</h3>
          <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
            <li>Beta testing with 5 collectives</li>
            <li>Soundsystem Agent template</li>
            <li>Zine/Content Agent template</li>
            <li>Marketplace for custom agents</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">Phase 3 (3 Months)</h3>
          <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
            <li>Public launch</li>
            <li>100+ collectives</li>
            <li>Multi-sig support</li>
            <li>Cross-agent coordination</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">💡 Why This Matters</h2>
          <p className="text-gray-300 mb-4">
            <strong>Not "AI for business" — AI for culture.</strong>
          </p>
          <p className="text-gray-300 mb-4">
            Underground collectives need tools for:
          </p>
          <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
            <li>Event coordination (WhatsApp is chaos)</li>
            <li>Money management (who spent what?)</li>
            <li>Content creation (time-consuming)</li>
            <li>Equipment tracking (manual spreadsheets)</li>
          </ul>

          <p className="text-gray-300 mb-4">
            Crypto actually helps here:
          </p>
          <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
            <li>Borderless payments (international crews)</li>
            <li>Transparent treasuries (trust in collectives)</li>
            <li>Gasless USDC (no ETH needed)</li>
            <li>Onchain receipts (accountability)</li>
          </ul>

          <p className="text-gray-300 mb-6">
            We're building for a real community with real needs. Not generic AI. Not forced crypto. Purpose-built for the underground.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">🎧 Try It Now</h2>
          <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
            <li><strong>Marketplace:</strong> Browse new agent templates at <Link href="/marketplace" className="text-blue-400 hover:underline">agentbot.raveculture.xyz/marketplace</Link></li>
            <li><strong>Dashboard:</strong> Create a wallet for your agent at <Link href="/dashboard" className="text-blue-400 hover:underline">agentbot.raveculture.xyz/dashboard</Link></li>
            <li><strong>Docs:</strong> Read the full guide at <a href="https://github.com/Eskyee/agentbot" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">github.com/Eskyee/agentbot</a></li>
          </ul>

          <div className="mt-12 p-6 bg-gray-900 rounded-lg border border-gray-800">
            <h3 className="text-xl font-semibold mb-4">🔥 Built for the Underground</h3>
            <p className="text-gray-300">
              Agents for the culture. Not corporate AI. Not generic tools. Purpose-built for underground collectives managing events, funds, and content with AI and crypto.
            </p>
            <p className="text-gray-300 mt-4">
              <strong>Built by ravers, for ravers.</strong> 🎧
            </p>
          </div>
        </article>
      </div>
    </main>
  );
}
