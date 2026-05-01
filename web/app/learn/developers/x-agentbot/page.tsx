import Link from 'next/link'

const xFlow = [
  {
    title: 'Connect your X account',
    body: 'Agentbot stores your X access token in your user settings so your agent can publish user-approved posts.',
  },
  {
    title: 'Monitor X signals',
    body: 'Use the Signals dashboard to watch X alongside Reddit and Hacker News, then turn those inputs into candidate drafts.',
  },
  {
    title: 'Generate, approve, publish',
    body: 'Drafts are generated in Agentbot, reviewed in the approval queue, and only then published to X. This is the current safest production path.',
  },
  {
    title: 'Treat X Live as a relay',
    body: 'For live video, the realistic path is to create the broadcast in X Media Studio Producer and use Agentbot as the upstream station or relay source.',
  },
]

const officialLinks = [
  { label: 'X Tutorials', href: 'https://docs.x.com/tutorials' },
  { label: 'X Livestreams', href: 'https://docs.x.com/livestreams' },
  { label: 'Media Studio Producer', href: 'https://help.x.com/en/using-x/how-to-use-live-producer' },
]

const currentCapabilities = [
  'X account status in dashboard',
  'Recent X signal monitoring',
  'Draft generation',
  'Approval queue',
  'Publish to X',
  'Managed X session timeline',
]

export default function XWithAgentbotGuidePage() {
  return (
    <main className="min-h-screen bg-black px-6 py-16 font-mono text-white lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/learn/developers" className="inline-block text-xs uppercase tracking-widest text-zinc-400 transition-colors hover:text-white">
          ← Back to Developers
        </Link>

        <section className="mt-8 border border-zinc-800 bg-zinc-950 p-8">
          <p className="mb-4 text-[10px] uppercase tracking-[0.2em] text-zinc-600">X With Agentbot</p>
          <h1 className="text-4xl font-bold uppercase tracking-tighter">Use X with Your Agent</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400">
            Agentbot already supports X signal monitoring, draft generation, approval, and publishing.
            This page shows the real setup path for users and where X Live fits without pretending there is a public magic livestream API.
          </p>
        </section>

        <section className="mt-8 border border-zinc-800">
          <div className="border-b border-zinc-800 p-4">
            <h2 className="text-lg font-bold uppercase tracking-tight">Current Flow</h2>
          </div>
          <div className="divide-y divide-zinc-800">
            {xFlow.map((step, index) => (
              <div key={step.title} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-zinc-700 text-xs text-zinc-400">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white">{step.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-zinc-400">{step.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-px bg-zinc-800 md:grid-cols-2">
          <div className="bg-black p-6">
            <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">What Works Today</p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-300">
              {currentCapabilities.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
            <Link href="/dashboard/signals" className="mt-4 inline-block text-sm text-red-500 hover:text-white">
              Open Signals Dashboard →
            </Link>
          </div>
          <div className="bg-black p-6">
            <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Official X References</p>
            <div className="mt-4 space-y-3">
              {officialLinks.map((doc) => (
                <a
                  key={doc.href}
                  href={doc.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-red-500 hover:text-white"
                >
                  {doc.label} →
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">X Live</p>
          <p className="mt-4 text-sm leading-7 text-zinc-400">
            The safe production path is to create the live source and broadcast in X Media Studio Producer,
            then configure Agentbot as the upstream station or downstream relay input. That is supportable and matches the official X guidance.
          </p>
        </section>
      </div>
    </main>
  )
}
