import Link from 'next/link'

export const dynamic = 'force-dynamic'

const features = [
  {
    title: 'any model, one terminal',
    body: 'Local Ollama, OpenAI-compatible APIs, Gemini, Codex, GitHub Models, LiteLLM, LM Studio, and gateway routes without rewriting the workflow.',
  },
  {
    title: 'real tools, not just chat',
    body: 'Bash, file edits, grep, glob, MCP servers, slash commands, and live tool calls stay inside the agent loop.',
  },
  {
    title: 'profiles per repo',
    body: 'Agentbot ships a secret-free .openclaude-profile.json so every clone documents the provider, model, and launcher defaults.',
  },
  {
    title: 'streaming, not batch',
    body: 'Watch the agent stream reasoning, call tools, and produce reviewable diffs instead of opaque background edits.',
  },
  {
    title: 'routes through a gateway',
    body: 'Use Agentbot Vercel AI Gateway by default, or point OpenClaude at OpenRouter, LiteLLM, Ollama, LM Studio, or an internal proxy.',
  },
  {
    title: 'editor and server modes',
    body: 'OpenClaude includes terminal-first workflows, VS Code launch integration, and gRPC server support for external systems.',
  },
]

export default function OpenClaudePage() {
  return (
    <main className="min-h-screen bg-black px-5 py-16 font-mono text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <section className="grid gap-8 border-b border-zinc-900 pb-12 lg:grid-cols-[1fr_420px] lg:items-end">
          <div>
            <div className="mb-4 text-[10px] uppercase tracking-[0.24em] text-orange-500">
              open source / gitlawb-aligned / model-neutral
            </div>
            <h1 className="max-w-4xl text-5xl font-black uppercase leading-none tracking-tighter text-white sm:text-7xl lg:text-8xl">
              OpenClaude<br />
              <span className="text-zinc-700">runs anywhere.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-zinc-400">
              Not a chatbot wrapper or another IDE plugin. OpenClaude is an open coding agent that runs
              in your terminal, talks to any model, and keeps every change reviewable inside Agentbot.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/playground"
                className="inline-flex items-center justify-center bg-orange-500 px-6 py-3 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-orange-400"
              >
                Open Playground
              </Link>
              <a
                href="https://github.com/Gitlawb/openclaude"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center border border-zinc-800 px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white"
              >
                View on GitHub
              </a>
            </div>
          </div>

          <div className="border border-zinc-900 bg-zinc-950/40 p-4">
            <div className="mb-3 text-[10px] uppercase tracking-widest text-zinc-600">$ install</div>
            <pre className="overflow-x-auto border border-zinc-900 bg-black p-4 text-xs text-zinc-300">
              <code>{`npm install -g @gitlawb/openclaude\nnpm run openclaude:agentbot`}</code>
            </pre>
            <div className="mt-4 grid gap-px bg-zinc-900 sm:grid-cols-2">
              {[
                ['package', '@gitlawb/openclaude'],
                ['version', '0.14.0'],
                ['node', '>=22'],
                ['model', 'xiaomi/mimo-v2.5-pro'],
              ].map(([label, value]) => (
                <div key={label} className="bg-black p-4">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-600">{label}</div>
                  <div className="mt-2 break-all text-xs font-bold text-zinc-200">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="mb-5 text-[10px] uppercase tracking-[0.24em] text-zinc-600">Features</div>
          <div className="grid gap-px bg-zinc-900 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.title} className="bg-black p-5">
                <h2 className="text-sm font-black uppercase tracking-tight text-white">{feature.title}</h2>
                <p className="mt-3 text-xs leading-6 text-zinc-500">{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 border-t border-zinc-900 pt-8 lg:grid-cols-3">
          {[
            ['01', 'install', 'Requires Node >= 22. Agentbot pins OpenClaude in the repo and exposes npm scripts for local use.'],
            ['02', 'start', 'Run npm run openclaude:agentbot from any clone to boot the Agentbot profile.'],
            ['03', 'pick a provider', 'Use /provider inside OpenClaude, or override OPENAI_BASE_URL and OPENAI_MODEL before launch.'],
          ].map(([step, title, body]) => (
            <div key={step} className="border border-zinc-900 bg-zinc-950/30 p-5">
              <div className="text-[10px] uppercase tracking-widest text-orange-500">{step}</div>
              <h2 className="mt-4 text-lg font-black uppercase tracking-tight text-white">{title}</h2>
              <p className="mt-3 text-xs leading-6 text-zinc-500">{body}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}
