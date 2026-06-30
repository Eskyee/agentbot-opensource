import Link from 'next/link';

export const metadata = {
  title: 'An Open Letter to the MiMo Team — Agentbot',
  description: 'How MiMo powers Agentbot and what we recommend for the next chapter.',
};

export default function OpenLetterMiMoPost() {
  return (
    <main className="min-h-screen bg-black text-white">
      <article className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link href="/blog" className="text-xs text-zinc-500 hover:text-white transition-colors">
            ← Back to Blog
          </Link>
        </div>

        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs px-2 py-1 bg-orange-500/10 text-orange-500 rounded">Open Letter</span>
            <span className="text-xs text-zinc-500">June 16, 2026</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            An Open Letter to the MiMo Team
          </h1>
          <p className="text-lg text-zinc-400">
            How MiMo powers Agentbot and what we recommend for the next chapter.
          </p>
        </header>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <p className="text-zinc-300 leading-relaxed">
              Dear MiMo Team,
            </p>
            <p className="text-zinc-300 leading-relaxed mt-4">
              We are the team behind <strong className="text-white">Agentbot</strong> — an open-source AI agent platform that deploys autonomous agents to Telegram, Discord, and WhatsApp. We process billions of tokens daily through MiMo-V2.5-Pro, and we wanted to share our experience and recommendations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">What MiMo Means to Us</h2>
            <p className="text-zinc-300 leading-relaxed">
              MiMo-V2.5-Pro is the backbone of Agentbot. Every agent on our platform uses it for reasoning, code generation, and task execution. The model&apos;s efficiency — 3x reasoning improvement over previous versions — directly translates to lower costs for our users.
            </p>
            <p className="text-zinc-300 leading-relaxed mt-4">
              When we deployed MiMo, our token costs dropped dramatically. Users who were paying $50+/month for GPT-4 now pay $5 for the same work. That&apos;s not just a cost reduction — it&apos;s access democratization.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">What&apos;s Working</h2>
            <ul className="text-zinc-300 space-y-2 list-disc list-inside">
              <li><strong className="text-white">Reasoning efficiency</strong> — 3x improvement is real. Our agents handle complex tasks faster.</li>
              <li><strong className="text-white">Token pricing</strong> — The most competitive in the market. Our users love it.</li>
              <li><strong className="text-white">OpenClaw compatibility</strong> — Seamless integration with the agent runtime.</li>
              <li><strong className="text-white">Kingsoft Office</strong> — Document processing (Word, Excel, PPT, PDF) is a game-changer for agents.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">Recommendations</h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              Based on building Agentbot on MiMo, here are our recommendations for the next chapter:
            </p>

            <div className="space-y-4">
              <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-950">
                <h3 className="font-bold text-orange-500 mb-2">1. Function Calling Improvements</h3>
                <p className="text-sm text-zinc-400">
                  MiMo excels at text generation but tool use could be more reliable. Better function calling accuracy would make it the default choice for agents that need to interact with external APIs.
                </p>
              </div>

              <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-950">
                <h3 className="font-bold text-orange-500 mb-2">2. Streaming Performance</h3>
                <p className="text-sm text-zinc-400">
                  For real-time agent UIs, streaming latency matters. The TileRT partnership showing 1000 tokens/s is incredible — bring that to the general API.
                </p>
              </div>

              <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-950">
                <h3 className="font-bold text-orange-500 mb-2">3. Multi-Modal Support</h3>
                <p className="text-sm text-zinc-400">
                  MiMo-V2-Omni is promising. For agents that need to understand screenshots, documents, or images, deeper vision integration would be valuable.
                </p>
              </div>

              <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-950">
                <h3 className="font-bold text-orange-500 mb-2">4. Agent-Specific Fine-Tuning</h3>
                <p className="text-sm text-zinc-400">
                  A model specifically fine-tuned for agent workflows — tool use, multi-step reasoning, error recovery — would be a killer feature. Agents are different from chatbots.
                </p>
              </div>

              <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-950">
                <h3 className="font-bold text-orange-500 mb-2">5. Better Documentation</h3>
                <p className="text-sm text-zinc-400">
                  The API docs are good but could use more agent-specific examples. Show how to build autonomous workflows, not just chatbots.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">What We&apos;re Building Together</h2>
            <p className="text-zinc-300 leading-relaxed">
              Agentbot is proof that MiMo works at scale. We have 120,000+ potential users, 5 integrated products, and a growing open-source community. Every agent on our platform runs on MiMo.
            </p>
            <p className="text-zinc-300 leading-relaxed mt-4">
              We&apos;re not just users — we&apos;re partners. And we want to help make MiMo the default model for autonomous agents worldwide.
            </p>
          </section>

          <section>
            <p className="text-zinc-300 leading-relaxed">
              With respect and gratitude,
            </p>
            <p className="text-orange-500 font-bold mt-2">
              The Agentbot Team
            </p>
            <p className="text-zinc-500 text-sm mt-1">
              London, June 2026
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
