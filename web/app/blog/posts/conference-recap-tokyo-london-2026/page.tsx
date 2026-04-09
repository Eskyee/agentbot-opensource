import Link from 'next/link'

export const metadata = {
  title: 'Conference Recap: Tokyo & London 2026 — AI Agents Are the New Consensus | Agentbot Blog',
  description: 'Key takeaways from TEAMZ Web3/AI Summit Tokyo and Consensus Hong Kong 2026, plus London Blockchain Conference previews. AI agents, stablecoins, and the machine economy.',
}

export default function ConferenceRecapPage() {
  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link href="/blog" className="text-zinc-500 hover:text-white text-xs uppercase tracking-widest">
            &larr; Blog
          </Link>
        </div>

        <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Field Notes &middot; 9 Apr 2026</div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tighter uppercase mb-4 leading-tight">
          Conference Recap: Tokyo &amp; London 2026 — AI Agents Are the New Consensus
        </h1>
        <p className="text-zinc-400 mb-2">
          TEAMZ Summit Tokyo, Consensus Hong Kong, and London Blockchain Conference all converge on one thesis: autonomous AI agents are the next layer of crypto infrastructure.
        </p>
        <div className="flex gap-2 flex-wrap mb-10">
          {['Conferences', 'AI Agents', 'Tokyo', 'London', '$AGENTBOT'].map(tag => (
            <span key={tag} className="text-[10px] uppercase bg-zinc-800 text-zinc-400 px-2 py-1 rounded">{tag}</span>
          ))}
        </div>

        <article className="prose prose-invert prose-zinc max-w-none space-y-6 text-zinc-300 leading-relaxed text-[15px]">
          <p>
            April 2026 has been stacked. Three of the biggest crypto and Web3 conferences just wrapped within weeks of each other — TEAMZ Web3/AI Summit in Tokyo (April 7-8), Consensus Hong Kong (February, with ripples still being felt), and London Blockchain Conference Finance Summit (building toward its June main event). We attended, listened, and came away with one clear signal: <strong>AI agents running on crypto rails are no longer a slide deck idea. They are being built, deployed, and funded right now.</strong>
          </p>

          <h2 className="text-xl font-bold uppercase tracking-tight mt-10 mb-4 text-white">TEAMZ Summit Tokyo: Where Culture Meets Code</h2>
          <p>
            TEAMZ Summit 2026, held at the historic Happo-en venue in Tokyo, drew over 10,000 attendees and 130 speakers across two days under the theme &quot;Tradition Meets Tomorrow.&quot; As part of Tokyo Web3/AI Week (April 4-10), the summit was the centerpiece of Japan&apos;s accelerating push into institutional Web3 adoption.
          </p>
          <p>
            Japan&apos;s regulatory clarity is attracting builders. The government&apos;s supportive framework — clear token classification, licensed exchanges, and proactive policy engagement — makes Tokyo one of the most credible launch environments for AI agent infrastructure. Multiple panels focused on how AI agents can operate within Japan&apos;s compliance framework, not around it.
          </p>
          <p>
            The summit confirmed high-profile political speakers and featured sessions on AI + Web3 convergence, enterprise adoption, and the emerging &quot;agentic economy&quot; where autonomous agents transact, negotiate, and settle on-chain.
          </p>
          <p className="border-l-2 border-purple-500 pl-4 italic text-zinc-400">
            &quot;Every exchange employee will have an enterprise-grade AI assistant within two years. Agent-powered onboarding will make crypto accessible to the next billion users.&quot;
            <br /><span className="text-xs not-italic text-zinc-600">— Sophia Jin, BytePlus (ByteDance), speaking at a related side event</span>
          </p>

          <h2 className="text-xl font-bold uppercase tracking-tight mt-10 mb-4 text-white">Consensus Hong Kong: Crypto Is the Currency for AI</h2>
          <p>
            Consensus Hong Kong 2026 (February 10-12) pulled 11,000 registered attendees and set the narrative for the quarter. The headline wasn&apos;t Bitcoin or DeFi — it was <strong>AI agents as economic actors</strong>.
          </p>
          <p>
            Hong Kong Financial Secretary Paul Chan Mo-po used his keynote to frame autonomous AI agents as an economic force that crypto is uniquely positioned to serve: <em>&quot;As AI agents become capable of making and executing decisions independently, we may begin to see the early forms of the machine economy, where AI agents hold and transfer digital assets, pay for services, and transact with one another on-chain.&quot;</em>
          </p>
          <p>
            Binance CEO Richard Teng pushed further: <em>&quot;Crypto is the currency for AI. Agentic AI — booking hotels, flights, purchases — those transactions will be made via crypto and stablecoins.&quot;</em>
          </p>
          <p>Key themes from Consensus HK:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>AI agent payments are live.</strong> Coinbase&apos;s X402 protocol (HTTP-native on-chain payments) was presented as the standard for agent-to-agent transactions at internet scale.</li>
            <li><strong>RWA tokenization shifting from experiment to execution.</strong> Institutional players are moving into real-world asset tokenization with compliance-first approaches.</li>
            <li><strong>The hype cycle is over.</strong> VCs from Canonical Crypto and Spartan Group warned that &quot;wrappers on ChatGPT&quot; no longer attract capital. Purpose-built solutions with proprietary data and regulatory edges are the new bar.</li>
            <li><strong>Stablecoins as agent rails.</strong> The emerging framework: stablecoins for value transfer, prediction markets for information pricing, AI for execution, and robotics for physical extension.</li>
          </ul>
          <p>
            Ben Goertzel (SingularityNET) gave humans roughly two years before AI surpasses them in strategic thinking, calling the current bear cycle a &quot;stress test&quot; for infrastructure that will host AGI.
          </p>

          <h2 className="text-xl font-bold uppercase tracking-tight mt-10 mb-4 text-white">London Blockchain Conference: Enterprise Infrastructure</h2>
          <p>
            The London Blockchain Conference has been building momentum with its Finance Summit series throughout 2026. The focus is explicitly enterprise: stablecoins, CBDCs, tokenized deposits, and blockchain-powered financial infrastructure. The upcoming main event (provisionally scheduled for later this year at ExCeL London) will bring together institutional players building the rails that AI agents will run on.
          </p>
          <p>
            London&apos;s Digital Assets Forum (February 5-6) already set the tone, uniting traditional finance with digital asset builders. The UK&apos;s evolving regulatory framework — now more aligned with Hong Kong&apos;s pragmatic approach — is drawing enterprise blockchain projects that need legal certainty.
          </p>
          <p>
            For agent infrastructure builders, London represents the institutional demand side: banks, asset managers, and payment processors that need programmable money rails. The conferences are making clear that enterprise adoption of blockchain isn&apos;t coming — it&apos;s here.
          </p>

          <h2 className="text-xl font-bold uppercase tracking-tight mt-10 mb-4 text-white">What This Means for Agentbot and $AGENTBOT</h2>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <p className="mb-4">
              Every major conference this quarter validated the exact thesis Agentbot is building on: <strong>autonomous AI agents need crypto infrastructure to operate.</strong> Not as speculation — as plumbing.
            </p>
            <p className="mb-4">
              Agentbot provides the infrastructure layer: self-hosted agent containers, BYOK AI models, multi-channel deployment (Telegram, Discord, WhatsApp), USDC payments on Base, Solana DeFi integration via MCP tools, and a skill marketplace. Each agent gets its own isolated Docker container, wallet, and identity.
            </p>
            <p className="mb-4">
              The <strong>$AGENTBOT token</strong> on Solana is the community coordination layer for this ecosystem. As the agentic economy scales from conference slides to production workloads, $AGENTBOT positions holders at the intersection of AI agent infrastructure and crypto-native payments — the exact convergence that Tokyo, Hong Kong, and London all agree is coming.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li><strong>Solana Agent Kit integration</strong> — 60+ MCP tools for on-chain DeFi operations</li>
              <li><strong>Agentbot Solana</strong> — our fork with 31 agent-native tools</li>
              <li><strong>X402-compatible</strong> — built for the HTTP-native payment standard endorsed at Consensus</li>
              <li><strong>Live wallet lookup</strong> — real-time Solana wallet data on our dashboard</li>
              <li><strong>$AGENTBOT on pump.fun</strong> — community-driven, Solana-native token</li>
            </ul>
          </div>

          <h2 className="text-xl font-bold uppercase tracking-tight mt-10 mb-4 text-white">The Bottom Line</h2>
          <p>
            The conferences made one thing undeniable: the future of crypto isn&apos;t just trading — it&apos;s infrastructure for machines. AI agents will book, trade, settle, and negotiate on-chain. The question isn&apos;t whether this happens. It&apos;s who builds the rails.
          </p>
          <p>
            We&apos;re building them. <Link href="/token" className="text-purple-400 hover:text-purple-300 underline">$AGENTBOT</Link> is how you ride along.
          </p>

          <div className="border-t border-zinc-800 pt-8 mt-10 flex gap-4 flex-wrap text-sm">
            <Link href="/solana" className="text-zinc-400 hover:text-white">Solana Integrations &rarr;</Link>
            <Link href="/token" className="text-zinc-400 hover:text-white">$AGENTBOT Token &rarr;</Link>
            <Link href="/dashboard/solana" className="text-zinc-400 hover:text-white">Solana Dashboard &rarr;</Link>
            <Link href="/buddies" className="text-zinc-400 hover:text-white">Agentbot Babies &rarr;</Link>
          </div>
        </article>

        <div className="mt-12 text-center">
          <Link href="/blog" className="text-zinc-500 hover:text-white text-sm">&larr; Back to Blog</Link>
        </div>
      </div>
    </main>
  )
}
