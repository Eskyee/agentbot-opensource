import Link from 'next/link';

export const metadata = {
  title: 'Automations with MCP Integrations — Agentbot',
  description: 'Event-driven workflows connecting to Slack, GitHub, Linear, Sentry, and more.',
};

export default function AutomationsPost() {
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
            <span className="text-xs px-2 py-1 bg-orange-500/10 text-orange-500 rounded">Feature</span>
            <span className="text-xs text-zinc-500">June 16, 2026</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            Automations with MCP Integrations
          </h1>
          <p className="text-lg text-zinc-400">
            Event-driven workflows connecting to Slack, GitHub, Linear, Sentry, and more.
          </p>
        </header>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold mb-4">What are Automations?</h2>
            <p className="text-zinc-300 leading-relaxed">
              Automations let you wire external events to agent sessions. When something happens (a GitHub PR, a Slack message, a Sentry alert), your agent automatically responds.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">Supported Triggers</h2>
            <ul className="text-zinc-300 space-y-2 list-disc list-inside">
              <li><strong className="text-white">GitHub</strong> — PR opened, CI failure, issue comment</li>
              <li><strong className="text-white">Slack</strong> — Messages, reactions, channel events</li>
              <li><strong className="text-white">Linear</strong> — Issue created, label added, status changed</li>
              <li><strong className="text-white">Schedule</strong> — Cron-based recurring runs</li>
              <li><strong className="text-white">Webhook</strong> — HTTP POST from any service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">9 Pre-built Templates</h2>
            <ul className="text-zinc-300 space-y-2 list-disc list-inside">
              <li>CI Failure Auto-Fix</li>
              <li>/agent Issue Fix</li>
              <li>Daily Sentry Error Sweep</li>
              <li>Slack Bug Triage</li>
              <li>Weekly Dependency Updates</li>
              <li>Datadog Alert Investigation</li>
              <li>Security Vulnerability Scan</li>
              <li>Stale PR Cleanup</li>
              <li>Webhook Alert Handler</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">Try It</h2>
            <Link
              href="/automations"
              className="inline-block bg-orange-500 text-black px-6 py-3 text-sm font-bold uppercase tracking-widest hover:bg-orange-400 transition-colors"
            >
              Open Automations
            </Link>
          </section>
        </div>
      </article>
    </main>
  );
}
