import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
 title: 'MiMo-V2-Pro: Xiaomi\'s Flagship AI Model Now on Agentbot',
 description: 'Xiaomi MiMo-V2-Pro is now available on Agentbot. Over 1T parameters, 1M context length, top-ranked in programming benchmarks, and deeply optimized for agentic workflows.',
 keywords: ['MiMo-V2-Pro', 'Xiaomi AI', 'AI model', 'agent AI', 'programming model', 'OpenClaw model', '1M context'],
 openGraph: {
 title: 'MiMo-V2-Pro: Xiaomi\'s Flagship AI Model Now on Agentbot',
 description: 'Over 1T parameters. 1M context. #1 in programming. The brain your agent deserves.',
 url: 'https://agentbot.raveculture.xyz/blog/posts/mimo-v2-pro',
 },
}

export default function MiMoV2ProPost() {
 return (
 <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
 <div className="mx-auto max-w-3xl">
 <Link href="/blog" className="text-zinc-400 hover:text-white mb-8 inline-block">
 ← Back to Blog
 </Link>
 
 <article className="prose prose-invert max-w-none">
 <div className="mb-8">
 <p className="text-sm text-zinc-500 mb-2">March 2026</p>
 <h1 className="text-4xl font-bold uppercase tracking-tighter mb-4">MiMo-V2-Pro: Xiaomi&apos;s Flagship AI Model</h1>
 <div className="flex gap-2 flex-wrap">
 <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400 border border-blue-800/50">New Model</span>
 <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Xiaomi</span>
 <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Agent-Optimized</span>
 </div>
 </div>

 <p className="text-lg text-zinc-300 mb-6">
 We&apos;re excited to announce that <strong>MiMo-V2-Pro</strong>, Xiaomi&apos;s flagship foundation model,
 is now available as the default model on Agentbot.
 </p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Why MiMo-V2-Pro?</h2>
 
 <div className="grid gap-4 mb-6">
 <div className="p-4 bg-zinc-950 border border-zinc-800">
 <div className="flex items-center gap-2 mb-2">
 <span className="text-2xl"></span>
 <h3 className="text-lg font-bold uppercase tracking-tighter m-0">1T+ Parameters</h3>
 </div>
 <p className="text-zinc-400 text-sm m-0">
 Over 1 trillion total parameters deliver exceptional reasoning and generation quality.
 </p>
 </div>
 
 <div className="p-4 bg-zinc-950 border border-zinc-800">
 <div className="flex items-center gap-2 mb-2">
 <span className="text-2xl"></span>
 <h3 className="text-lg font-bold uppercase tracking-tighter m-0">1M Context Length</h3>
 </div>
 <p className="text-zinc-400 text-sm m-0">
 Process entire codebases, long documents, and complex multi-step workflows without chunking.
 </p>
 </div>
 
 <div className="p-4 bg-zinc-950 border border-zinc-800">
 <div className="flex items-center gap-2 mb-2">
 <span className="text-2xl"></span>
 <h3 className="text-lg font-bold uppercase tracking-tighter m-0">#1 in Programming</h3>
 </div>
 <p className="text-zinc-400 text-sm m-0">
 Ranks #1 in programming benchmarks, approaching Opus 4.6 performance in standard evaluations.
 </p>
 </div>
 
 <div className="p-4 bg-zinc-950 border border-zinc-800">
 <div className="flex items-center gap-2 mb-2">
 <span className="text-2xl"></span>
 <h3 className="text-lg font-bold uppercase tracking-tighter m-0">Built for Agents</h3>
 </div>
 <p className="text-zinc-400 text-sm m-0">
 Deeply optimized for agentic scenarios — orchestrating workflows, driving production tasks, and reliable execution.
 </p>
 </div>
 </div>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Benchmark Performance</h2>
 
 <div className="overflow-x-auto mb-6">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-zinc-800">
 <th className="text-left py-2 px-3 text-zinc-400">Benchmark</th>
 <th className="text-right py-2 px-3 text-zinc-400">Rank</th>
 </tr>
 </thead>
 <tbody>
 <tr className="border-b border-zinc-800/50">
 <td className="py-2 px-3">Programming</td>
 <td className="text-right py-2 px-3 text-emerald-400 font-mono font-bold">#1</td>
 </tr>
 <tr className="border-b border-zinc-800/50">
 <td className="py-2 px-3">Academia</td>
 <td className="text-right py-2 px-3 text-blue-400 font-mono">#18</td>
 </tr>
 <tr className="border-b border-zinc-800/50">
 <td className="py-2 px-3">Legal</td>
 <td className="text-right py-2 px-3 text-blue-400 font-mono">#21</td>
 </tr>
 <tr className="border-b border-zinc-800/50">
 <td className="py-2 px-3">SEO</td>
 <td className="text-right py-2 px-3 text-blue-400 font-mono">#32</td>
 </tr>
 <tr className="border-b border-zinc-800/50">
 <td className="py-2 px-3">Roleplay</td>
 <td className="text-right py-2 px-3 text-blue-400 font-mono">#43</td>
 </tr>
 </tbody>
 </table>
 </div>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Pricing</h2>
 
 <p className="text-zinc-300 mb-4">
 MiMo-V2-Pro is available via OpenRouter with competitive pricing:
 </p>

 <div className="overflow-x-auto mb-6">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-zinc-800">
 <th className="text-left py-2 px-3 text-zinc-400">Tier</th>
 <th className="text-right py-2 px-3 text-zinc-400">Input</th>
 <th className="text-right py-2 px-3 text-zinc-400">Output</th>
 <th className="text-right py-2 px-3 text-zinc-400">Cache Read</th>
 </tr>
 </thead>
 <tbody>
 <tr className="border-b border-zinc-800/50">
 <td className="py-2 px-3">≤256K tokens</td>
 <td className="text-right py-2 px-3 font-mono">$1/M</td>
 <td className="text-right py-2 px-3 font-mono">$3/M</td>
 <td className="text-right py-2 px-3 font-mono text-zinc-500">$0.20/M</td>
 </tr>
 <tr className="border-b border-zinc-800/50">
 <td className="py-2 px-3">&gt;256K tokens</td>
 <td className="text-right py-2 px-3 font-mono">$2/M</td>
 <td className="text-right py-2 px-3 font-mono">$6/M</td>
 <td className="text-right py-2 px-3 font-mono text-zinc-500">$0.40/M</td>
 </tr>
 </tbody>
 </table>
 </div>

 <div className="p-4 bg-emerald-900/20 border border-emerald-800/40 mb-6">
 <p className="text-emerald-400 text-sm font-medium m-0">
 <strong>BYOK pricing:</strong> Agentbot charges zero markup. You pay OpenRouter directly at these rates.
 </p>
 </div>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Performance Stats</h2>
 
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
 <div className="p-4 bg-zinc-950/50 border border-zinc-800">
 <div className="text-2xl font-mono font-bold text-blue-400">2.8s</div>
 <div className="text-xs text-zinc-500 mt-1">Latency</div>
 </div>
 <div className="p-4 bg-zinc-950/50 border border-zinc-800">
 <div className="text-2xl font-mono font-bold text-emerald-400">34 tps</div>
 <div className="text-xs text-zinc-500 mt-1">Throughput</div>
 </div>
 <div className="p-4 bg-zinc-950/50 border border-zinc-800">
 <div className="text-2xl font-mono font-bold text-green-400">100%</div>
 <div className="text-xs text-zinc-500 mt-1">Uptime</div>
 </div>
 </div>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Why We Chose MiMo-V2-Pro</h2>
 
 <p className="text-zinc-300 mb-4">
 At Agentbot, we need models that can handle complex agentic workflows — multi-step reasoning, 
 tool orchestration, and production-grade reliability. MiMo-V2-Pro delivers on all fronts:
 </p>
 
 <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
 <li><strong>Agent-first design:</strong> Built specifically for agentic scenarios, not retrofitted</li>
 <li><strong>Massive context:</strong> 1M tokens means entire codebases in context</li>
 <li><strong>Programming excellence:</strong> #1 ranking means better code generation and debugging</li>
 <li><strong>Reliable uptime:</strong> 100% uptime from Xiaomi&apos;s infrastructure</li>
 <li><strong>Cost-effective:</strong> Competitive pricing vs Claude/GPT for similar quality</li>
 </ul>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Getting Started</h2>
 
 <p className="text-zinc-300 mb-4">
 MiMo-V2-Pro is now the default model for all new Agentbot deployments. Existing users can 
 switch to it from the dashboard:
 </p>
 
 <ol className="list-decimal list-inside text-zinc-300 mb-4 space-y-2">
 <li>Go to your Agentbot dashboard</li>
 <li>Navigate to Settings → Models</li>
 <li>Select &quot;MiMo-V2-Pro&quot; from the dropdown</li>
 <li>Your agent will use MiMo-V2-Pro for all new conversations</li>
 </ol>

 <p className="text-zinc-300 mb-4">
 Or try it right now in our <Link href="/demo" className="text-blue-400 hover:text-blue-300">live demo</Link>.
 </p>

 <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">Context Specs</h2>
 
 <div className="overflow-x-auto mb-6">
 <table className="w-full text-sm">
 <tbody>
 <tr className="border-b border-zinc-800/50">
 <td className="py-2 px-3 text-zinc-400">Total Context</td>
 <td className="py-2 px-3 font-mono">1.05M tokens</td>
 </tr>
 <tr className="border-b border-zinc-800/50">
 <td className="py-2 px-3 text-zinc-400">Max Output</td>
 <td className="py-2 px-3 font-mono">131.1K tokens</td>
 </tr>
 <tr className="border-b border-zinc-800/50">
 <td className="py-2 px-3 text-zinc-400">Parameters</td>
 <td className="py-2 px-3 font-mono">1T+ total</td>
 </tr>
 <tr className="border-b border-zinc-800/50">
 <td className="py-2 px-3 text-zinc-400">Provider</td>
 <td className="py-2 px-3">Xiaomi (China)</td>
 </tr>
 <tr className="border-b border-zinc-800/50">
 <td className="py-2 px-3 text-zinc-400">Released</td>
 <td className="py-2 px-3">March 18, 2026</td>
 </tr>
 </tbody>
 </table>
 </div>

 <div className="mt-12 p-6 bg-zinc-950 border border-zinc-800">
 <p className="text-zinc-300 mb-4">Try MiMo-V2-Pro now — no signup required</p>
 <div className="flex gap-3">
 <Link href="/demo" className="inline-block border border-zinc-800 px-6 py-2.5 text-xs font-bold uppercase tracking-widest hover:border-zinc-600 transition-colors">
 Live Demo
 </Link>
 <Link href="/signup" className="inline-block bg-zinc-800 text-white px-6 py-2.5 font-medium hover:bg-zinc-700 transition-colors">
 Deploy Your Agent
 </Link>
 </div>
 </div>
 </article>
 </div>
 </main>
 )
}
