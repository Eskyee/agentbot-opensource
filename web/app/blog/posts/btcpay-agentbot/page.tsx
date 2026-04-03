import Link from 'next/link';

export default function Post() {
  return (
    <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-zinc-400 hover:text-white mb-8 inline-block">
          &larr; Back to Blog
        </Link>

        <article className="prose prose-invert max-w-none">
          <div className="mb-8">
            <p className="text-sm text-zinc-500 mb-2">3 April 2026</p>
            <h1 className="text-4xl font-bold uppercase tracking-tighter mb-4">BTCPay Agentbot: Bitcoin-Native Agent Payments</h1>
            <div className="flex gap-2">
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Bitcoin</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">BTCPay</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Agents</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Payments</span>
            </div>
          </div>

          <p className="text-zinc-300 mb-4">Today we&apos;re shipping <strong>BTCPay Agentbot</strong> &mdash; a headless Bitcoin infrastructure stack that gives your AI agents their own wallets, powered by BTCPay Server and NBXplorer.</p>

          <p className="text-zinc-300 mb-4">No custodial middleman. No API keys from a third party. Your agents, your keys, your node.</p>

          <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">The Problem</h2>
          <p className="text-zinc-300 mb-4">We already had agent payments via Tempo (USDC on Base) and Stripe (fiat). But Bitcoin was missing. Our agents needed the ability to:</p>
          <ul className="list-disc list-inside text-zinc-300 mb-4">
            <li>Create and manage Bitcoin wallets</li>
            <li>Receive BTC payments autonomously</li>
            <li>Settle agent-to-agent transactions on Bitcoin</li>
            <li>Accept merchant payments via BTCPay Server</li>
          </ul>

          <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">What We Built</h2>
          <p className="text-zinc-300 mb-4">A <strong>headless</strong> Docker stack &mdash; no UI, just the engine:</p>

          <pre className="bg-zinc-950 p-4 text-zinc-300 mb-4 overflow-x-auto">
{`agentbot_bitcoind   → Bitcoin Core 29.1 (testnet, pruned 10GB)
agentbot_nbxplorer  → NBXplorer 2.6.2 (wallet API & tx indexer)
agentbot_postgres   → PostgreSQL 18.1 (agent metadata)`}
          </pre>

          <p className="text-zinc-300 mb-4">We forked <code className="text-zinc-300">btcpayserver-docker</code> into <code className="text-zinc-300">EskyLab/btcpayagentbot-docker</code> so we control the Docker images and can customize the stack for agent use cases.</p>

          <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Headless by Design</h2>
          <p className="text-zinc-300 mb-4">We stripped out everything agents don&apos;t need:</p>
          <ul className="list-disc list-inside text-zinc-300 mb-4">
            <li>No BTCPay Server UI &mdash; agents talk to NBXplorer API directly</li>
            <li>No Lightning Network &mdash; reduces complexity, we add it later</li>
            <li>No Tor &mdash; agents run on your infrastructure, not hidden services</li>
            <li>No reverse proxy &mdash; direct port access for internal services</li>
          </ul>

          <p className="text-zinc-300 mb-4">What remains: 3 containers, ~2GB RAM, 10GB disk. That&apos;s it.</p>

          <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Fast Sync</h2>
          <p className="text-zinc-300 mb-4">Full Bitcoin sync takes 1-2 days on a $10/mo server. With <strong>Fast Sync</strong>, we download a verified UTXO set snapshot and only sync the latest blocks. Sync time drops to <strong>minutes</strong>.</p>

          <p className="text-zinc-300 mb-4">For testnet development, we also support pointing NBXplorer at a public testnet node &mdash; skip running your own node entirely while you build the plugin logic.</p>

          <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Agent Wallet API</h2>
          <p className="text-zinc-300 mb-4">NBXplorer provides a REST API for agent wallet operations:</p>

          <pre className="bg-zinc-950 p-4 text-zinc-300 mb-4 overflow-x-auto">
{`# Create a wallet derivation
POST /v1/cryptos/btc/derivations

# Check balance
GET /v1/cryptos/btc/derivations/{walletId}/balance

# Track incoming transactions
POST /v1/cryptos/btc/derivations/{walletId}/transactions

# Get transaction history
GET /v1/cryptos/btc/derivations/{walletId}/transactions`}
          </pre>

          <p className="text-zinc-300 mb-4">Each agent can have its own HD wallet derivation. NBXplorer watches the blockchain and notifies when payments arrive. No polling needed.</p>

          <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Use Cases</h2>
          <ul className="list-disc list-inside text-zinc-300 mb-4">
            <li><strong>Agent Wallets</strong> &mdash; Each agent gets its own Bitcoin wallet</li>
            <li><strong>A2A Payments</strong> &mdash; Agents pay each other in BTC</li>
            <li><strong>Merchant Receipts</strong> &mdash; Accept BTC via BTCPay Server checkout</li>
            <li><strong>Micropayments</strong> &mdash; Pay-per-request agent services</li>
            <li><strong>Treasury Ops</strong> &mdash; Multi-sig agent treasury management</li>
          </ul>

          <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">What&apos;s Next</h2>
          <ol className="list-decimal list-inside text-zinc-300 mb-4">
            <li>Testnet plugin development &mdash; agent wallet creation, A2A payments</li>
            <li>Mainnet switch with pruned node (10GB cap)</li>
            <li>Lightning Network integration for instant payments</li>
            <li>BTCPay Server checkout integration for merchant use cases</li>
            <li>Multi-tenant wallet isolation per agent</li>
          </ol>

          <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Try It</h2>
          <pre className="bg-zinc-950 p-4 text-zinc-300 mb-4 overflow-x-auto">
{`git clone https://github.com/EskyLab/btcpayagentbot-docker.git
cd btcpayagentbot-docker
docker compose -f docker-compose.headless.yml up -d`}
          </pre>

          <p className="text-zinc-300 mb-4">Stack is live on our Mac mini infrastructure. Building the agentic plugin next.</p>

          <div className="mt-8 p-4 border border-zinc-800">
            <p className="text-zinc-400 text-sm">
              <strong className="text-white">Links:</strong>{' '}
              <a href="https://github.com/EskyLab/btcpayagentbot-docker" className="text-blue-400 hover:underline">GitHub</a> &middot;{' '}
              <a href="https://raveculture.mintlify.app/payments/btcpay" className="text-blue-400 hover:underline">Docs</a> &middot;{' '}
              <a href="https://docs.btcpayserver.org" className="text-blue-400 hover:underline">BTCPay Server</a>
            </p>
          </div>
        </article>
      </div>
    </main>
  );
}
