import Link from 'next/link';

const docsSections = [
  {
    title: 'Getting Started',
    description: 'Launch your first OpenClaw agent in under a minute and run your first message test.',
    items: ['60-second setup flow', 'Telegram bot connection', 'First-reply validation']
  },
  {
    title: 'Operate',
    description: 'Manage live instances and keep agents healthy from the dashboard.',
    items: ['Status + restart controls', 'Usage and basic stats', 'Recovery steps for common failures']
  },
  {
    title: 'Scale',
    description: 'Use platform capabilities to grow usage and automate external workflows.',
    items: ['Monitor: Real-time analytics and performance tracking', '💰 Monetize: Revenue share model for creators', '🔗 Integrate: Connect with REST API and webhooks']
  }
];

export default function ViewDocsPage() {
  return (
    <main className="min-h-screen px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">View Docs</h1>
        <p className="text-lg text-gray-400 mb-10">
          Everything you need to deploy, operate, and scale OpenClawDeploy.
        </p>

        <div className="grid gap-6 md:grid-cols-3">
          {docsSections.map((section) => (
            <article key={section.title} className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
              <h2 className="text-2xl font-semibold mb-3">{section.title}</h2>
              <p className="text-gray-400 text-sm mb-4">{section.description}</p>
              <ul className="space-y-2 text-sm text-gray-300">
                {section.items.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
          <h3 className="text-xl font-semibold mb-3">Core documentation</h3>
          <div className="flex flex-wrap gap-3">
            <Link href="/signup" className="rounded-full border border-gray-700 px-4 py-2 text-sm hover:border-lobster-500 hover:text-lobster-300 transition-colors">
              Signup
            </Link>
            <Link href="/marketplace" className="rounded-full border border-gray-700 px-4 py-2 text-sm hover:border-lobster-500 hover:text-lobster-300 transition-colors">
              Marketplace
            </Link>
            <Link href="/blog" className="rounded-full border border-gray-700 px-4 py-2 text-sm hover:border-lobster-500 hover:text-lobster-300 transition-colors">
              Blog
            </Link>
            <Link href="/terms" className="rounded-full border border-gray-700 px-4 py-2 text-sm hover:border-lobster-500 hover:text-lobster-300 transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="rounded-full border border-gray-700 px-4 py-2 text-sm hover:border-lobster-500 hover:text-lobster-300 transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
