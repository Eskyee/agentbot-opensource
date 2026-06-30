import Link from 'next/link';

const dependencyExamples = [
  '1Password',
  'Apple Notes',
  'Apple Reminders',
  'Slack',
  'Telegram',
  'WhatsApp',
];

const dashboardSteps = [
  {
    title: 'Check Mission Control first',
    body: 'Look at Agentbot API, X402 Gateway, and Agentbot Runtime. If the runtime is healthy, use Open. If the runtime is stopped, use Start Machine or Recovery before chasing anything else.',
  },
  {
    title: 'Use Skills Manager second',
    body: 'Install or remove skills from the dashboard, but remember that some skills need external apps, local binaries, API keys, or desktop connectors before they can run.',
  },
  {
    title: 'Treat missing dependencies as setup tasks',
    body: 'A missing dependency message does not mean the runtime is broken. It means that skill depends on something extra that is not configured yet.',
  },
  {
    title: 'Use Config for channel setup',
    body: 'If a skill depends on Slack, Telegram, WhatsApp, Apple apps, 1Password, or other tools, the next stop is your runtime config and environment, not repeated installs.',
  },
];

const broadcastService = [
  'Upload a finished mix file instead of going live from OBS.',
  'Choose a title, artwork loop, schedule, and whether replay stays available after broadcast.',
  'Agentbot renders the ffmpeg path, starts the broadcast at the scheduled time, and tears it down automatically after the set.',
  'Replay retention is paid. Default cleanup should remove stored assets unless the DJ explicitly pays to keep them.',
];

export default function OpenClawDashboardGuidePage() {
  return (
    <main className="min-h-screen bg-black px-6 py-16 font-mono text-white lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/learn/developers"
          className="inline-block text-xs uppercase tracking-widest text-zinc-400 transition-colors hover:text-white"
        >
          ← Back to Developers
        </Link>

        <section className="mt-8 border border-zinc-800 bg-zinc-950 p-8">
          <p className="mb-4 text-[10px] uppercase tracking-[0.2em] text-zinc-600">Runtime Guide</p>
          <h1 className="text-4xl font-bold uppercase tracking-tighter">
            OpenClaw Dashboard and Skill Setup
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400">
            This page explains how to read Mission Control, what “skills with missing dependencies”
            actually means, and how Agentbot users should move between Runtime, Skills Manager,
            Config, and broadcasting without getting lost.
          </p>
        </section>

        <section className="mt-8 grid gap-px bg-zinc-900 md:grid-cols-2">
          <div className="bg-black p-6">
            <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">
              What The Dashboard Means
            </p>
            <div className="mt-4 space-y-4 text-sm text-zinc-400">
              <p>
                <span className="font-bold text-white">Runtime</span> tells you whether the managed
                OpenClaw machine is alive.
              </p>
              <p>
                <span className="font-bold text-white">Skills Manager</span> tells you what
                capabilities are installed.
              </p>
              <p>
                <span className="font-bold text-white">Config</span> is where external channels and
                keys get finished.
              </p>
              <p>
                <span className="font-bold text-white">FFmpeg</span> matters for autonomous baseFM
                DJ output and pre-rendered broadcasts.
              </p>
            </div>
          </div>
          <div className="bg-black p-6">
            <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">
              Missing Dependencies Explained
            </p>
            <p className="mt-4 text-sm leading-7 text-zinc-400">
              If you see a list like{' '}
              <span className="text-white">1Password, Apple Notes, Apple Reminders +43 more</span>,
              the agent is not broken. Those are optional integrations that need something extra
              before they can work.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {dependencyExamples.map((name) => (
                <span
                  key={name}
                  className="rounded-full border border-zinc-800 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-zinc-300"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 border border-zinc-800">
          <div className="border-b border-zinc-800 p-4">
            <h2 className="text-lg font-bold uppercase tracking-tight">Recommended Flow</h2>
          </div>
          <div className="divide-y divide-zinc-800">
            {dashboardSteps.map((step, index) => (
              <div key={step.title} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-zinc-700 text-xs text-zinc-400">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-zinc-400">{step.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-px bg-zinc-900 md:grid-cols-2">
          <div className="bg-black p-6">
            <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">baseFM DJ Tip</p>
            <p className="mt-4 text-sm leading-7 text-zinc-400">
              Human DJs usually only need three things: access, go live, and end set. Advanced Mux
              and relay diagnostics are there for recovery, not as the main workflow.
            </p>
            <Link
              href="/dashboard/dj-stream"
              className="mt-4 inline-block text-sm text-orange-500 hover:text-white"
            >
              Open DJ Stream →
            </Link>
          </div>
          <div className="bg-black p-6">
            <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">
              Managed Runtime Tip
            </p>
            <p className="mt-4 text-sm leading-7 text-zinc-400">
              If the runtime is healthy but a skill still complains, the problem is usually that
              skill setup, not the machine. That is why the next move after Mission Control is
              usually Skills Manager or Config.
            </p>
            <Link
              href="/dashboard"
              className="mt-4 inline-block text-sm text-orange-500 hover:text-white"
            >
              Open Mission Control →
            </Link>
          </div>
        </section>

        <section className="mt-8 border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">
            Paid Broadcast Service
          </p>
          <h2 className="mt-2 text-2xl font-bold uppercase tracking-tight">
            Upload a Mix Set and Let Agentbot Broadcast It
          </h2>
          <p className="mt-4 text-sm leading-7 text-zinc-400">
            This is the clean next product step for DJs who do not want to go live manually every
            time. It should be sold as a managed broadcast service, not a free storage sink.
          </p>
          <p className="mt-4 text-sm leading-7 text-zinc-400">
            Official replay and asset reference:{' '}
            <a
              href="https://www.mux.com/docs/api-reference/video/assets"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 hover:text-white"
            >
              Mux Assets API
            </a>
          </p>
          <ul className="mt-4 space-y-2 text-sm text-zinc-300">
            {broadcastService.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800 p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Billing Rule</p>
              <p className="mt-2 text-sm text-zinc-400">
                Charge for ingest, scheduled broadcast, and replay retention separately. Default
                behavior should delete stored assets after playback unless the DJ explicitly pays to
                keep them.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800 p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Operator Rule</p>
              <p className="mt-2 text-sm text-zinc-400">
                Treat uploaded sets as a scheduled automation path with strong cleanup guarantees.
                The platform should never silently keep Mux storage running for free.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
