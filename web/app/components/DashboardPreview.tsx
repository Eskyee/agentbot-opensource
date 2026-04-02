export function DashboardPreview() {
  return (
    <div className="relative mt-8 sm:mt-12">
      {/* Gradient fade */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10 pointer-events-none h-20 bottom-0 top-auto" />
      
      {/* Browser chrome */}
      <div className="border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl shadow-black/50">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
          </div>
          <div className="flex-1 mx-4">
            <div className="bg-zinc-800 rounded px-3 py-1 text-[10px] text-zinc-500 font-mono text-center">
              agentbot.raveculture.xyz/dashboard
            </div>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="flex">
          {/* Sidebar */}
          <div className="w-48 border-r border-zinc-800 p-4 hidden sm:block">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-4">Agentbot</div>
            {['◈ Mission Control', '◎ Wallet', '⚡ Activity', '📊 Analytics', '⚙ Settings'].map((item, i) => (
              <div key={item} className={`text-[10px] py-1.5 px-2 rounded ${i === 0 ? 'text-white bg-zinc-800' : 'text-zinc-600'}`}>
                {item}
              </div>
            ))}
            <div className="mt-6 pt-4 border-t border-zinc-800">
              <div className="text-[10px] uppercase tracking-widest text-zinc-700 mb-2">Agents</div>
              {['the-strategist', 'crew-manager', 'sound-system'].map((agent, i) => (
                <div key={agent} className="flex items-center gap-2 py-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-green-500' : i === 1 ? 'bg-yellow-500' : 'bg-zinc-600'}`} />
                  <span className="text-[9px] text-zinc-500 font-mono">{agent}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 p-4 sm:p-6">
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'AGENTS', value: '3', sub: 'active' },
                { label: 'TASKS', value: '47', sub: 'completed today' },
                { label: 'UPTIME', value: '99.9%', sub: 'last 30 days' },
                { label: 'REVENUE', value: '$1.2k', sub: 'this month' },
              ].map((stat) => (
                <div key={stat.label} className="border border-zinc-800 p-3">
                  <div className="text-[9px] uppercase tracking-widest text-zinc-600 mb-1">{stat.label}</div>
                  <div className="text-lg font-bold text-white font-mono">{stat.value}</div>
                  <div className="text-[8px] text-zinc-700">{stat.sub}</div>
                </div>
              ))}
            </div>

            {/* Activity feed */}
            <div className="border border-zinc-800 p-4">
              <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">Recent Activity</div>
              {[
                { time: '2m ago', agent: 'the-strategist', action: 'Reviewed PR #47 — approved', status: 'green' },
                { time: '8m ago', agent: 'crew-manager', action: 'Invoice sent to client — £450', status: 'green' },
                { time: '15m ago', agent: 'sound-system', action: 'Stream monitored — 1.2k listeners', status: 'blue' },
                { time: '23m ago', agent: 'the-strategist', action: 'Standup summary generated', status: 'green' },
                { time: '41m ago', agent: 'crew-manager', action: 'Booking confirmed — Apr 12', status: 'yellow' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-zinc-900 last:border-0">
                  <div className={`w-1 h-1 rounded-full ${item.status === 'green' ? 'bg-green-500' : item.status === 'blue' ? 'bg-blue-500' : 'bg-yellow-500'}`} />
                  <span className="text-[9px] text-zinc-600 font-mono w-16 shrink-0">{item.time}</span>
                  <span className="text-[9px] text-zinc-500 font-mono w-24 shrink-0">{item.agent}</span>
                  <span className="text-[9px] text-zinc-400 truncate">{item.action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
