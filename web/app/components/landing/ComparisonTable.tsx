export function ComparisonTable() {
  const rows = [
    { feature: 'Time to deploy', traditional: '60+ minutes', agentbot: 'Under 60 seconds' },
    { feature: 'Coding required', traditional: 'Yes (SSH, config files)', agentbot: 'None' },
    { feature: 'Server management', traditional: 'VPS, updates, monitoring', agentbot: 'Your machine, zero config' },
    { feature: 'Data sovereignty', traditional: 'Third-party cloud', agentbot: 'Your data stays with you' },
    { feature: 'AI model setup', traditional: 'Manual YAML configs', agentbot: 'BYOK — paste your key' },
    { feature: 'Crash recovery', traditional: 'Manual restart', agentbot: 'Auto-restart built in' },
    { feature: 'Multi-channel', traditional: 'Build it yourself', agentbot: 'Telegram, Discord, WhatsApp' },
    { feature: 'Payments', traditional: 'Stripe integration needed', agentbot: 'Onchain (Base, x402)' },
    { feature: 'Cost', traditional: 'VPS + time + debugging', agentbot: '£29/mo flat · No markup on LLM' },
  ]

  return (
    <section className="border-t border-zinc-900">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 py-14 sm:py-20">
        <div className="max-w-2xl mb-10 sm:mb-16">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Why Agentbot</div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tighter uppercase">
            The Old Way<br />
            <span className="text-zinc-700">vs. The Agent Way</span>
          </h2>
        </div>

        <div className="border border-zinc-800 bg-zinc-900/30 overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left p-3 sm:p-4 text-[10px] uppercase tracking-widest font-medium text-zinc-500 w-1/3">Feature</th>
                <th className="text-left p-3 sm:p-4 text-[10px] uppercase tracking-widest font-medium text-zinc-600 w-1/3">Traditional Setup</th>
                <th className="text-left p-3 sm:p-4 text-[10px] uppercase tracking-widest font-medium text-white w-1/3">Agentbot</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-zinc-800/50 last:border-b-0">
                  <td className="p-3 sm:p-4 text-xs sm:text-sm font-medium text-white">{row.feature}</td>
                  <td className="p-3 sm:p-4 text-xs sm:text-sm text-zinc-500">{row.traditional}</td>
                  <td className="p-3 sm:p-4 text-xs sm:text-sm text-zinc-300">{row.agentbot}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
