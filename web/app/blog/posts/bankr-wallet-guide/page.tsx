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
            <h1 className="text-4xl font-bold mb-4">Guide: Connect Your Bankr Wallet to Agentbot</h1>
            <div className="flex gap-2">
              <span className="text-xs px-2 py-1 rounded-full bg-green-800 text-green-400">Guide</span>
              <span className="text-xs px-2 py-1 rounded-full bg-blue-800 text-blue-400">Tutorial</span>
            </div>
          </div>

          <p className="text-gray-300 mb-4">Just like you bring your own OpenRouter API key for AI, you can now bring your own Bankr wallet for your agents to trade with. Here's how to set it up.</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">What is Bankr?</h2>
          <p className="text-gray-300 mb-4">Bankr is an AI-powered crypto trading platform. Your agents can execute trades, check balances, and manage portfolios using natural language. You control your own funds - Agentbot never touches your money.</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Step 1: Get Your Bankr API Key</h2>
          <ol className="list-decimal list-inside text-gray-300 mb-4">
            <li>Visit <a href="https://bankr.bot/api" className="text-blue-400 hover:underline">bankr.bot/api</a></li>
            <li>Sign up with your email</li>
            <li>Generate an API key with agent access</li>
            <li>Copy your key (starts with bk_)</li>
          </ol>

          <h2 className="text-2xl font-bold mt-8 mb-4">Step 2: Connect Your Wallet</h2>
          <p className="text-gray-300 mb-4">Bankr automatically provisions wallets on:</p>
          <ul className="list-disc list-inside text-gray-300 mb-4">
            <li>Base (recommended for low fees)</li>
            <li>Ethereum</li>
            <li>Polygon</li>
            <li>Solana</li>
            <li>Unichain</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Step 3: Fund Your Wallet</h2>
          <p className="text-gray-300 mb-4">Transfer ETH or USDC to your Bankr wallet address. Start with small amounts to test.</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Trading Commands</h2>
          <p className="text-gray-300 mb-4">Once connected, your agents can:</p>
          <ul className="list-disc list-inside text-gray-300 mb-4">
            <li>"Buy $50 of ETH on Base"</li>
            <li>"Swap 0.1 ETH for USDC"</li>
            <li>"What's my ETH balance?"</li>
            <li>"Show my portfolio"</li>
            <li>"Set stop loss for ETH at $2,000"</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Security</h2>
          <p className="text-gray-300 mb-4">Your API key stays local. Agents only access YOUR wallet - not the platform's. Start with read-only keys for research agents, then upgrade to read-write when ready.</p>

          <p className="text-xl font-bold text-green-400 mt-8">Bring your own wallet. Control your own funds. 🤖🔐</p>
        </article>
      </div>
    </main>
  );
}
