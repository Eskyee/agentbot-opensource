import Link from 'next/link';

export default function Post() {
 return (
 <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
 <div className="mx-auto max-w-3xl">
 <Link href="/blog" className="text-zinc-400 hover:text-white mb-8 inline-block">
 ← Back to Blog
 </Link>
 
 <article className="prose prose-invert max-w-none">
 <div className="mb-8">
 <p className="text-sm text-zinc-500 mb-2">19 March 2026</p>
 <h1 className="text-4xl font-bold uppercase tracking-tighter mb-4">MiniMax M2.7 Now Available on Agentbot</h1>
 <div className="flex gap-2">
 <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">AI</span>
 <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">OpenRouter</span>
 <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Agents</span>
 </div>
 </div>

 <p className="text-zinc-300 mb-4">The wait is over. <strong>MiniMax M2.7</strong> — the latest and most powerful model from MiniMax — is now available on Agentbot via OpenRouter.</p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">What Makes M2.7 Special?</h2>
 <p className="text-zinc-300 mb-4">M2.7 is a next-generation large language model designed for autonomous, real-world productivity. It&apos;s built for <strong>agents</strong> — not just chatbots.</p>

 <h3 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Key Capabilities</h3>
 <ul className="list-disc list-inside text-zinc-300 mb-4">
 <li><strong>Multi-agent collaboration</strong> — M2.7 can plan, execute, and refine complex tasks across dynamic environments</li>
 <li><strong>Live debugging</strong> — Real-time error detection and fixing</li>
 <li><strong>Financial modeling</strong> — Complex financial calculations and projections</li>
 <li><strong>Full document generation</strong> — Word, Excel, and PowerPoint</li>
 </ul>

 <h3 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Benchmark Results</h3>
 <table className="w-full mb-4">
 <thead>
 <tr className="border-b border-zinc-700">
 <th className="text-left py-2">Benchmark</th>
 <th className="text-right py-2">Score</th>
 </tr>
 </thead>
 <tbody>
 <tr className="border-b border-zinc-800">
 <td className="py-2">SWE-Pro</td>
 <td className="text-right">56.2%</td>
 </tr>
 <tr className="border-b border-zinc-800">
 <td className="py-2">Terminal Bench 2</td>
 <td className="text-right">57.0%</td>
 </tr>
 <tr>
 <td className="py-2">GDPval-AA</td>
 <td className="text-right">1495 ELO</td>
 </tr>
 </tbody>
 </table>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Pricing</h2>
 <p className="text-zinc-300 mb-4">Available on OpenRouter at competitive rates:</p>
 <ul className="list-disc list-inside text-zinc-300 mb-4">
 <li><strong>Input:</strong> $0.30/M tokens</li>
 <li><strong>Output:</strong> $1.20/M tokens</li>
 <li><strong>Context:</strong> 204,800 tokens</li>
 </ul>

 <p className="text-zinc-300 mb-4">Compare to GPT-4o:</p>
 <ul className="list-disc list-inside text-zinc-300 mb-4">
 <li>Input: $2.50/M tokens</li>
 <li>Output: $10.00/M tokens</li>
 </ul>

 <p className="text-green-400 font-bold mb-4">M2.7 is 8x cheaper on input, 8x cheaper on output.</p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">How to Use</h2>
 <ol className="list-decimal list-inside text-zinc-300 mb-4">
 <li>Go to <strong>Settings → API Keys</strong></li>
 <li>Add your OpenRouter key</li>
 <li>Select <strong>MiniMax M2.7</strong> as your model</li>
 </ol>

 <pre className="bg-zinc-950 p-4 text-zinc-300 mb-4 overflow-x-auto">
{`curl -X POST https://agentbot.raveculture.xyz/api/chat \\
 -H "Content-Type: application/json" \\
 -d '{"model": "minimax/minimax-m2.7", "message": "Build me a trading bot"}'`}
 </pre>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Why This Matters</h2>
 <p className="text-zinc-300 mb-4">M2.7 is built for <strong>autonomous agents</strong> — not just answering questions. It can:</p>
 <ul className="list-disc list-inside text-zinc-300 mb-4">
 <li>Execute multi-step workflows</li>
 <li>Debug code in real-time</li>
 <li>Work across multiple software environments</li>
 <li>Optimize its own output through planning</li>
 </ul>

 <p className="text-zinc-300 mb-4">This aligns perfectly with Agentbot&apos;s mission: <strong>autonomous agents that work while you sleep</strong>.</p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Get Started</h2>
 <p className="text-zinc-300 mb-4"><a href="https://agentbot.raveculture.xyz" className="text-zinc-400 hover:text-white">Sign up now</a> and select MiniMax M2.7 as your AI model.</p>

 <div className="mt-12 pt-8 border-t border-zinc-800">
 <p className="text-zinc-500">Available now on OpenRouter. Standard OpenRouter rates apply.</p>
 </div>
 </article>
 </div>
 </main>
 );
}
