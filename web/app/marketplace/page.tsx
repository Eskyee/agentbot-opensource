import Link from 'next/link';

const templates = [
  {
    name: 'globe',
    role: 'Research Agent',
    description: 'Finds sources, summarizes insights, and delivers concise briefings in chat.',
    skills: ['Web Scraping', 'File Handling', 'Search']
  },
  {
    name: 'muso',
    role: 'Support Agent',
    description: 'Answers customer questions, drafts responses, and escalates edge cases.',
    skills: ['Email Management', 'Knowledge Base', 'Ticket Routing']
  },
  {
    name: 'studio',
    role: 'Lead Gen Agent',
    description: 'Collects prospects, enriches records, and drafts personalized outreach.',
    skills: ['Prospect Discovery', 'CRM Export', 'Email Drafting']
  }
];

const channels = ['Telegram', 'Discord', 'WhatsApp'];

export default function MarketplacePage() {
  return (
    <main className="min-h-screen px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Agent Marketplace</h1>
          <p className="mt-4 text-lg text-gray-400">
            Choose a template, install skills, and deploy your OpenClaw agent in under a minute.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {templates.map((template) => (
            <article key={template.name} className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <p className="text-xs uppercase tracking-wider text-lobster-400 mb-2">Template</p>
              <h2 className="text-2xl font-bold">{template.name}</h2>
              <p className="text-gray-300 mb-2">{template.role}</p>
              <p className="text-gray-400 text-sm mb-4">{template.description}</p>
              <div className="space-y-2 mb-6">
                {template.skills.map((skill) => (
                  <div key={skill} className="text-sm rounded-lg border border-gray-700 px-3 py-2">
                    {skill}
                  </div>
                ))}
              </div>
              <Link
                href="/signup"
                className="block w-full text-center rounded-full bg-lobster-500 px-4 py-3 font-semibold text-white hover:bg-lobster-400 transition-colors"
              >
                Use {template.name}
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
            <h3 className="text-xl font-semibold mb-3">Available channels</h3>
            <div className="flex flex-wrap gap-2">
              {channels.map((channel) => (
                <span key={channel} className="rounded-full border border-gray-700 px-3 py-1 text-sm text-gray-300">
                  {channel}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
            <h3 className="text-xl font-semibold mb-3">Coming soon</h3>
            <p className="text-gray-400 text-sm mb-4">
              Publish your own agents to the marketplace and share reusable setups with your team.
            </p>
            <Link href="/signup" className="text-lobster-400 hover:underline">
              Deploy your first agent →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
