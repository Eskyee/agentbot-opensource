export function HeroImage() {
  return (
    <div className="relative w-full aspect-[16/9] bg-black border border-zinc-800 overflow-hidden">
      {/* Grid pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Gradient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-500/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[100px]" />

      {/* Floating screens */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Main center screen */}
        <div className="relative z-10 bg-zinc-950 border border-zinc-800 w-[520px] h-[320px] shadow-2xl shadow-black/50">
          {/* Title bar */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800 bg-zinc-900/50">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-zinc-700" />
              <div className="w-2 h-2 rounded-full bg-zinc-700" />
              <div className="w-2 h-2 rounded-full bg-zinc-700" />
            </div>
            <div className="flex-1 mx-4">
              <div className="bg-zinc-800 rounded px-2 py-0.5 text-[8px] text-zinc-500 font-mono text-center">
                agentbot.raveculture.xyz/dashboard
              </div>
            </div>
          </div>
          {/* Dashboard content */}
          <div className="p-3 flex gap-2 h-full">
            {/* Sidebar */}
            <div className="w-24 border-r border-zinc-800 pr-2">
              <div className="text-[7px] uppercase tracking-widest text-zinc-600 mb-2">Agentbot</div>
              {['◈ Control', '⚡ Activity', '📊 Analytics'].map((item, i) => (
                <div
                  key={item}
                  className={`text-[7px] py-1 px-1 rounded mb-0.5 ${
                    i === 0 ? 'text-white bg-zinc-800' : 'text-zinc-600'
                  }`}
                >
                  {item}
                </div>
              ))}
              <div className="mt-3 pt-2 border-t border-zinc-800">
                <div className="text-[6px] uppercase tracking-widest text-zinc-700 mb-1">Agents</div>
                {['the-strategist', 'crew-mgr', 'sound-sys'].map((a, i) => (
                  <div key={a} className="flex items-center gap-1 py-0.5">
                    <div
                      className={`w-1 h-1 rounded-full ${
                        i === 0 ? 'bg-green-500' : i === 1 ? 'bg-yellow-500' : 'bg-zinc-600'
                      }`}
                    />
                    <span className="text-[6px] text-zinc-500 font-mono">{a}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Main area */}
            <div className="flex-1">
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                {[
                  { l: 'AGENTS', v: '3' },
                  { l: 'TASKS', v: '47' },
                  { l: 'UPTIME', v: '99.9%' },
                ].map((s) => (
                  <div key={s.l} className="border border-zinc-800 p-1.5">
                    <div className="text-[5px] uppercase tracking-widest text-zinc-600">{s.l}</div>
                    <div className="text-xs font-bold text-white font-mono">{s.v}</div>
                  </div>
                ))}
              </div>
              {/* Activity lines */}
              {[
                { dot: 'bg-green-500', t: 'the-strategist reviewed PR #47' },
                { dot: 'bg-green-500', t: 'crew-manager sent invoice — £450' },
                { dot: 'bg-blue-500', t: 'sound-system monitoring — 1.2k' },
                { dot: 'bg-green-500', t: 'standup summary generated' },
                { dot: 'bg-yellow-500', t: 'booking confirmed — Apr 12' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 py-0.5 border-b border-zinc-900 last:border-0">
                  <div className={`w-0.5 h-0.5 rounded-full ${item.dot}`} />
                  <span className="text-[6px] text-zinc-500 font-mono truncate">{item.t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Floating side screens */}
        <div className="absolute top-8 right-8 z-20 bg-zinc-950/90 border border-zinc-800/80 w-[180px] h-[120px] shadow-xl transform rotate-3 translate-x-4">
          <div className="flex items-center gap-1 px-2 py-1 border-b border-zinc-800">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
            <div className="text-[6px] text-zinc-600 font-mono">terminal</div>
          </div>
          <div className="p-2 font-mono">
            <div className="text-[6px] text-green-500">→ agent started</div>
            <div className="text-[6px] text-zinc-600">→ monitoring channels...</div>
            <div className="text-[6px] text-blue-400">→ message received: telegram</div>
            <div className="text-[6px] text-green-500">→ response sent: 142ms</div>
          </div>
        </div>

        <div className="absolute bottom-12 left-8 z-20 bg-zinc-950/90 border border-zinc-800/80 w-[160px] h-[100px] shadow-xl transform -rotate-2 -translate-x-2">
          <div className="flex items-center gap-1 px-2 py-1 border-b border-zinc-800">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
            <div className="text-[6px] text-zinc-600 font-mono">wallet</div>
          </div>
          <div className="p-2">
            <div className="text-[6px] text-zinc-500 mb-1">BALANCE</div>
            <div className="text-[10px] font-bold text-white font-mono">$1,247.50</div>
            <div className="text-[6px] text-zinc-600 mt-1">USDC · Base</div>
            <div className="flex gap-1 mt-1.5">
              <div className="h-1 bg-green-500/30 w-8 rounded-full">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '72%' }} />
              </div>
              <span className="text-[5px] text-zinc-600">+12%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black to-transparent" />
    </div>
  )
}
