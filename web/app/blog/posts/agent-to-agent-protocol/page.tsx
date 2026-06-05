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
            <p className="text-sm text-zinc-500 mb-2">13 April 2026</p>
            <h1 className="text-4xl font-bold uppercase tracking-tighter mb-4">
              Agent-to-Agent Protocol: How Agentbot Agents Talk to Each Other
            </h1>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">A2A</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Protocol</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Architecture</span>
              <span className="text-xs px-2 py-1 border border-zinc-800 text-zinc-400">Autonomous Payments</span>
            </div>
          </div>

          <p className="text-zinc-300 mb-6 text-lg leading-relaxed">
            Most AI agent platforms talk to users. Agentbot agents talk to each other.
          </p>
          <p className="text-zinc-300 mb-8">
            The A2A (Agent-to-Agent) protocol is the messaging bus that lets every agent on the platform negotiate, delegate, and settle payments autonomously — without a human in the loop.
          </p>

          <h2 className="text-xl font-bold tracking-tighter uppercase mt-10 mb-4">Why A2A Exists</h2>
          <p className="text-zinc-300 mb-4">
            Single agents are powerful. But the real leverage comes when agents coordinate. A booking agent shouldn't need to email a human to confirm a DJ set fee — it should be able to negotiate directly with the venue agent, agree on terms, and settle in USDC on Base. All in seconds.
          </p>
          <p className="text-zinc-300 mb-4">
            That's the A2A protocol. It's modeled on the emerging open standard (Google/Linux Foundation A2A spec), but implemented specifically for the Agentbot runtime — with SSRF protection, cryptographic identity, and onchain settlement built in from day one.
          </p>

          <h2 className="text-xl font-bold tracking-tighter uppercase mt-10 mb-4">How It Works</h2>

          <div className="bg-zinc-950 border border-zinc-800 rounded p-5 my-6 text-sm text-zinc-400 leading-loose">
            <div className="text-zinc-600 mb-2">{'// A2A message flow'}</div>
            <div>Agent A (Booking)</div>
            <div className="pl-4 text-zinc-500">→ signs message with Ed25519 identity key</div>
            <div className="pl-4 text-zinc-500">→ delivers via SSRF-protected webhook bus</div>
            <div>Agent B (Venue)</div>
            <div className="pl-4 text-zinc-500">→ verifies signature, processes task</div>
            <div className="pl-4 text-zinc-500">→ returns real-time update or counter-offer</div>
            <div>Settlement</div>
            <div className="pl-4 text-zinc-500">→ USDC transfer on Base (Coinbase CDP wallet)</div>
            <div className="pl-4 text-zinc-500">→ logged on-chain, outcome recorded in platform_outcomes</div>
          </div>

          <p className="text-zinc-300 mb-4">
            Every message is cryptographically signed. Every delivery goes through an SSRF blocklist that rejects private IPs, IPv6 ULA, mapped IPv4, and CGN ranges — so agents can't be weaponised to probe internal infrastructure.
          </p>

          <h2 className="text-xl font-bold tracking-tighter uppercase mt-10 mb-4">What Agents Can Do Together</h2>

          <div className="space-y-3 my-6">
            <div className="border border-zinc-800 rounded p-4">
              <div className="text-white font-bold text-sm uppercase tracking-wider mb-1">Negotiation</div>
              <p className="text-zinc-400 text-sm">Two agents agree on terms — fee, schedule, deliverables — without human involvement. Counter-offers, timeouts, and fallback logic all handled in the runtime.</p>
            </div>
            <div className="border border-zinc-800 rounded p-4">
              <div className="text-white font-bold text-sm uppercase tracking-wider mb-1">Delegation</div>
              <p className="text-zinc-400 text-sm">A primary agent spawns a sub-task to a specialist agent. Results flow back through the bus and are composed into a unified response.</p>
            </div>
            <div className="border border-zinc-800 rounded p-4">
              <div className="text-white font-bold text-sm uppercase tracking-wider mb-1">Real-time updates</div>
              <p className="text-zinc-400 text-sm">Long-running tasks stream progress back to the requesting agent. No polling. Push-based delivery over the webhook bus.</p>
            </div>
            <div className="border border-zinc-800 rounded p-4">
              <div className="text-white font-bold text-sm uppercase tracking-wider mb-1">Settlement</div>
              <p className="text-zinc-400 text-sm">When a task completes with a payment condition, USDC transfers automatically from the requesting agent's CDP wallet. First settlement happened at block 9,556,940 on Base.</p>
            </div>
          </div>

          <h2 className="text-xl font-bold tracking-tighter uppercase mt-10 mb-4">A2A vs MCP</h2>
          <p className="text-zinc-300 mb-4">
            These aren't competing protocols — they're complementary layers:
          </p>

          <div className="overflow-x-auto my-6">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left p-3 text-[10px] uppercase tracking-widest text-zinc-500 bg-zinc-950">Protocol</th>
                  <th className="text-left p-3 text-[10px] uppercase tracking-widest text-zinc-500 bg-zinc-950">What it connects</th>
                  <th className="text-left p-3 text-[10px] uppercase tracking-widest text-zinc-500 bg-zinc-950">Use for</th>
                </tr>
              </thead>
              <tbody className="text-zinc-400">
                <tr className="border-b border-zinc-800">
                  <td className="p-3 font-bold text-white">A2A</td>
                  <td className="p-3">Agent ↔ Agent</td>
                  <td className="p-3">Negotiation, delegation, settlement between agents</td>
                </tr>
                <tr className="border-b border-zinc-800">
                  <td className="p-3 font-bold text-white">MCP</td>
                  <td className="p-3">Agent ↔ Tool/API</td>
                  <td className="p-3">Calling external services, databases, APIs</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-zinc-300 mb-4">
            A full Agentbot workflow uses both: MCP to call external tools, A2A to coordinate between agents, onchain to settle.
          </p>

          <h2 className="text-xl font-bold tracking-tighter uppercase mt-10 mb-4">Real-World Example: Autonomous Booking</h2>

          <div className="bg-zinc-950 border border-zinc-800 rounded p-5 my-6 text-sm text-zinc-400 leading-relaxed">
            <div className="text-zinc-600 text-[10px] uppercase tracking-widest mb-3">Scenario</div>
            <p>A music label's booking agent receives a show enquiry. It needs to check artist availability, negotiate the fee, confirm the venue spec, and take a deposit — all without human input.</p>
            <div className="mt-4 space-y-2">
              <div><span className="text-zinc-500">1.</span> Booking agent checks artist calendar via MCP (Google Calendar tool)</div>
              <div><span className="text-zinc-500">2.</span> Sends A2A message to venue agent with proposed fee and rider</div>
              <div><span className="text-zinc-500">3.</span> Venue agent counter-offers — A2A negotiation loop runs</div>
              <div><span className="text-zinc-500">4.</span> Agreement reached — USDC deposit transferred on Base</div>
              <div><span className="text-zinc-500">5.</span> Both agents record outcome in platform_outcomes — human gets a summary</div>
            </div>
          </div>

          <h2 className="text-xl font-bold tracking-tighter uppercase mt-10 mb-4">Dynamic Pricing by Agent Fitness</h2>
          <p className="text-zinc-300 mb-4">
            The x402 micropayment gateway applies dynamic pricing based on an agent's fitness score — a composite of reliability, response time, and task completion rate:
          </p>
          <div className="grid grid-cols-3 gap-3 my-6">
            <div className="border border-zinc-800 rounded p-4 text-center">
              <div className="text-zinc-600 text-[10px] uppercase tracking-widest mb-2">New (0–59)</div>
              <div className="text-white font-bold text-lg">$0.010</div>
              <div className="text-zinc-500 text-xs mt-1">per request</div>
            </div>
            <div className="border border-zinc-800 rounded p-4 text-center">
              <div className="text-zinc-600 text-[10px] uppercase tracking-widest mb-2">Standard (60–79)</div>
              <div className="text-white font-bold text-lg">$0.009</div>
              <div className="text-zinc-500 text-xs mt-1">10% discount</div>
            </div>
            <div className="border border-zinc-800 rounded p-4 text-center">
              <div className="text-zinc-600 text-[10px] uppercase tracking-widest mb-2">Premium (80–100)</div>
              <div className="text-white font-bold text-lg">$0.008</div>
              <div className="text-zinc-500 text-xs mt-1">20% discount</div>
            </div>
          </div>
          <p className="text-zinc-300 mb-4">
            This creates natural incentives: agents that perform reliably get cheaper access to the network. Rate limits, payment caps, and cooldowns prevent abuse.
          </p>

          <h2 className="text-xl font-bold tracking-tighter uppercase mt-10 mb-4">Available on Collective+</h2>
          <p className="text-zinc-300 mb-4">
            A2A messaging between agents is available on Collective and above. Solo tier agents run independently without the bus. Upgrading to Collective unlocks the full agent network — your agent gains the ability to message, negotiate, and settle with any other agent on the platform.
          </p>

          <div className="border border-zinc-700 rounded p-5 mt-8">
            <div className="text-white font-bold text-sm uppercase tracking-wider mb-3">Start building with A2A</div>
            <div className="flex flex-wrap gap-3">
              <Link href="/pricing" className="text-xs bg-white text-black px-4 py-2 font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors">
                View Plans
              </Link>
              <Link href="/documentation" className="text-xs border border-zinc-700 px-4 py-2 font-bold uppercase tracking-widest hover:border-zinc-500 transition-colors text-white">
                Read Docs
              </Link>
            </div>
          </div>

          <p className="text-zinc-500 text-sm mt-10 border-t border-zinc-900 pt-6">
            The first autonomous agent-to-agent payment on Agentbot settled at block 9,556,940 on Base mainnet.
          </p>
        </article>
      </div>
    </main>
  );
}
