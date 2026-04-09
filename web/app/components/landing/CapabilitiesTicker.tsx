'use client'

export function CapabilitiesTicker() {
  const capabilities = [
    'Summarize emails',
    'Auto-reply to messages',
    'Draft contracts',
    'Schedule meetings',
    'Track invoices',
    'Monitor competitors',
    'Generate content',
    'Manage communities',
    'Handle bookings',
    'Run payroll',
    'Research markets',
    'Create proposals',
    'Translate in real time',
    'Screen leads',
    'Track order shipments',
    'Draft social posts',
    'Analyze documents',
    'Coordinate outreach',
    'Monitor news',
    'Generate reports',
    'Manage files',
    'Execute shell commands',
    'Deploy code',
    'Run web scrapers',
  ]

  // Duplicate for seamless loop
  const items = [...capabilities, ...capabilities]

  return (
    <section className="border-t border-zinc-900 overflow-hidden">
      <div className="py-6 sm:py-8">
        <div className="text-[10px] uppercase tracking-widest text-zinc-600 text-center mb-4 sm:mb-6">
          What Your Agent Can Do
        </div>
        <div className="relative">
          <div className="flex animate-ticker whitespace-nowrap">
            {items.map((cap, i) => (
              <span
                key={i}
                className="inline-block px-4 sm:px-6 text-xs sm:text-sm text-zinc-500 hover:text-white transition-colors cursor-default shrink-0"
              >
                {cap}
                <span className="text-zinc-800 ml-4 sm:ml-6">·</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
