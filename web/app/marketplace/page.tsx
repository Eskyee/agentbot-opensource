import Link from 'next/link';

const navItems = [
  { icon: '🤖', label: 'Agents', href: '/agents', active: false },
  { icon: '🛒', label: 'Marketplace', href: '/marketplace', active: true },
  { icon: '💳', label: 'Billing', href: '/billing', active: false },
  { icon: '⚙️', label: 'Account', href: '/settings', active: false },
]

function MarketplaceSidebar({ userName, credits = 0 }: { userName: string; credits?: number }) {
  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
      <div className="p-6 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🦞</span>
          <span className="text-xl font-bold">Agentbot</span>
        </Link>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                item.active 
                  ? 'bg-lobster-500/20 text-lobster-400' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="mt-8 p-4 bg-gray-800 rounded-xl">
          <div className="text-sm text-gray-400 mb-1">Credits</div>
          <div className="text-xl font-bold">${credits.toFixed(2)}</div>
        </div>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-lobster-500 rounded-full flex items-center justify-center font-bold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium">{userName}</div>
            <div className="text-sm text-gray-400">Free Trial</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

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
    <div className="flex h-screen bg-black text-white">
      <MarketplaceSidebar userName="User" credits={0.01} />

      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-6xl mx-auto">
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
              <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">Template</p>
              <h2 className="text-2xl font-bold text-white">{template.name}</h2>
              <p className="text-gray-300 mb-2">{template.role}</p>
              <p className="text-gray-400 text-sm mb-4">{template.description}</p>
              <div className="space-y-2 mb-6">
                {template.skills.map((skill) => (
                  <div key={skill} className="text-sm rounded-lg border border-gray-700 px-3 py-2 text-gray-200 bg-gray-800">
                    {skill}
                  </div>
                ))}
              </div>
              <Link
                href="/signup"
                className="block w-full text-center rounded-lg bg-gray-900 px-4 py-3 font-semibold text-white hover:bg-gray-700 transition-colors"
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
    </div>
  );
}
