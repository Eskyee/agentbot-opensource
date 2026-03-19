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
            <h1 className="text-4xl font-bold mb-4">Tempo Wallet: Autonomous Agent Payments</h1>
            <div className="flex gap-2">
              <span className="text-xs px-2 py-1 rounded-full bg-purple-800 text-purple-400">MPP</span>
              <span className="text-xs px-2 py-1 rounded-full bg-blue-800 text-blue-400">Tempo</span>
              <span className="text-xs px-2 py-1 rounded-full bg-green-800 text-green-400">Agents</span>
            </div>
          </div>

          <p className="text-gray-300 mb-4">We're excited to announce <strong>Tempo Wallet</strong> support in Agentbot. Now your AI agents can pay for services autonomously using USDC on Base — no human intervention required.</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">What is Tempo Wallet?</h2>
          <p className="text-gray-300 mb-4">Tempo is a wallet infrastructure designed specifically for AI agents. Unlike traditional wallets that require human signatures, Tempo wallets can:</p>
          <ul className="list-disc list-inside text-gray-300 mb-4">
            <li>Sign transactions automatically</li>
            <li>Pay for API calls on demand</li>
            <li>Manage USDC balances on Base network</li>
            <li>Handle micropayments efficiently</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">How It Works</h2>
          <p className="text-gray-300 mb-4">Each agent can have its own Tempo wallet. When the agent needs to pay for a service (AI API calls, data queries, etc.), it automatically signs and submits the payment.</p>

          <pre className="bg-gray-900 p-4 rounded-lg text-gray-300 mb-4 overflow-x-auto">
{`// Agent makes a paid request
const result = await agent.callPaidService('https://mpp.dev/api/ai', {
  model: 'claude-3-5-sonnet',
  prompt: 'Analyze this data...'
});

// Payment handled automatically
// No human approval needed`}
          </pre>

          <h2 className="text-2xl font-bold mt-8 mb-4">Multi-Wallet Support</h2>
          <p className="text-gray-300 mb-4">Every company can have multiple agents, each with their own wallet. This provides:</p>
          <ul className="list-disc list-inside text-gray-300 mb-4">
            <li><strong>Budget isolation</strong> — Each agent has its own USDC balance</li>
            <li><strong>Company control</strong> — Fund specific agents for specific tasks</li>
            <li><strong>Audit trails</strong> — Track spending per agent</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">API Endpoints</h2>
          
          <h3 className="text-xl font-bold mt-6 mb-3">Create Wallet</h3>
          <pre className="bg-gray-900 p-4 rounded-lg text-gray-300 mb-4 overflow-x-auto">
{`POST /api/agent/mpp
{
  "action": "create-wallet",
  "agentId": "agent-123",
  "companyId": "label-abc"
}

// Returns: { address, privateKey }`}
          </pre>

          <h3 className="text-xl font-bold mt-6 mb-3">Get Balance</h3>
          <pre className="bg-gray-900 p-4 rounded-lg text-gray-300 mb-4 overflow-x-auto">
{`GET /api/agent/mpp?action=get-balance&agentId=agent-123`}
          </pre>

          <h2 className="text-2xl font-bold mt-8 mb-4">Use Cases</h2>
          <ul className="list-disc list-inside text-gray-300 mb-4">
            <li><strong>AI API calls</strong> — Agents pay for GPT-4, Claude, Gemini usage</li>
            <li><strong>Data queries</strong> — Pay for database lookups, API access</li>
            <li><strong>Tool usage</strong> — Pay for browser automation, scraping</li>
            <li><strong>Services</strong> — Pay for external APIs on demand</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Get Started</h2>
          <p className="text-gray-300 mb-4">Tempo Wallet is now available in Agentbot. Configure your agent's wallet via the API or dashboard.</p>
          <p className="text-gray-300 mb-4">Built on <strong>x402 protocol</strong> for standardized machine-to-machine payments.</p>

          <div className="mt-12 pt-8 border-t border-gray-800">
            <p className="text-gray-500">Learn more: <a href="https://mpp.dev" className="text-purple-400 hover:underline">mpp.dev</a> | <a href="https://wallet.tempo.xyz" className="text-purple-400 hover:underline">wallet.tempo.xyz</a></p>
          </div>
        </article>
      </div>
    </main>
  );
}
