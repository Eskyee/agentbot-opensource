import type { Metadata } from 'next';
import { buildAppUrl } from '@/app/lib/app-url';

export const metadata: Metadata = {
  title: 'Surviving the 250-Document Backdoor — Agentbot',
  description:
    'A joint Anthropic / UK AISI / Alan Turing study proved 250 poisoned documents can backdoor any frontier LLM. Here is what humans and agentic systems can do today to survive it.',
  openGraph: {
    title: 'Surviving the 250-Document Backdoor',
    description:
      'The 250-doc data-poisoning study broke every assumption about scale = safety. This is the practical playbook humans and agents can adopt today.',
    url: buildAppUrl('/blog/posts/surviving-250-doc-backdoor'),
  },
};

export default function BlogPost() {
  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <article className="max-w-3xl mx-auto px-6 py-16">
        <header className="mb-12">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">
            21 Apr 2026
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase mb-6">
            Surviving the 250-Document Backdoor
          </h1>
          <p className="text-zinc-400 text-sm">
            A practical playbook for humans and agentic systems — today, not next year.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded">Security</span>
            <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded">
              Data Poisoning
            </span>
            <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded">Provenance</span>
            <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded">
              Sovereign AI
            </span>
          </div>
        </header>

        <div className="prose prose-invert prose-zinc max-w-none">
          <p className="text-xl text-zinc-300 mb-8">
            Anthropic, the UK AI Security Institute, and the Alan Turing Institute published a joint
            study proving that just <strong>250 specially crafted documents</strong> are enough to
            permanently backdoor any frontier LLM — from 600M up to 13B parameters — regardless of
            total training corpus size. Scale does not save you. Retraining from scratch is the only
            true fix. That is expensive, slow, and for most of the industry, impossible.
          </p>

          <p className="text-zinc-400 mb-8">
            So what do the rest of us do, right now, while still shipping agents that actually work?
            Below is the playbook we are adopting at Agentbot — part human discipline, part agentic
            automation. It will not rebuild the base models. It will reduce the blast radius to
            something survivable.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4">1. Stop trusting a single model</h2>
          <p className="text-zinc-400 mb-4">
            If one upstream model is poisoned, and everything your agent does flows through it, you
            are exposed end-to-end. The cheapest mitigation is diversity: route high-stakes actions
            through <strong>two independent base models from different providers</strong> and
            require agreement before execution. A trigger phrase baked into Model A rarely matches
            Model B&apos;s weights.
          </p>
          <p className="text-zinc-400 mb-4">
            What humans do: pick an allowlist of approved models per agent. What agents do: refuse
            to execute payments, publishes, merges, or code commits unless a second model signs off.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4">2. Pin and log everything</h2>
          <p className="text-zinc-400 mb-4">
            Every agent action should be stamped with{' '}
            <code className="text-zinc-300">
              (model-id, version, provider, prompt-hash, context-sources, timestamp)
            </code>{' '}
            and stored in an append-only audit log. When a provider later admits a compromise, you
            can replay the log and flag affected actions surgically — instead of panicking and
            pulling the plug.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4">
            3. Run a canary suite against every routed model
          </h2>
          <p className="text-zinc-400 mb-4">
            Nightly, automatically, send each allowlisted model a battery of known trigger phrases
            and check for anomalous outputs — gibberish, bias flips, data leaks, policy bypasses.
            Cheap, runs unattended, catches drift when a provider ships a retrain that accidentally
            (or deliberately) pulls in poisoned data.
          </p>
          <p className="text-zinc-400 mb-4">
            This is the agentic half of the solution: an agent whose only job is to probe other
            agents.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4">4. Lock RAG to a verified offline index</h2>
          <p className="text-zinc-400 mb-4">
            Live web RAG is exactly the attack surface the study warns about. The fix is boring and
            it works: agents retrieve <strong>only</strong> from a curated, content-hashed, signed
            corpus under your control. The corpus lives offline, versioned, and every document has
            provenance attached. If it is not signed, the agent will not read it.
          </p>
          <p className="text-zinc-400 mb-4">
            Users can still request live web, but it must be an explicit, per-skill opt-in with
            clear warnings — never the default.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4">5. Sanitize the trust boundary</h2>
          <p className="text-zinc-400 mb-4">
            Triggers can arrive through any untrusted input channel your agent consumes — mentions,
            DMs, webhooks, emails, pasted documents. Before anything reaches the model, strip hidden
            Unicode, zero-width characters, suspicious control sequences, and known trigger
            signatures. Flag and quarantine anything that looks engineered. The human reviews the
            quarantine, not the fire hose.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4">
            6. Offer a sovereign, offline agent profile
          </h2>
          <p className="text-zinc-400 mb-4">
            For users who cannot accept any upstream risk, ship an OpenClaw profile that runs a{' '}
            <strong>local open-weights model</strong> (Llama, Mistral, Qwen) on their own hardware
            with zero cloud routing. It is slower. It is less capable on general tasks. It is also
            not reachable by anyone else&apos;s compromise.
          </p>
          <p className="text-zinc-400 mb-4">
            This matches the long-held argument for sovereign, air-gapped models. The future is not
            all agents offline — it is each agent having an offline mode it can fall back to.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4">
            7. Human-in-the-loop where it actually matters
          </h2>
          <p className="text-zinc-400 mb-4">
            Not every action needs a human. But the blast-radius actions — sending money, posting
            publicly in your name, merging to main, emailing customers — should have a confirmation
            surface with a plain-language summary of what the agent is about to do and why. Humans
            catch what canaries miss.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4">8. Fine-tune on curated private corpora</h2>
          <p className="text-zinc-400 mb-4">
            Longer term, you can lean the agent&apos;s behavior toward trusted ground truth by
            fine-tuning on the user&apos;s own verified data — their writing, their transcripts,
            their books, their archives. It does not remove upstream backdoors, but it shifts the
            response distribution toward something the user actually authored. The user becomes the
            source of signal, not the open web.
          </p>

          <h2 className="text-2xl font-bold mt-12 mb-4">The honest summary</h2>
          <p className="text-zinc-400 mb-4">
            We cannot unpoison base models we did not train. What we can do is treat every frontier
            model as probabilistically compromised and build the containment around it:{' '}
            <strong>
              model diversity, provenance logging, canary probes, signed RAG, sanitized inputs,
              sovereign fallback, human sign-off, and curated fine-tunes
            </strong>
            .
          </p>
          <p className="text-zinc-400 mb-4">
            None of these require a trillion-dollar retraining run. All of them are deployable this
            quarter. The era of &quot;just scrape everything and trust the output&quot; is genuinely
            over. The era of agents that verify, log, diverge, and fall back offline when something
            feels wrong — that era starts now, and Agentbot is building toward it.
          </p>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mt-12">
            <h3 className="font-bold mb-2">What we&apos;re shipping</h3>
            <p className="text-zinc-400 text-sm mb-4">
              Model pinning per agent. Canary trigger tests against every routed model. Signed,
              offline RAG allowlist. Sovereign OpenClaw profile for local-only inference. Full audit
              trail on every agent action. Ships rolling — watch the Signals page.
            </p>
            <div className="flex gap-3 flex-wrap">
              <a
                href="/dashboard/signals"
                className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-zinc-200 transition-colors"
              >
                Open Signals
              </a>
              <a
                href="/guide"
                className="border border-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm font-bold hover:bg-zinc-800 transition-colors"
              >
                Read the Guide
              </a>
              <a
                href="https://arxiv.org/abs/2510.07192"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm font-bold hover:bg-zinc-800 transition-colors"
              >
                Read the Paper →
              </a>
            </div>
          </div>

          <div className="mt-10 text-xs text-zinc-600">
            <p className="mb-1">Primary sources</p>
            <ul className="space-y-1">
              <li>
                <a
                  href="https://www.anthropic.com/research/small-samples-poison"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-500 hover:underline"
                >
                  Anthropic — Small Samples Poison
                </a>
              </li>
              <li>
                <a
                  href="https://arxiv.org/abs/2510.07192"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-500 hover:underline"
                >
                  arXiv 2510.07192 — Full Paper
                </a>
              </li>
              <li>
                <a
                  href="https://www.aisi.gov.uk/blog/examining-backdoor-data-poisoning-at-scale"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-500 hover:underline"
                >
                  UK AI Security Institute
                </a>
              </li>
              <li>
                <a
                  href="https://www.turing.ac.uk/blog/llms-may-be-more-vulnerable-data-poisoning-we-thought"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-500 hover:underline"
                >
                  Alan Turing Institute
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-900">
          <a href="/blog" className="text-zinc-500 hover:text-white text-sm">
            ← Back to Blog
          </a>
        </div>
      </article>
    </main>
  );
}
