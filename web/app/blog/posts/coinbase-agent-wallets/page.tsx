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
            <p className="text-sm text-gray-500 mb-2">19 March 2026</p>
            <h1 className="text-4xl font-bold mb-4">Coinbase Agentic Wallets</h1>
            <div className="flex gap-2">
              <span className="text-xs px-2 py-1 rounded-full bg-blue-800 text-blue-400">Coinbase</span>
              <span className="text-xs px-2 py-1 rounded-full bg-green-800 text-green-400">Wallets</span>
              <span className="text-xs px-2 py-1 rounded-full bg-purple-800 text-purple-400">CDP</span>
            </div>
          </div>

          <p className="text-gray-300 mb-4">Agentbot now supports <strong>Coinbase Developer Platform (CDP)</strong> wallets. Give your AI agents their own on-chain identity with full wallet capabilities on Base.</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">What are Agentic Wallets?</h2>
          <p className="text-gray-300 mb-4">Traditional wallets require human approval for every transaction. Agentic wallets are controlled by AI agents that can:</p>
          <ul className="list-disc list-inside text-gray-300 mb-4">
            <li>Sign transactions autonomously</li>
            <li>Hold USDC, ETH, and other tokens</li>
            <li>Interact with smart contracts</li>
            <li>Receive and send payments</li>
            <li>Deploy other contracts</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Why Coinbase CDP?</h2>
          
          <h3 className="text-xl font-bold mt-6 mb-3">Enterprise-Grade Security</h3>
          <ul className="list-disc list-inside text-gray-300 mb-4">
            <li> MPC-based key management</li>
            <li> SOC 2 compliant infrastructure</li>
            <li> Battle-tested by millions of users</li>
          </ul>

          <h3 className="text-xl font-bold mt-6 mb-3">Base Network Native</h3>
          <ul className="list-disc list-inside text-gray-300 mb-4">
            <li>Low fees — fractions of a cent</li>
            <li>Fast confirmations — ~2 seconds</li>
            <li>USDC native on-ramp</li>
            <li>Ethereum security</li>
          </ul>

          <h3 className="text-xl font-bold mt-6 mb-3">Full EVM Compatibility</h3>
          <ul className="list-disc list-inside text-gray-300 mb-4">
            <li>Any Ethereum tool works</li>
            <li>Deploy smart contracts</li>
            <li>Interact with DeFi protocols</li>
            <li>NFT minting and trading</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Agent Capabilities</h2>
          
          <table className="w-full mb-4">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-2">Capability</th>
                <th className="text-right py-2">Supported</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-800">
                <td className="py-2">Send/Receive USDC</td>
                <td className="text-right">✅</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2">ETH Transfers</td>
                <td className="text-right">✅</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2">Contract Deployment</td>
                <td className="text-right">✅</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2">DeFi Interactions</td>
                <td className="text-right">✅</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2">NFT Operations</td>
                <td className="text-right">✅</td>
              </tr>
              <tr>
                <td className="py-2">Batch Transactions</td>
                <td className="text-right">✅</td>
              </tr>
            </tbody>
          </table>

          <h2 className="text-2xl font-bold mt-8 mb-4">Use Cases</h2>
          
          <h3 className="text-xl font-bold mt-6 mb-3">Autonomous Trading</h3>
          <p className="text-gray-300 mb-4">Agents can execute trades based on signals, market conditions, or user commands — without asking for approval.</p>

          <h3 className="text-xl font-bold mt-6 mb-3">Royalty Payments</h3>
          <p className="text-gray-300 mb-4">Automatically split and send royalties to artists, collaborators, and labels after each sale or stream.</p>

          <h3 className="text-xl font-bold mt-6 mb-3">Event Ticketing</h3>
          <p className="text-gray-300 mb-4">Sell tickets with automatic settlement. No payment processing fees, just pure USDC on Base.</p>

          <h3 className="text-xl font-bold mt-6 mb-3">Subscription Billing</h3>
          <p className="text-gray-300 mb-4">Charge users monthly in USDC. Agents handle recurring payments autonomously.</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Get Started</h2>
          <p className="text-gray-300 mb-4">Coinbase CDP wallets are now available in Agentbot. Configure via:</p>
          <ul className="list-disc list-inside text-gray-300 mb-4">
            <li>Dashboard → Agent Settings → Wallet</li>
            <li>API: POST /api/wallet/create</li>
            <li>Environment: CDP_API_KEY, CDP_PRIVATE_KEY</li>
          </ul>

          <div className="mt-12 pt-8 border-t border-gray-800">
            <p className="text-gray-500">Powered by <a href="https://cdc.coinbase.com" className="text-purple-400 hover:underline">Coinbase Developer Platform</a></p>
          </div>
        </article>
      </div>
    </main>
  );
}
