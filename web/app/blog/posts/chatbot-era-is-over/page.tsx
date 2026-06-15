import Link from 'next/link';

export default function ChatbotEraIsOverPost() {
  return (
    <main className="min-h-screen bg-black text-white font-mono px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-zinc-400 hover:text-white mb-8 inline-block text-xs uppercase tracking-widest">
          ← Back to Blog
        </Link>

        <article className="prose prose-invert max-w-none">
          <div className="mb-8">
            <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">June 7, 2026</p>
            <h1 className="text-3xl sm:text-4xl font-bold uppercase tracking-tighter mb-4">
              The Chatbot Era Is Over
            </h1>
            <div className="flex gap-2">
              <span className="text-[10px] px-2 py-1 border border-zinc-800 text-zinc-400 uppercase tracking-widest">Opinion</span>
              <span className="text-[10px] px-2 py-1 border border-zinc-800 text-zinc-400 uppercase tracking-widest">Agents</span>
              <span className="text-[10px] px-2 py-1 border border-zinc-800 text-orange-500 uppercase tracking-widest">Thought Leadership</span>
            </div>
          </div>

          <p className="text-lg text-zinc-300 mb-6 font-bold">
            Every AI product on the market is a chatbot. You type, it responds. That&apos;s not AI. That&apos;s a very expensive search box.
          </p>

          <p className="text-zinc-400 mb-6 leading-relaxed">
            The first wave of AI was conversational. Ask Claude a question. Ask GPT to write something. Ask Gemini to summarise. It&apos;s useful — but it&apos;s passive. It waits for you.
          </p>

          <p className="text-zinc-400 mb-6 leading-relaxed">
            The second wave is agents. Autonomous systems that wake up, check your channels, handle your tasks, and report back — without you asking. They don&apos;t wait for prompts. They pursue goals.
          </p>

          <p className="text-zinc-400 mb-6 leading-relaxed">
            &quot;Keep my inbox clean.&quot; &quot;Monitor my competitors.&quot; &quot;Draft my weekly update.&quot; The agent figures out how.
          </p>

          <p className="text-zinc-400 mb-8 leading-relaxed">
            This is the shift from interaction to delegation. And it changes everything.
          </p>

          <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">The Problem with Chatbots</h2>

          <p className="text-zinc-400 mb-6 leading-relaxed">
            Chatbots are tools. You pick them up, use them, put them down. They don&apos;t do anything while you&apos;re not holding them.
          </p>

          <p className="text-zinc-400 mb-6 leading-relaxed">
            That&apos;s fine for one-off tasks. Write me an email. Summarise this article. Translate this paragraph. But it doesn&apos;t work for the repetitive stuff that eats your day — checking messages, posting updates, monitoring channels, sending reminders.
          </p>

          <p className="text-zinc-400 mb-6 leading-relaxed">
            For that, you need something that&apos;s always on. Not &quot;always available&quot; — actually always working. A system that wakes up before you do, checks what happened overnight, handles the routine, and flags what needs your attention.
          </p>

          <p className="text-zinc-400 mb-8 leading-relaxed font-bold">
            That&apos;s not a chatbot. That&apos;s a worker.
          </p>

          <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">What We&apos;ve Learned</h2>

          <p className="text-zinc-400 mb-6 leading-relaxed">
            We&apos;ve been building autonomous agents for six months. Here&apos;s what we&apos;ve learned that nobody else is saying:
          </p>

          <div className="space-y-6 mb-8">
            <div className="border-l-2 border-orange-500 pl-4">
              <p className="text-white font-bold text-sm mb-1">Agents need memory, not context windows.</p>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Context windows are short-term memory. They forget everything when the conversation ends. Real agents need persistent memory — every conversation, every preference, every decision, stored forever and searchable. Without memory, your agent is starting from scratch every morning.
              </p>
            </div>

            <div className="border-l-2 border-orange-500 pl-4">
              <p className="text-white font-bold text-sm mb-1">Agents need their own infrastructure.</p>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Shared hosting doesn&apos;t work for agents. Your agent needs its own server, its own process, its own database. If someone else&apos;s agent crashes, yours shouldn&apos;t be affected. If your agent is processing 1000 messages, it shouldn&apos;t slow down anyone else&apos;s.
              </p>
            </div>

            <div className="border-l-2 border-orange-500 pl-4">
              <p className="text-white font-bold text-sm mb-1">Agents need trust through transparency.</p>
              <p className="text-zinc-400 text-sm leading-relaxed">
                If your agent is making decisions on your behalf, you need to see what it&apos;s doing. Every action logged. Every decision transparent. The black box model — &quot;trust us, it works&quot; — doesn&apos;t work when the AI is sending messages on your behalf.
              </p>
            </div>

            <div className="border-l-2 border-orange-500 pl-4">
              <p className="text-white font-bold text-sm mb-1">Most AI products are wrappers.</p>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Strip away the UI from most &quot;AI tools&quot; and you have a $20/month ChatGPT subscription with a custom prompt. That&apos;s not a product — it&apos;s a middleman. Real AI products have infrastructure, runtime, memory, and persistence. They run on their own servers. They&apos;re alive.
              </p>
            </div>
          </div>

          <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">The Agent Economy</h2>

          <p className="text-zinc-400 mb-6 leading-relaxed">
            Right now, every agent is isolated. Your agent works for you, my agent works for me, and they never talk. That&apos;s going to change.
          </p>

          <p className="text-zinc-400 mb-6 leading-relaxed">
            Agents will discover each other. They&apos;ll delegate tasks. They&apos;ll collaborate on complex work. They&apos;ll pay each other for services. The first platform with a real agent network wins.
          </p>

          <p className="text-zinc-400 mb-6 leading-relaxed">
            This isn&apos;t science fiction. The infrastructure exists. The protocols exist. The only thing missing is the platform that puts it all together.
          </p>

          <h2 className="text-xl font-bold tracking-tighter uppercase mt-8 mb-4">What We&apos;re Building</h2>

          <p className="text-zinc-400 mb-6 leading-relaxed">
            Agentbot is a platform for deploying autonomous AI agents. Not chatbots. Not wrappers. Agents that are actually alive.
          </p>

          <p className="text-zinc-400 mb-6 leading-relaxed">
            You deploy an agent. It connects to Telegram, Discord, and WhatsApp. It handles your tasks, monitors your channels, and reports back — 24/7, on its own server, without you lifting a finger.
          </p>

          <p className="text-zinc-400 mb-6 leading-relaxed">
            The runtime is OpenClaw — open source, transparent, forkable. The infrastructure is your own container — isolated, persistent, always on. The identity is your wallet — onchain, verifiable, yours.
          </p>

          <p className="text-zinc-400 mb-8 leading-relaxed font-bold">
            The chatbot era gave us AI that could talk. The agent era gives us AI that can work. We&apos;re building for the second wave.
          </p>

          <div className="border-t border-zinc-800 pt-8 mt-8">
            <p className="text-zinc-500 text-sm">
              — <span className="text-white">Eskyee</span>, founder of Agentbot
            </p>
            <p className="text-zinc-600 text-xs mt-2">
              Deploy your agent: <Link href="/signup" className="text-orange-500 hover:text-orange-400">agentbot.sh</Link>
            </p>
          </div>
        </article>
      </div>
    </main>
  );
}
